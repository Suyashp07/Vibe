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

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key || url.includes('your-project')) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_PRODUCTION_URL) {
    return process.env.NEXT_PUBLIC_PRODUCTION_URL.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!appUrl || appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
    // WhatsApp messages are sent to real phones that cannot connect to localhost.
    // Always use the live production URL for all WhatsApp links.
    return 'https://vibe-seven-pied.vercel.app';
  }
  return appUrl.replace(/\/$/, '');
}

/**
 * Dispatches an outbound message to a WhatsApp phone number via the bridge
 */
async function sendWhatsAppReply(toPhone: string, text: string): Promise<boolean> {
  const bridgeUrl = (process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');
  const secret = process.env.WHATSAPP_BRIDGE_SECRET || process.env.WHATSAPP_WEBHOOK_SECRET;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['Authorization'] = `Bearer ${secret}`;
  }

  try {
    const res = await fetch(`${bridgeUrl}/send-message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: toPhone, text }),
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
    if (!incomingHostMsg && !payload.imageBase64) {
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
    if (lowerText === '/start' || lowerText === '/help' || lowerText === 'help' || lowerText === 'hi') {
      const welcome = 
        `👋 *Welcome to Vibe Event Creator!*\n\n` +
        `You can create and publish events directly from WhatsApp:\n\n` +
        `📸 *Send a Poster:* Send or forward any event flyer image.\n` +
        `🔗 *Send a Link:* Paste a Luma, BookMyShow, District, or Unstop URL.\n` +
        `💬 *Send a Text:* Forward any event details message or blurb.\n\n` +
        `_Gemini AI will extract all details, create the event, and reply with your live link!_`;
      if (replyTarget) {
        await sendWhatsAppReply(replyTarget, welcome);
      }
      return NextResponse.json({ ok: true, handledBy: 'welcome_prompt' });
    }

    // Check if there is enough content to create an event
    const hasImage = Boolean(payload.imageBase64);
    const hasText = textContent.length > 5;

    if (!hasImage && !hasText) {
      return NextResponse.json({ ok: true, status: 'ignored_insufficient_content' });
    }

    console.log('[WhatsApp Webhook] Event creation request received from:', replyTarget, {
      hasImage,
      textLength: textContent.length,
    });

    // Send instant progress acknowledgment
    if (replyTarget) {
      await sendWhatsAppReply(replyTarget, '🔍 *Analyzing your event with Gemini AI...* Hang tight!');
    }

    const supabase = getSupabaseAdmin();
    let extracted: ExtractedEventData;
    let coverImageUrl: string | undefined = undefined;

    // A. Flyer Image Provided
    if (hasImage) {
      const cleanBase64 = payload.imageBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const mime = payload.imageMimeType || 'image/jpeg';

      // Upload poster to Supabase storage if available
      if (supabase) {
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
      extracted = await extractEventFromImage(buffer, mime, textContent || undefined);

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
    if (!coverImageUrl) {
      const finalCategory = extracted.category || detectCategoryFromText(extracted.title);
      coverImageUrl = getCategoryCover(finalCategory, extracted.title);
    }

    // Validate timestamps safely
    let validStartAt = new Date(Date.now() + 86400000).toISOString();
    try {
      if (extracted.start_at && !isNaN(new Date(extracted.start_at).getTime())) {
        validStartAt = new Date(extracted.start_at).toISOString();
      }
    } catch {}

    let validEndAt = new Date(new Date(validStartAt).getTime() + 10800000).toISOString();
    try {
      if (extracted.end_at && !isNaN(new Date(extracted.end_at).getTime())) {
        validEndAt = new Date(extracted.end_at).toISOString();
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

    // Resolve or Auto-Provision Organizer Profile by phone number
    let organizerId: string | undefined = undefined;
    if (supabase && senderPhone) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('phone', senderPhone)
          .maybeSingle();

        if (profileData) {
          organizerId = profileData.id;
        } else {
          // Provision an auth user to satisfy foreign key constraint on profiles(id)
          const userEmail = `${senderPhone}@whatsapp.vibe.community`;
          let authUserId: string | undefined = undefined;

          try {
            const { data: authData } = await supabase.auth.admin.createUser({
              email: userEmail,
              email_confirm: true,
              user_metadata: {
                name: senderName || 'Event Host',
                phone: senderPhone,
                role: 'organizer',
              },
            });
            authUserId = authData?.user?.id;
          } catch (createErr) {
            // User might already exist in auth.users
          }

          if (authUserId) {
            const { data: newProf } = await supabase
              .from('profiles')
              .upsert({
                id: authUserId,
                name: senderName || 'Event Host',
                phone: senderPhone,
                email: userEmail,
                role: 'organizer',
                onboarded: true,
              })
              .select('id')
              .maybeSingle();

            if (newProf) {
              organizerId = newProf.id;
            }
          }
        }
      } catch (profErr) {
        console.warn('[WhatsApp Webhook] Profile lookup error:', profErr);
      }
    }

    // Default fallback organizer ID if unlinked so organizer_id is never null
    if (!organizerId && supabase) {
      try {
        const { data: fallbackProf } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (fallbackProf) {
          organizerId = fallbackProf.id;
        }
      } catch (e) {
        // ignore
      }
    }

    // Insert into Supabase `public.events`
    const insertPayload = {
      slug: finalSlug,
      title: extracted.title || 'Untitled Event',
      tagline: extracted.tagline || `Experience the vibe in ${detectedCity}`,
      description:
        extracted.description ||
        `Join us for ${extracted.title || 'this gathering'} in ${detectedCity}. An intimate, curated experience bringing together passionate people.`,
      cover_image_url: coverImageUrl,
      template: extracted.template || 'grove',
      theme: {
        palette: extracted.template === 'ember' ? 'sunset' : 'forest',
        font: 'Inter',
        bg_style: 'solid',
        button_style: 'pill',
      },
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: extracted.venue_name || `${detectedCity} Venue`,
      location_address: extracted.location_address || `${detectedCity}, India`,
      city: detectedCity,
      start_at: validStartAt,
      end_at: validEndAt,
      timezone: 'Asia/Kolkata',
      capacity: 250,
      is_public: true,
      status: 'live', // Published live so host can immediately share!
      ai_generated: true,
      organizer_id: organizerId,
      source_type: finalSourceType,
      source_platform: finalSourcePlatform,
      external_ticket_url: finalTicketUrl,
      external_price_text: extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry'),
      faq: extracted.faq || [],
      rsvp_form_config: {
        ask_plus_one: true,
        ask_dietary: false,
        ask_tshirt: false,
        waitlist_enabled: true,
        confirmation_message: hasExternalUrl
          ? 'Redirecting to ticketing platform'
          : 'Your spot is confirmed! Present your pass with QR code at the entrance.',
      },
    };

    let createdEventSlug = finalSlug;
    let createdEventTitle = insertPayload.title;

    if (supabase) {
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

    // Send confirmation message to the organizer's WhatsApp
    const confirmationMsg = 
      `🎉 *YOUR EVENT IS LIVE ON VIBE!*\n\n` +
      `📌 *${createdEventTitle}*\n` +
      `📍 ${insertPayload.location_name}, ${insertPayload.city}\n` +
      `🕒 ${dateStr}\n\n` +
      `🔗 *Live Event Link:*\n${liveEventUrl}\n\n` +
      `💬 _Guests who click "Ask Organizer" on this page will message you directly here on WhatsApp!_`;

    if (replyTarget) {
      await sendWhatsAppReply(replyTarget, confirmationMsg);
    }

    console.log('[WhatsApp Webhook] Event successfully created via WhatsApp:', {
      slug: createdEventSlug,
      title: createdEventTitle,
      senderPhone,
    });

    return NextResponse.json({
      ok: true,
      handledBy: 'event_creation',
      event: {
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
