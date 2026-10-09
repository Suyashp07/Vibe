import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { whatsappAdapter } from '@/lib/communication/adapters/whatsappAdapter';
import { conversationService } from '@/lib/communication/conversationService';
import {
  extractEventFromImage,
  extractEventFromText,
  scrapeUrlMetadata,
  getCategoryCover,
  detectCategoryFromText,
  ExtractedEventData,
} from '@/lib/ai/eventExtractor';
import { calculateEventSurety } from '@/lib/eventSurety';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key || url.includes('your-project')) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAppUrl(req?: Request): string {
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      return `${proto}://${host}`;
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (envUrl && !envUrl.includes('vibe-by-swaniki.vercel.app') && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'https://vibe-seven-pied.vercel.app';
}

/**
 * Dispatches an outbound message to a WhatsApp phone number via the bridge
 */
async function sendWhatsAppReply(toPhone: string, text: string): Promise<boolean> {
  const bridgeUrl = (
    process.env.WHATSAPP_BRIDGE_URL ||
    'https://vibe-whatsapp-bridge.onrender.com'
  ).replace(/\/$/, '');
  const secret = process.env.WHATSAPP_BRIDGE_SECRET || process.env.WHATSAPP_WEBHOOK_SECRET || 'vibe_wa_sec_99a8b7c6d5e4f3a2b1';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['Authorization'] = `Bearer ${secret}`;
  }

  try {
    const res = await fetch(`${bridgeUrl}/send-message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: toPhone, text }),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch (err: any) {
    console.warn('[WhatsApp Webhook] Could not send reply to WhatsApp bridge (is bridge running?):', err.message);
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Vibe WhatsApp Ingestion & Communication Webhook',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Bridge Secret Token if configured
    if (!whatsappAdapter.verifyWebhook(req)) {
      console.warn('[WhatsApp Webhook] Unauthorized webhook request: token mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // 2. Process incoming message through adapter
    const incomingHostMsg = await whatsappAdapter.processIncomingMessage(payload);
    if (!incomingHostMsg && !payload.imageBase64 && !payload.imageUrl) {
      return NextResponse.json({ ok: true, status: 'ignored_empty' });
    }

    // 2.1 Handle duplicate webhook deliveries safely
    if (incomingHostMsg?.isDuplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const senderPhone = payload.senderPhone ? String(payload.senderPhone).replace(/[^0-9]/g, '') : '';
    const senderJid = payload.senderJid || (senderPhone ? `${senderPhone}@s.whatsapp.net` : '');
    const replyTarget = senderJid || senderPhone;
    const senderName = payload.senderName || 'Host';
    const textContent = (payload.text || '').trim();

    // -------------------------------------------------------------
    // FLOW 1: HOST ↔ GUEST COMMUNICATION GATEWAY (QUOTED REPLIES)
    // -------------------------------------------------------------
    let conv = null;

    if (incomingHostMsg?.conversationId) {
      conv = await conversationService.getConversationById(incomingHostMsg.conversationId);
    }

    if (!conv && payload.quotedMessageId) {
      conv = await conversationService.resolveConversationByQuotedMessage(payload.quotedMessageId);
    }

    if (conv) {
      if (conv.status === 'CLOSED') {
        console.warn('[WhatsApp Webhook] Host attempted reply on closed conversation:', conv.id);
        if (replyTarget) {
          await sendWhatsAppReply(replyTarget, '⚠️ This conversation has been closed.');
        }
        return NextResponse.json({
          ok: true,
          warning: 'Conversation is closed',
          conversationId: conv.id,
        });
      }

      const savedMsg = await conversationService.postHostMessage({
        conversationId: conv.id,
        senderId: senderPhone || 'whatsapp-host',
        content: incomingHostMsg?.messageContent || textContent,
        channel: 'WHATSAPP',
        externalMessageId: incomingHostMsg?.externalMessageId,
      });

      console.log('[WhatsApp Webhook] Host message routed to Vibe conversation:', {
        conversationId: conv.id,
        messageId: savedMsg.id,
        externalMessageId: incomingHostMsg?.externalMessageId,
      });

      return NextResponse.json({
        ok: true,
        handledBy: 'communication_gateway',
        conversationId: conv.id,
        messageId: savedMsg.id,
      });
    }

    // -------------------------------------------------------------
    // FLOW 2: EVENT CREATION FROM WHATSAPP (FLYER IMAGE, LINK, BLURB)
    // -------------------------------------------------------------
    const lowerText = textContent.toLowerCase();

    // Handle greeting or help command
    const isGreeting =
      lowerText === '/start' ||
      lowerText === '/help' ||
      lowerText === 'help' ||
      lowerText === 'hi' ||
      lowerText === 'hello' ||
      lowerText === 'hey' ||
      lowerText === 'start';

    if (isGreeting) {
      const welcome = 
        `👋 *Welcome to Vibe Event Creator!*\n\n` +
        `You can create and publish events directly from WhatsApp:\n\n` +
        `⚡ *Flash Vibe / Meetup:* Send "/vibe <details>" (e.g. "/vibe Box cricket at Bandra Turf tonight 8 PM. Need 4 players") to post straight to the *Vibe Instant* feed!\n` +
        `📸 *Send a Poster:* Send or forward any event flyer image.\n` +
        `🔗 *Send a Link:* Paste a Luma, BookMyShow, District, or Unstop URL.\n` +
        `💬 *Send a Text:* Forward any event details message or blurb.\n\n` +
        `_Gemini AI will extract all details, create the event, and reply with your live link!_`;
      let replyDispatched = false;
      if (replyTarget) {
        replyDispatched = await sendWhatsAppReply(replyTarget, welcome);
      }
      return NextResponse.json({
        ok: true,
        handledBy: 'welcome_prompt',
        replyText: replyDispatched ? undefined : welcome,
        replyDispatched,
      });
    }

    // Check flyer image presence
    const hasImage = Boolean(payload.imageBase64 || payload.imageUrl);

    // Check ticketing URLs
    const hasTicketingLink = Boolean(
      textContent.match(/\b(lu\.ma|bookmyshow\.com|district\.in|insider\.in|unstop\.com|eventbrite\.com|meetup\.com|allevents\.in)\b/i)
    );
    const hasAnyLink = Boolean(textContent.match(/https?:\/\/[^\s]+/i));

    // Bare command / greeting guard
    const cleanLowerText = lowerText.trim();
    const isBareCommand =
      /^(?:\/vibe|\/flash|\/event|\/create|vibe:|flash:|event:|⚡|new event|create event|add event|make event|test|testing)$/i.test(cleanLowerText);

    if (isBareCommand && !hasImage && !hasAnyLink) {
      const hint =
        `💡 *To create an event on Vibe, please include details:*\n\n` +
        `• Send */vibe <details>* (e.g. \`/vibe Turf cricket tonight 8 PM at Bandra\`)\n` +
        `• Or send/forward any *event flyer poster*\n` +
        `• Or paste an event link from Luma, BookMyShow, or District!`;
      let replyDispatched = false;
      if (replyTarget) {
        replyDispatched = await sendWhatsAppReply(replyTarget, hint);
      }
      return NextResponse.json({
        ok: true,
        handledBy: 'guidance_hint',
        replyText: replyDispatched ? undefined : hint,
        replyDispatched,
      });
    }

    // Explicit command prefix
    const hasCommandPrefix =
      lowerText.startsWith('/vibe') ||
      lowerText.startsWith('/flash') ||
      lowerText.startsWith('/event') ||
      lowerText.startsWith('/create') ||
      lowerText.startsWith('vibe:') ||
      lowerText.startsWith('flash:') ||
      lowerText.startsWith('event:') ||
      lowerText.startsWith('⚡');

    // Event keywords
    const hasEventKeywords =
      /\b(cricket|match|play|badminton|pickleball|football|turf|chai|coffee|cafe|tea|meetup|midnight chai|casual meetup|pickup game|anyone up for|looking for \d+ players|quick meetup|to play|to meetup|hangout|jam|jamming|acoustic|board games?|chess|poker|potluck|pub crawl|walk|sprint|coworking|cycling|running|jogging|tournament|rsvp|tickets?|registration|venue|timing|entry free|entry fee|curated by|hosted by|doors open|lineup|line-up|hackathon|workshop|standup|comedy|concert|gig|party)\b/i.test(textContent);

    const isExplicitEvent = hasImage || (hasCommandPrefix && textContent.length > 10) || hasTicketingLink;
    const isImplicitEvent = (textContent.length >= 25 && hasEventKeywords) || (hasAnyLink && textContent.length >= 20);

    if (!isExplicitEvent && !isImplicitEvent) {
      const hint =
        `💡 *Want to create an event on Vibe?*\n\n` +
        `• Send */vibe <details>* (e.g. \`/vibe Turf cricket tonight 8 PM at Bandra\`)\n` +
        `• Or send/forward any *event flyer poster*\n` +
        `• Or paste an event link from Luma, BookMyShow, or District!`;
      let replyDispatched = false;
      if (replyTarget && textContent.length > 0) {
        replyDispatched = await sendWhatsAppReply(replyTarget, hint);
      }
      return NextResponse.json({
        ok: true,
        handledBy: 'guidance_hint',
        replyText: replyDispatched ? undefined : hint,
        replyDispatched,
      });
    }

    // Detect Flash Vibe intent
    const isFlashVibe =
      hasCommandPrefix ||
      (!hasImage && !hasTicketingLink && textContent.length < 400);

    let flashActivity: string = 'other';
    if (/\b(cricket|box cricket|gully cricket|match|batting|bowling)\b/i.test(textContent)) flashActivity = 'cricket';
    else if (/\b(badminton|shuttle)\b/i.test(textContent)) flashActivity = 'badminton';
    else if (/\b(pickleball|paddle)\b/i.test(textContent)) flashActivity = 'pickleball';
    else if (/\b(football|futsal|soccer)\b/i.test(textContent)) flashActivity = 'football';
    else if (/\b(chai|coffee|cafe|tea)\b/i.test(textContent)) flashActivity = 'coffee';
    else if (/\b(board games?|catan|chess|poker)\b/i.test(textContent)) flashActivity = 'games';
    else if (/\b(jam|acoustic|guitar|music|singing)\b/i.test(textContent)) flashActivity = 'music';
    else if (/\b(sprint|code|hack|hackathon|laptop|work|coworking)\b/i.test(textContent)) flashActivity = 'sprint';

    console.log('[WhatsApp Webhook] Event creation request received from:', replyTarget, {
      hasImage,
      hasImageUrl: Boolean(payload.imageUrl),
      textLength: textContent.length,
      isFlashVibe,
      flashActivity,
    });

    const supabase = getSupabaseAdmin();

    // Early Deduplication Guard: Check if an event was created by this host in the last 120 seconds
    if (supabase && (senderPhone || replyTarget)) {
      try {
        const { data: recentEvents } = await supabase
          .from('events')
          .select('id, slug, title, created_at, theme')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentEvents && recentEvents.length > 0) {
          const now = Date.now();
          const cleanPhone = (senderPhone || replyTarget).replace(/[^0-9]/g, '');

          for (const ev of recentEvents) {
            const evCreated = new Date(ev.created_at).getTime();
            const ageMs = now - evCreated;
            if (ageMs > 120000) continue; // older than 2 minutes, ignore

            const hostPhone = (ev.theme?.whatsapp_host_phone || '').replace(/[^0-9]/g, '');
            const isSameHost = hostPhone && cleanPhone && (hostPhone === cleanPhone || cleanPhone.includes(hostPhone) || hostPhone.includes(cleanPhone));

            // Check title similarity: words from existing title present in incoming text
            const existingTitle = (ev.title || '').toLowerCase();
            const rawTextLower = textContent.toLowerCase();
            const titleWords = existingTitle.split(/\s+/).filter((w: string) => w.length > 3);
            const matchesTitleWords = titleWords.length > 0 && titleWords.some((w: string) => rawTextLower.includes(w));
            const hasSimilarKeywords = Boolean(
              existingTitle && (
                rawTextLower.includes(existingTitle) ||
                existingTitle.includes(rawTextLower.slice(0, 30)) ||
                matchesTitleWords
              )
            );

            // It is a duplicate ONLY if it is the same host AND the event content/title is similar
            if (isSameHost && hasSimilarKeywords) {
              console.warn('[WhatsApp Webhook] 🛑 Early suppressed duplicate event request within 120s window:', {
                existingSlug: ev.slug,
                existingTitle: ev.title,
                ageMs,
                cleanPhone,
                hostPhone,
              });

              return NextResponse.json({
                ok: true,
                handledBy: 'duplicate_suppressed',
                duplicate: true,
                replyDispatched: true, // Crucial: signals bridge NOT to send any reply message
                existingEvent: {
                  slug: ev.slug,
                  title: ev.title,
                  url: `${getAppUrl()}/${ev.slug}`,
                },
              });
            }
          }
        }
      } catch (earlyDedupErr: any) {
        console.warn('[WhatsApp Webhook] Early duplicate check warning:', earlyDedupErr.message);
      }
    }

    // Send instant progress acknowledgment
    if (replyTarget) {
      const progressMsg = isFlashVibe
        ? '⚡ *Creating your Flash Vibe with Gemini AI...* Posting directly to Vibe Instant!'
        : '🔍 *Analyzing your event with Gemini AI...* Hang tight!';
      sendWhatsAppReply(replyTarget, progressMsg).catch((err) => {
        console.warn('[WhatsApp Webhook] Progress reply notice:', err.message);
      });
    }

    let extracted: ExtractedEventData;
    let coverImageUrl: string | undefined = payload.imageUrl || undefined;

    // A. Flyer Image Provided
    if (hasImage) {
      let buffer: Buffer;
      const mime = payload.imageMimeType || 'image/jpeg';

      if (payload.imageBase64) {
        const cleanBase64 = payload.imageBase64.replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(cleanBase64, 'base64');
      } else if (payload.imageUrl) {
        try {
          const imgRes = await fetch(payload.imageUrl);
          const arrayBuf = await imgRes.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        } catch {
          buffer = Buffer.alloc(0);
        }
      } else {
        buffer = Buffer.alloc(0);
      }

      // Upload poster to Supabase storage if not yet uploaded
      if (!coverImageUrl && buffer.length > 0 && supabase) {
        try {
          const fileExt = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
          const fileName = `whatsapp-${Date.now()}-${nanoid(6)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('event-covers')
            .upload(fileName, buffer, { contentType: mime, upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('event-covers')
              .getPublicUrl(fileName);
            coverImageUrl = publicUrlData?.publicUrl;
          }
        } catch (storageErr) {
          console.warn('[WhatsApp Webhook] Storage upload fallback:', storageErr);
        }
      }

      // Extract details via Gemini Vision OCR
      if (buffer.length > 0) {
        extracted = await extractEventFromImage(buffer, mime, textContent || undefined);
      } else {
        extracted = await extractEventFromText(textContent || 'Event');
      }

      // Scrape any URL present in caption
      const captionUrlMatch = textContent.match(/(https?:\/\/[^\s]+)/i);
      if (captionUrlMatch) {
        try {
          const scraped = await scrapeUrlMetadata(captionUrlMatch[1].trim());
          if (scraped.price) extracted.price_text = scraped.price;
          if (!extracted.ticket_url) extracted.ticket_url = captionUrlMatch[1].trim();
          if (scraped.platform && scraped.platform !== 'whatsapp') {
            extracted.source_platform = scraped.platform;
          }
        } catch (e) {
          // ignore scraping failure
        }
      }
    } 
    // B. Text Blurb or Link Provided
    else {
      extracted = await extractEventFromText(textContent);
      const finalCategory =
        extracted.category || detectCategoryFromText(`${extracted.title} ${textContent}`);
      coverImageUrl =
        extracted.cover_image_url || getCategoryCover(finalCategory, extracted.title);
    }

    // Determine cover fallback
    const FLASH_COVERS: Record<string, string> = {
      cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
      football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
      badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
      pickleball: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
      coffee: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      games: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
      music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
      sprint: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
      other: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    };

    if (!coverImageUrl) {
      if (isFlashVibe) {
        coverImageUrl = FLASH_COVERS[flashActivity] || FLASH_COVERS['other'];
      } else {
        const finalCategory = extracted.category || detectCategoryFromText(extracted.title);
        coverImageUrl = getCategoryCover(finalCategory, extracted.title);
      }
    }

    // Validate timestamps safely — ensure events are NEVER placed in the past
    let validStartAt = isFlashVibe
      ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // Flash vibes default to starting in 2 hours
      : new Date(Date.now() + 86400000).toISOString();

    try {
      if (extracted.start_at && !isNaN(new Date(extracted.start_at).getTime())) {
        const parsedTime = new Date(extracted.start_at).getTime();
        // If extracted start date is in the past by > 1 hour, shift forward to future
        if (parsedTime < Date.now() - 3600000) {
          console.log('[WhatsApp Webhook] Extracted start_at is in past, adjusting forward:', extracted.start_at);
          validStartAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        } else {
          validStartAt = new Date(extracted.start_at).toISOString();
        }
      }
    } catch {}

    let validEndAt = new Date(new Date(validStartAt).getTime() + (isFlashVibe ? 7200000 : 10800000)).toISOString();
    try {
      if (extracted.end_at && !isNaN(new Date(extracted.end_at).getTime())) {
        const parsedEndTime = new Date(extracted.end_at).getTime();
        if (parsedEndTime > new Date(validStartAt).getTime()) {
          validEndAt = new Date(extracted.end_at).toISOString();
        }
      }
    } catch {}

    // Generate clean lowercase URL slug
    const cleanBaseSlug = (extracted.suggested_slug || extracted.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    const suffix = nanoid(5).toLowerCase().replace(/[^a-z0-9]/g, '0');
    const finalSlug = `${cleanBaseSlug || 'event'}-${suffix}`;
    const detectedCity = extracted.city || 'Mumbai';

    // Platform & ticketing normalization
    const rawTicketUrl = extracted.ticket_url?.trim();
    const normalizedTicketUrl = rawTicketUrl
      ? rawTicketUrl.startsWith('http://') || rawTicketUrl.startsWith('https://')
        ? rawTicketUrl
        : `https://${rawTicketUrl}`
      : undefined;

    const hasExternalUrl = Boolean(
      normalizedTicketUrl &&
      extracted.source_platform &&
      !['vibe', 'whatsapp', 'manual'].includes(extracted.source_platform.toLowerCase())
    );

    const finalSourceType: 'native' | 'external' = hasExternalUrl ? 'external' : 'native';
    const finalSourcePlatform = hasExternalUrl ? extracted.source_platform : undefined;
    const finalTicketUrl = hasExternalUrl ? normalizedTicketUrl : undefined;

    // Resolve Organizer Profile by phone number safely
    let organizerId: string | null = null;
    if (supabase && senderPhone) {
      try {
        const cleanDigits = senderPhone.replace(/\D/g, '');
        const last10 = cleanDigits.slice(-10);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name')
          .or(`phone.eq.${cleanDigits},phone.eq.${last10},phone.eq.+91${last10},phone.eq.91${last10}`)
          .maybeSingle();

        if (profileData?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileData.id)) {
          organizerId = profileData.id;
        }
      } catch (profErr) {
        console.warn('[WhatsApp Webhook] Profile lookup error:', profErr);
      }
    }

    // Calculate event completeness and surety percentage
    const surety = calculateEventSurety({
      title: extracted.title,
      venue_name: extracted.venue_name,
      location_address: extracted.location_address,
      city: detectedCity,
      start_at: validStartAt,
      end_at: validEndAt,
      cover_image_url: coverImageUrl,
      price_text: extracted.price_text,
      description: extracted.description,
      date_inferred: extracted.date_inferred,
      time_inferred: extracted.time_inferred,
      venue_inferred: extracted.venue_inferred,
      city_inferred: extracted.city_inferred,
    });

    const suretyScore = surety.score; // 0 to 100%
    const isAutoApproved = isFlashVibe || surety.autoApproved;
    const approvalStatus = isAutoApproved ? 'approved' : 'pending';
    const eventStatus = isAutoApproved ? 'live' : 'draft';
    const isPublic = isAutoApproved;

    // Detect if user explicitly asked for a specific number of spots/people/players
    let requestedSpots: number | undefined = undefined;
    const spotsMatch =
      textContent.match(/\b(?:need|looking for|for|capacity|limit of|max|only)\s+(\d{1,2})\s*(?:players?|people|persons?|members?|spots?|folks?|friends?|guys?|heads?)\b/i) ||
      textContent.match(/\b(\d{1,2})\s*(?:players?|people|persons?|members?|spots?)\s*(?:needed|wanted|open|left|only)\b/i) ||
      textContent.match(/\b(\d{1,2})\s*v\s*(\d{1,2})\b/i);

    if (spotsMatch) {
      if (spotsMatch[0].toLowerCase().includes('v')) {
        const parts = spotsMatch[0].split(/v/i);
        requestedSpots = (parseInt(parts[0]) || 6) + (parseInt(parts[1]) || 6);
      } else {
        requestedSpots = parseInt(spotsMatch[1]);
      }
    }

    // Insert into Supabase `public.events`
    // All events created via WhatsApp bot belong strictly to the Vibe Instant stream
    const insertPayload = {
      slug: finalSlug,
      title: extracted.title || 'Untitled Event',
      tagline: extracted.tagline || `Experience the vibe in ${detectedCity}`,
      description:
        extracted.description ||
        `Join us for ${extracted.title || 'this gathering'} in ${detectedCity}. An intimate, curated experience bringing together passionate people.`,
      cover_image_url: coverImageUrl,
      template: 'ember',
      theme: {
        palette: 'sunset',
        font: 'Inter',
        bg_style: 'solid',
        button_style: 'pill',
        is_flash: true,
        created_via: 'bot',
        source_platform: 'whatsapp',
        flash_activity: flashActivity,
        whatsapp_host_phone: senderPhone,
        vibe_cheers_count: 0,
        spots_limit: requestedSpots,
        spots_filled: requestedSpots ? 1 : 0,
        confidence_score: suretyScore / 100,
        missing_aspects: surety.missingAspects,
        approval_status: approvalStatus,
        admin_approved: isAutoApproved,
      },
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: extracted.venue_name || `${detectedCity} Venue`,
      location_address: extracted.location_address || `${detectedCity}, India`,
      city: detectedCity,
      start_at: validStartAt,
      end_at: validEndAt,
      timezone: 'Asia/Kolkata',
      capacity: requestedSpots || 12,
      is_public: isPublic,
      status: eventStatus,
      confidence_score: suretyScore / 100,
      ai_generated: true,
      organizer_id: organizerId,
      source_type: 'bot',
      source_platform: 'whatsapp',
      external_ticket_url: finalTicketUrl,
      external_price_text: extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry'),
      faq: extracted.faq || [],
      rsvp_form_config: {
        ask_plus_one: true,
        ask_dietary: false,
        ask_tshirt: false,
        waitlist_enabled: true,
        is_flash: true,
        confirmation_message: `You're confirmed for ${extracted.title || 'this flash vibe'}! Coordinate directly with host on WhatsApp.`,
      },
    };

    let createdEventSlug = finalSlug;
    let createdEventTitle = insertPayload.title;

    if (supabase) {
      // 1. Guard against duplicate event creation from the same host phone within a 60-second window
      if (senderPhone) {
        try {
          const { data: recentDuplicate } = await supabase
            .from('events')
            .select('id, slug, title, created_at')
            .filter('theme->>whatsapp_host_phone', 'eq', senderPhone)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentDuplicate && recentDuplicate.created_at) {
            const timeSinceLastEventMs = Date.now() - new Date(recentDuplicate.created_at).getTime();
            const existingTitle = (recentDuplicate.title || '').toLowerCase();
            const newTitle = (insertPayload.title || '').toLowerCase();

            // If created within the last 60 seconds and matches title
            if (
              timeSinceLastEventMs < 60000 &&
              (existingTitle === newTitle ||
               existingTitle.includes(newTitle) ||
               newTitle.includes(existingTitle))
            ) {
              console.warn('[WhatsApp Webhook] 🛑 Suppressed duplicate event creation within 60s window:', {
                existingSlug: recentDuplicate.slug,
                newTitle: insertPayload.title,
                timeSinceLastEventMs,
              });

              return NextResponse.json({
                ok: true,
                handledBy: 'duplicate_suppressed',
                duplicate: true,
                replyDispatched: true, // Signals bridge not to send any reply
                existingEvent: {
                  slug: recentDuplicate.slug,
                  title: recentDuplicate.title,
                  url: `${getAppUrl()}/${recentDuplicate.slug}`,
                },
              });
            }
          }
        } catch (dedupErr: any) {
          console.warn('[WhatsApp Webhook] Duplicate check warning:', dedupErr.message);
        }
      }

      try {
        const { data: savedEvent, error: insertError } = await supabase
          .from('events')
          .insert(insertPayload)
          .select('id, slug, title')
          .single();

        if (savedEvent) {
          createdEventSlug = savedEvent.slug;
          createdEventTitle = savedEvent.title;
        } else if (insertError) {
          console.error('[WhatsApp Webhook] Event insert error:', insertError);
        }
      } catch (dbErr: any) {
        console.error('[WhatsApp Webhook] Supabase insert failed:', dbErr.message);
      }
    }

    // Format friendly date string in IST
    const eventDate = new Date(insertPayload.start_at);
    const dateStr = eventDate.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const appUrl = getAppUrl();
    const liveEventUrl = `${appUrl}/${createdEventSlug}`;
    const liveReelUrl = `${appUrl}/vibes?event=${createdEventSlug}`;

    // Send confirmation message to the organizer's WhatsApp
    let confirmationMsg = '';
    if (isAutoApproved) {
      if (isFlashVibe) {
        confirmationMsg =
          `⚡ *YOUR EVENT IS AUTO-APPROVED & LIVE ON VIBE INSTANT!* (${suretyScore}% Surety)\n\n` +
          `🔥 *${createdEventTitle}*\n` +
          `📍 ${insertPayload.location_name}, ${insertPayload.city}\n` +
          `🕒 ${dateStr}\n\n` +
          `✅ *Auto-Approved:* Full event details verified (${suretyScore}% Surety)\n\n` +
          `📱 *Open in Vibe Instant:*\n${liveReelUrl}\n\n` +
          `🌐 *Full Event & RSVP Pass:*\n${liveEventUrl}\n\n` +
          `📲 _Forward this link to your group or squad — friends can swipe to your card and tap "I'm In" to join in 1 second!_`;
      } else {
        confirmationMsg = 
          `🎉 *YOUR EVENT IS AUTO-APPROVED & LIVE ON VIBE!* (${suretyScore}% Surety)\n\n` +
          `📌 *${createdEventTitle}*\n` +
          `📍 ${insertPayload.location_name}, ${insertPayload.city}\n` +
          `🕒 ${dateStr}\n\n` +
          `✅ *Auto-Approved:* Full event details verified (${suretyScore}% Surety)\n\n` +
          `🔗 *Live Event Link:*\n${liveEventUrl}\n\n` +
          `💬 _Guests who click "Ask Organizer" on this page will message you directly here on WhatsApp!_`;
      }
    } else {
      const missingList = surety.missingAspects.length > 0
        ? surety.missingAspects.map(a => `• ${a}`).join('\n')
        : '• Place / venue details not fully specified';

      confirmationMsg =
        `⏳ *EVENT SUBMITTED FOR ADMIN APPROVAL* (${suretyScore}% Surety)\n\n` +
        `📌 *${createdEventTitle}*\n` +
        `📍 ${insertPayload.location_name}, ${insertPayload.city}\n` +
        `🕒 ${dateStr}\n\n` +
        `⚠️ *Aspects Not Given By User:* \n${missingList}\n\n` +
        `🛡️ _Because event surety is under 90%, our team has queued your event for admin approval. Once approved, it will be published live!_\n\n` +
        `🔗 *Review Draft Preview:*\n${liveEventUrl}`;
    }

    console.log('[WhatsApp Webhook] Event successfully created via WhatsApp:', {
      slug: createdEventSlug,
      title: createdEventTitle,
      senderPhone,
    });

    return NextResponse.json({
      ok: true,
      handledBy: 'event_creation',
      replyText: confirmationMsg,
      eventDetails: {
        slug: createdEventSlug,
        title: createdEventTitle,
        url: liveEventUrl,
      },
    });
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Error processing incoming payload:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
