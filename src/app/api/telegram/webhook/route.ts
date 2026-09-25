import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendTelegramMessage,
  editTelegramMessage,
  answerTelegramCallback,
  downloadTelegramFileBuffer,
} from '@/lib/telegram';
import {
  extractEventFromImage,
  extractEventFromText,
  scrapeUrlMetadata,
  getCategoryCover,
  detectCategoryFromText,
  ExtractedEventData,
} from '@/lib/ai/eventExtractor';
import { calculateEventSurety } from '@/lib/eventSurety';
import { nanoid } from 'nanoid';
import { telegramAdapter } from '@/lib/communication/adapters/telegramAdapter';
import { conversationService } from '@/lib/communication/conversationService';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://vibe-seven-pied.vercel.app')
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Vibe Telegram Ingestion Webhook',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  let update: any = null;
  try {
    // 0. Verify Telegram Webhook Secret Token if configured (Security Requirement 11)
    if (!telegramAdapter.verifyWebhook(req)) {
      console.warn('[Telegram Webhook] Unauthorized webhook request: token mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    update = await req.json();

    // 1. Handle Inline Button Callback Queries (Approve / Discard)
    if (update.callback_query) {
      const cq = update.callback_query;
      const senderId = cq.from.id;
      const chatId = cq.message.chat.id;
      const messageId = cq.message.message_id;
      const data = cq.data || '';

      const supabase = getSupabaseAdmin();
      const appUrl = getAppUrl();

      if (data.startsWith('publish_instant:')) {
        const eventId = data.replace('publish_instant:', '');
        const { data: current, error } = await supabase
          .from('events')
          .select('id, slug, title, theme, rsvp_form_config')
          .eq('id', eventId)
          .single();

        if (error || !current) {
          await answerTelegramCallback(cq.id, 'Failed to publish event', true);
          return NextResponse.json({ ok: true });
        }

        await supabase
          .from('events')
          .update({
            status: 'live',
            is_public: true,
            theme: { ...(current.theme || {}), is_flash: true },
            rsvp_form_config: { ...(current.rsvp_form_config || {}), is_flash: true },
            updated_at: new Date().toISOString(),
          })
          .eq('id', eventId);

        await answerTelegramCallback(cq.id, '⚡ Published to Vibe Instant!');

        const instantLink = `${appUrl}/vibes?event=${current.slug}`;
        const publishedText = `⚡ <b>EVENT IS LIVE ON VIBE INSTANT!</b>\n\n📌 <b>${current.title}</b>\n🔗 <a href="${instantLink}">${instantLink}</a>\n\n<i>Swipe full-screen in Vibe Instant stream right now!</i>`;

        await editTelegramMessage(chatId, messageId, publishedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚡ Open in Vibe Instant ↗', url: instantLink }],
            ],
          },
        });

        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('publish:')) {
        const eventId = data.replace('publish:', '');
        const { data: updatedEvent, error } = await supabase
          .from('events')
          .update({ status: 'live', is_public: true, updated_at: new Date().toISOString() })
          .eq('id', eventId)
          .select('id, title, slug, start_at, location_name')
          .single();

        if (error || !updatedEvent) {
          await answerTelegramCallback(cq.id, 'Failed to publish event', true);
          return NextResponse.json({ ok: true });
        }

        await answerTelegramCallback(cq.id, '🚀 Published Live!');

        const eventLink = `${appUrl}/${updatedEvent.slug}`;
        const publishedText = `🎉 <b>EVENT IS LIVE ON VIBE!</b>\n\n📌 <b>${updatedEvent.title}</b>\n📍 ${updatedEvent.location_name}\n🔗 <a href="${eventLink}">${eventLink}</a>\n\n<i>Anyone can now discover and view this event on Vibe!</i>`;

        await editTelegramMessage(chatId, messageId, publishedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 View Live Page ↗', url: eventLink }],
            ],
          },
        });

        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('discard:')) {
        const eventId = data.replace('discard:', '');
        await supabase.from('events').delete().eq('id', eventId);
        await answerTelegramCallback(cq.id, 'Event discarded');
        await editTelegramMessage(chatId, messageId, '❌ <b>Event draft discarded.</b>', {
          parse_mode: 'HTML',
        });
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('copy:')) {
        await answerTelegramCallback(cq.id, 'Link ready to share!');
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Handle Incoming Messages
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    if (update.message.from?.is_bot) {
      return NextResponse.json({ ok: true });
    }

    // 2A. Communication Gateway Interception (Host Replies from Telegram Topic)
    const incomingHostMsg = await telegramAdapter.processIncomingMessage(update);
    if (incomingHostMsg) {
      // 2A.1 Handle duplicate webhook deliveries safely
      if (incomingHostMsg.isDuplicate) {
        return NextResponse.json({ ok: true, duplicate: true });
      }

      let conv = null;
      if (incomingHostMsg.conversationId) {
        conv = await conversationService.getConversationById(incomingHostMsg.conversationId);
      }
      if (!conv && incomingHostMsg.telegramTopicId) {
        conv = await conversationService.resolveConversationByTopic(
          incomingHostMsg.telegramTopicId,
          incomingHostMsg.telegramChatId
        );
      }

      // 2A.2 Exact mapping matched
      if (conv) {
        if (conv.status === 'CLOSED') {
          console.warn('[Telegram Webhook] Host attempted reply on closed conversation:', conv.id);
          return NextResponse.json({
            ok: true,
            warning: 'Conversation is closed',
            conversationId: conv.id,
          });
        }

        const savedMsg = await conversationService.postHostMessage({
          conversationId: conv.id,
          senderId: incomingHostMsg.senderId || 'telegram-host',
          content: incomingHostMsg.messageContent,
          channel: 'TELEGRAM',
          externalMessageId: incomingHostMsg.externalMessageId,
        });

        console.log('[Telegram Webhook] Host message routed to Vibe conversation:', {
          conversationId: conv.id,
          messageId: savedMsg.id,
          topicId: incomingHostMsg.telegramTopicId,
          chatId: incomingHostMsg.telegramChatId,
        });

        return NextResponse.json({
          ok: true,
          handledBy: 'communication_gateway',
          conversationId: conv.id,
          messageId: savedMsg.id,
        });
      }

      // 2A.3 Unmapped topic handling: Let message fall through to Event Creation flow
      if (incomingHostMsg.telegramTopicId || incomingHostMsg.isUnmapped) {
        console.log('[Telegram Webhook] Unmapped topic message, proceeding to AI Event Creation flow:', {
          chatId: incomingHostMsg.telegramChatId,
          topicId: incomingHostMsg.telegramTopicId,
        });
      }
    }

    // 3. Existing Event Flyer / Link Submission Ingestion Flow
    const message = update.message;
    const chatId = message.chat.id;
    const senderId = message.from.id;
    const threadId = message.message_thread_id;

    const replyTelegram = (text: string, options?: any) =>
      sendTelegramMessage(chatId, text, {
        ...options,
        ...(threadId ? { message_thread_id: threadId } : {}),
      });

    // Every user is authorized to submit events through Telegram bot
    // Handle /start or /help command
    const textContent = message.text || message.caption || '';
    const lowerText = textContent.toLowerCase();

    // Check for Flash Vibe / Vibe Instant intent
    const isPhoto = Boolean(message.photo && message.photo.length > 0);
    const isImageDoc = Boolean(message.document && message.document.mime_type?.startsWith('image/'));
    const hasExternalLink = Boolean(textContent.match(/https?:\/\/[^\s]+/i));

    const isFlashVibe =
      lowerText.startsWith('/vibe') ||
      lowerText.startsWith('/flash') ||
      lowerText.startsWith('vibe:') ||
      lowerText.startsWith('flash:') ||
      lowerText.startsWith('⚡') ||
      /\b(cricket|match|play|badminton|pickleball|football|turf|chai|coffee|cafe|tea|meetup|midnight chai|casual meetup|pickup game|anyone up for|looking for \d+ players|quick meetup|to play|to meetup|hangout|jam|jamming|acoustic|board games?|chess|poker|potluck|pub crawl|walk|sprint|coworking|cycling|running|jogging)\b/i.test(textContent) ||
      (!isPhoto && !hasExternalLink && textContent.length < 350 && textContent.length > 5);

    let flashActivity: string = 'other';
    if (/\b(cricket|box cricket|gully cricket|match|batting|bowling)\b/i.test(textContent)) flashActivity = 'cricket';
    else if (/\b(badminton|shuttle)\b/i.test(textContent)) flashActivity = 'badminton';
    else if (/\b(pickleball|paddle)\b/i.test(textContent)) flashActivity = 'pickleball';
    else if (/\b(football|futsal|soccer)\b/i.test(textContent)) flashActivity = 'football';
    else if (/\b(chai|coffee|cafe|tea)\b/i.test(textContent)) flashActivity = 'coffee';
    else if (/\b(board games?|catan|chess|poker)\b/i.test(textContent)) flashActivity = 'games';
    else if (/\b(jam|acoustic|guitar|music|singing)\b/i.test(textContent)) flashActivity = 'music';
    else if (/\b(sprint|code|hack|hackathon|laptop|work|coworking)\b/i.test(textContent)) flashActivity = 'sprint';

    if (lowerText.startsWith('/start') || lowerText.startsWith('/help') || lowerText === 'hi') {
      const welcome = `👋 <b>Welcome to Vibe Event Bot!</b>\n\n` +
        `You can submit formal events or post spontaneous meetups straight to Vibe:\n\n` +
        `⚡ <b>Post to Vibe Instant:</b> Send "/vibe &lt;details&gt;" (e.g. <i>"/vibe Box cricket at Bandra Turf tonight 8 PM. Need 4 players"</i>) to post immediately live to the <b>Vibe Instant</b> stream!\n` +
        `📸 <b>Send a Poster Image:</b> Forward any event flyer or Instagram screenshot.\n` +
        `🔗 <b>Send a Link:</b> Paste any Unstop, District, BookMyShow, or Luma URL.\n` +
        `💬 <b>Send a Text:</b> Forward any event details blurb.\n\n` +
        `<i>Gemini AI will extract all details and publish it!</i>`;
      await replyTelegram(welcome, { parse_mode: 'HTML' });
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabaseAdmin();
    let extracted: ExtractedEventData;
    let coverImageUrl = getCategoryCover('default');

    // CASE A: Flyer Image Provided (as Photo or Document file)
    if (isPhoto || isImageDoc) {
      await replyTelegram('🔍 <i>Analyzing event poster with Gemini Vision...</i>', {
        parse_mode: 'HTML',
      });

      const fileId = isPhoto
        ? message.photo[message.photo.length - 1].file_id
        : message.document.file_id;

      const { buffer, mimeType } = await downloadTelegramFileBuffer(fileId);

      // Attempt upload to Supabase Storage bucket 'event-covers'
      try {
        const fileExt = mimeType.includes('png') ? 'png' : 'jpg';
        const fileName = `telegram-${Date.now()}-${nanoid(6)}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('event-covers')
            .getPublicUrl(filePath);
          coverImageUrl = publicUrlData.publicUrl;
        } else {
          console.warn('[Telegram Webhook] Storage upload warning:', uploadError.message);
        }
      } catch (err) {
        console.warn('[Telegram Webhook] Storage upload failed, using fallback:', err);
      }

      // Extract details via Gemini Vision
      extracted = await extractEventFromImage(buffer, mimeType, message.caption);

      // If caption contains an external URL, scrape it to enrich price and ticketing link
      if (message.caption) {
        const captionUrlMatch = message.caption.match(/(https?:\/\/[^\s]+)/i);
        if (captionUrlMatch) {
          const captionUrl = captionUrlMatch[1].trim();
          try {
            const scraped = await scrapeUrlMetadata(captionUrl);
            if (scraped.price) {
              extracted.price_text = scraped.price;
            }
            if (!extracted.ticket_url) {
              extracted.ticket_url = captionUrl;
            }
            if (scraped.platform && scraped.platform !== 'telegram') {
              extracted.source_platform = scraped.platform;
            }
          } catch (e) {
            console.warn('[Telegram Webhook] Scrape caption URL failed:', e);
          }
        }
      }
    }
    // CASE B: Text / Link Provided
    else if (message.text) {
      await replyTelegram('🔍 <i>Extracting event details with AI...</i>', {
        parse_mode: 'HTML',
      });
      extracted = await extractEventFromText(message.text);
      // Pick suitable cover photo:
      // 1. Scraped OpenGraph image if user provided an event link
      // 2. Curated editorial high-res photography matching event category & title
      const finalCategory = extracted.category || detectCategoryFromText(`${extracted.title} ${message.text}`);
      coverImageUrl =
        extracted.cover_image_url ||
        getCategoryCover(finalCategory, extracted.title);
    } else {
      await replyTelegram(
        '⚠️ Please send an event flyer photo, an event URL, or a text description.',
        { parse_mode: 'HTML' }
      );
      return NextResponse.json({ ok: true });
    }

    // Validate timestamps safely for PostgreSQL timestamptz
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

    // Ensure valid slug uniqueness
    const finalSlug = `${extracted.suggested_slug}-${nanoid(4)}`;

    // Format theme configuration
    const themeConfig = {
      palette: extracted.template === 'ember' ? 'sunset' : 'forest',
      font: 'Inter + Fraunces',
      bg_style: 'texture',
      button_style: 'solid',
    };

    const detectedCity = extracted.city || 'Pune';

    // Determine whether this is a native Vibe event or an external aggregated event
    const rawTicketUrl = extracted.ticket_url?.trim();
    const normalizedTicketUrl = rawTicketUrl
      ? (rawTicketUrl.startsWith('http://') || rawTicketUrl.startsWith('https://') ? rawTicketUrl : `https://${rawTicketUrl}`)
      : undefined;

    const hasExternalUrl = Boolean(
      normalizedTicketUrl &&
      extracted.source_platform &&
      extracted.source_platform.toLowerCase() !== 'vibe' &&
      extracted.source_platform.toLowerCase() !== 'telegram'
    );

    const finalSourceType: 'native' | 'external' = hasExternalUrl ? 'external' : 'native';
    const finalSourcePlatform = hasExternalUrl ? extracted.source_platform : undefined;
    const finalTicketUrl = hasExternalUrl ? normalizedTicketUrl : undefined;

    // If it's a Flash Vibe / Meetup, it is published immediately live to Vibe Instant!
    const isLiveImmediately = isFlashVibe;

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
    });

    const suretyPercent = surety.score; // 0 to 100%
    const isAutoApproved = true;
    const approvalStatus = 'approved';
    const eventStatus = 'live';
    const isPublic = true;

    // 3. Build Event Record for Supabase
    const insertPayload = {
      slug: finalSlug,
      title: extracted.title || 'Untitled Gathering',
      tagline: extracted.tagline || `Experience the vibe in ${detectedCity}`,
      description:
        extracted.description ||
        `Join us for ${extracted.title || 'this event'} in ${detectedCity}. An exciting gathering bringing people together.`,
      cover_image_url: coverImageUrl,
      template: isFlashVibe ? 'ember' : (extracted.template || 'grove'),
      theme: {
        palette: isFlashVibe ? 'sunset' : (extracted.template === 'ember' ? 'sunset' : 'forest'),
        font: 'Inter',
        bg_style: 'solid',
        button_style: 'pill',
        confidence_score: suretyPercent / 100,
        missing_aspects: surety.missingAspects,
        approval_status: approvalStatus,
        admin_approved: true,
      },
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: extracted.venue_name || `${detectedCity} Venue`,
      location_address: extracted.location_address || `${detectedCity}, India`,
      city: detectedCity,
      start_at: validStartAt,
      end_at: validEndAt,
      timezone: 'Asia/Kolkata',
      capacity: isFlashVibe ? 12 : 250,
      is_public: true,
      status: 'live',
      ai_generated: true,
      source_type: finalSourceType,
      source_platform: finalSourcePlatform || 'telegram',
      external_ticket_url: finalTicketUrl,
      external_price_text: extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry'),
      confidence_score: suretyPercent / 100,
      faq: extracted.faq || [],
      rsvp_form_config: {
        ask_plus_one: true,
        ask_dietary: false,
        ask_tshirt: false,
        waitlist_enabled: true,
        is_flash: isFlashVibe,
        confirmation_message: isFlashVibe
          ? `You're confirmed for ${extracted.title || 'this flash meetup'}! Coordinate directly with other guests on Vibe.`
          : (hasExternalUrl ? 'Redirecting to ticketing platform' : 'Your spot is confirmed! Present your pass with QR code at the entrance.'),
      },
    };

    const { data: savedEvent, error: insertError } = await supabase
      .from('events')
      .insert(insertPayload)
      .select('id, slug, title')
      .single();

    if (insertError || !savedEvent) {
      console.error('[Telegram Webhook] Insert error:', insertError);
      await replyTelegram(
        `❌ <b>Failed to save event draft</b>: ${insertError?.message || 'Unknown database error'}`,
        { parse_mode: 'HTML' }
      );
      return NextResponse.json({ ok: true });
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

    const detectedCategory = (extracted.category || detectCategoryFromText(extracted.title)).toUpperCase();

    // 4. Send Confirmation Card with Inline Buttons to Telegram
    const appUrl = getAppUrl();
    const adminEventsUrl = `${appUrl}/admin/events`;

    let previewText: string;
    let inlineKeyboard: any[];

    if (isAutoApproved) {
      if (isFlashVibe) {
        const instantLink = `${appUrl}/vibes?event=${finalSlug}`;
        previewText = `⚡ <b>YOUR FLASH VIBE IS AUTO-APPROVED & LIVE!</b> (${suretyPercent}% Surety)\n\n` +
          `🔥 <b>${extracted.title}</b>\n` +
          `📍 ${extracted.venue_name || detectedCity} (${detectedCity})\n` +
          `🕒 ${dateStr} IST\n\n` +
          `✅ <i>Auto-Approved: All required details verified!</i>\n\n` +
          `📱 <b>Open in Vibe Instant:</b>\n<a href="${instantLink}">${instantLink}</a>\n\n` +
          `📋 <b>Tap to copy link:</b> <code>${instantLink}</code>\n\n` +
          `📲 <i>Forward this link to your squad — anyone can swipe to your card and tap "I'm In" to join!</i>`;

        inlineKeyboard = [
          [{ text: '⚡ Open in Vibe Instant ↗', url: instantLink }],
          [{ text: '❌ Discard', callback_data: `discard:${savedEvent.id}` }],
        ];
      } else {
        const liveLink = `${appUrl}/${finalSlug}`;
        previewText = `🎉 <b>EVENT AUTO-APPROVED & LIVE!</b> (${suretyPercent}% Surety)\n\n` +
          `📌 <b>Title:</b> ${extracted.title}\n` +
          `🏷️ <b>Category:</b> ${detectedCategory}\n` +
          `🗓️ <b>Date:</b> ${dateStr} IST\n` +
          `📍 <b>Venue:</b> ${extracted.venue_name} (${detectedCity})\n` +
          `💰 <b>Price:</b> ${extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry')}\n` +
          `✅ <i>Auto-Approved: High completeness surety score.</i>\n\n` +
          `🔗 <b>Live Link:</b> <a href="${liveLink}">${liveLink}</a>\n\n` +
          `📋 <b>Tap to copy link:</b> <code>${liveLink}</code>`;

        inlineKeyboard = [
          [{ text: '🌐 View Live Event Page ↗', url: liveLink }],
          [{ text: '🛡️ Manage in Admin Command Center ↗', url: adminEventsUrl }],
          [{ text: '❌ Discard', callback_data: `discard:${savedEvent.id}` }],
        ];
      }
    } else {
      const missingList = surety.missingAspects.length > 0
        ? surety.missingAspects.map(a => `• ${a}`).join('\n')
        : '• Specific venue place or start time not given';

      previewText = `⏳ <b>EVENT SUBMITTED FOR ADMIN APPROVAL</b> (${suretyPercent}% Surety)\n\n` +
        `📌 <b>Title:</b> ${extracted.title}\n` +
        `🗓️ <b>Date:</b> ${dateStr} IST\n` +
        `📍 <b>Venue:</b> ${extracted.venue_name || 'Not given'} (${detectedCity})\n` +
        `💰 <b>Price:</b> ${extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry')}\n\n` +
        `⚠️ <b>Aspects Not Given By User:</b>\n${missingList}\n\n` +
        `🛡️ <b>STATUS: PENDING ADMIN APPROVAL</b>\n` +
        `<i>Because event surety is under 90%, it requires Admin Approval before going live. An admin can review and approve it with 1 click.</i>`;

      inlineKeyboard = [
        [{ text: '🛡️ Review & Approve in Admin Center ↗', url: adminEventsUrl }],
        [{ text: '❌ Discard Draft', callback_data: `discard:${savedEvent.id}` }],
      ];
    }

    await replyTelegram(previewText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error);
    try {
      if (update?.message?.chat?.id) {
        const threadId = update.message.message_thread_id;
        await sendTelegramMessage(
          update.message.chat.id,
          `⚠️ <b>Failed to process event:</b> ${error.message || 'Unknown processing error'}`,
          { parse_mode: 'HTML', ...(threadId ? { message_thread_id: threadId } : {}) }
        );
      }
    } catch (sendErr) {
      console.error('[Telegram Webhook] Failed to send error message to Telegram:', sendErr);
    }
    return NextResponse.json({ ok: true, error: error.message });
  }
}
