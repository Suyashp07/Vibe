import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendTelegramMessage,
  editTelegramMessage,
  answerTelegramCallback,
  downloadTelegramFileBuffer,
  isAuthorizedCurator,
} from '@/lib/telegram';
import {
  extractEventFromImage,
  extractEventFromText,
  scrapeUrlMetadata,
  getCategoryCover,
  detectCategoryFromText,
  ExtractedEventData,
} from '@/lib/ai/eventExtractor';
import { nanoid } from 'nanoid';

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
  try {
    const update = await req.json();

    // 1. Handle Inline Button Callback Queries (Approve / Discard)
    if (update.callback_query) {
      const cq = update.callback_query;
      const senderId = cq.from.id;
      const chatId = cq.message.chat.id;
      const messageId = cq.message.message_id;
      const data = cq.data || '';

      if (!(await isAuthorizedCurator(senderId))) {
        await answerTelegramCallback(cq.id, 'Unauthorized curator', true);
        return NextResponse.json({ ok: true });
      }

      const supabase = getSupabaseAdmin();
      const appUrl = getAppUrl();

      if (data.startsWith('publish:')) {
        const eventId = data.replace('publish:', '');
        const { data: updatedEvent, error } = await supabase
          .from('events')
          .update({ status: 'live', updated_at: new Date().toISOString() })
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
              [{ text: '📋 Copy Link', callback_data: `copy:${eventLink}` }],
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

    // 2. Handle Incoming Messages (Photos, Links, Text)
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const senderId = message.from.id;

    // Check if sender has curator / admin privileges
    const isCurator = await isAuthorizedCurator(senderId);

    // Handle /start or /help command
    const textContent = message.text || message.caption || '';
    if (textContent.startsWith('/start') || textContent.startsWith('/help')) {
      const welcome = `👋 <b>Welcome to Vibe Event Submission Bot!</b>\n\n` +
        `Send me any event poster flyer, ticketing link, or message blurb, and I will extract the event details and submit it to Vibe!\n\n` +
        `<b>How to submit:</b>\n` +
        `📸 <b>Send a Poster Image:</b> Forward any event flyer or Instagram screenshot.\n` +
        `🔗 <b>Send a Link:</b> Paste any Unstop, District, BookMyShow, or Luma URL.\n` +
        `💬 <b>Send a Text:</b> Forward any WhatsApp event blurb.\n\n` +
        `<i>Your submission will be routed to Vibe administrators for review and published live!</i>`;
      await sendTelegramMessage(chatId, welcome, { parse_mode: 'HTML' });
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabaseAdmin();
    let extracted: ExtractedEventData;
    let coverImageUrl = getCategoryCover('default');

    const isPhoto = Boolean(message.photo && message.photo.length > 0);
    const isImageDoc = Boolean(message.document && message.document.mime_type?.startsWith('image/'));

    // CASE A: Flyer Image Provided (as Photo or Document file)
    if (isPhoto || isImageDoc) {
      await sendTelegramMessage(chatId, '🔍 <i>Analyzing event poster with Gemini Vision...</i>', {
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
      await sendTelegramMessage(chatId, '🔍 <i>Extracting event details with AI...</i>', {
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
      await sendTelegramMessage(
        chatId,
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

    // 3. Insert into Supabase `public.events` as draft
    const insertPayload = {
      slug: finalSlug,
      title: extracted.title || 'Untitled Event',
      tagline: extracted.tagline || `Experience the vibe in ${detectedCity}`,
      description: extracted.description || '',
      cover_image_url: coverImageUrl,
      template: extracted.template || 'grove',
      theme: themeConfig,
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: extracted.venue_name || `${detectedCity} Venue`,
      location_address: extracted.location_address || `${detectedCity}, India`,
      city: detectedCity,
      start_at: validStartAt,
      end_at: validEndAt,
      timezone: 'Asia/Kolkata',
      capacity: 250,
      is_public: false, // Strictly private until verified and published by an administrator
      status: 'draft',  // Strictly draft until verified and published by an administrator
      ai_generated: true,
      source_type: finalSourceType,
      source_platform: finalSourcePlatform,
      external_ticket_url: finalTicketUrl,
      external_price_text: extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry'),
      confidence_score: extracted.confidence_score || 0.9,
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

    const { data: savedEvent, error: insertError } = await supabase
      .from('events')
      .insert(insertPayload)
      .select('id, slug, title')
      .single();

    if (insertError || !savedEvent) {
      console.error('[Telegram Webhook] Insert error:', insertError);
      await sendTelegramMessage(
        chatId,
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

    const confidencePercent = Math.round((extracted.confidence_score || 0.9) * 100);

    const detectedCategory = (extracted.category || detectCategoryFromText(extracted.title)).toUpperCase();

    // 4. Send Confirmation Card with Inline Buttons to Telegram
    const appUrl = getAppUrl();
    const adminEventsUrl = `${appUrl}/admin/events`;

    let previewText: string;
    let inlineKeyboard: any[];

    if (isCurator) {
      previewText = `✨ <b>EVENT EXTRACTED & QUEUED FOR REVIEW!</b> (Confidence: ${confidencePercent}%)\n\n` +
        `📌 <b>Title:</b> ${extracted.title}\n` +
        `🏷️ <b>Category:</b> ${detectedCategory}\n` +
        `🗓️ <b>Date:</b> ${dateStr} IST\n` +
        `📍 <b>Venue:</b> ${extracted.venue_name} (${detectedCity})\n` +
        `💰 <b>Price:</b> ${extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry')}\n` +
        `🎟️ <b>Ticketing:</b> ${hasExternalUrl ? `${finalSourcePlatform?.toUpperCase()} (External Link)` : 'RSVP Directly on Vibe (Native QR Pass)'}\n` +
        (hasExternalUrl ? `🔗 <b>Link:</b> ${finalTicketUrl}\n` : '') +
        `🖼️ <b>Poster:</b> ${isPhoto ? 'Custom Uploaded Flyer' : `${detectedCategory} Curated Background`}\n\n` +
        `🛡️ <b>STATUS: PENDING ADMIN VERIFICATION</b>\n` +
        `<i>This draft has been routed to the Vibe Admin Command Center. Verify and approve it in the admin panel to publish it live!</i>`;

      inlineKeyboard = [
        [{ text: '🛡️ Review in Admin Command Center ↗', url: adminEventsUrl }],
        [{ text: '❌ Discard Draft', callback_data: `discard:${savedEvent.id}` }],
      ];
    } else {
      previewText = `🎉 <b>EVENT SUBMITTED FOR REVIEW!</b>\n\n` +
        `📌 <b>Title:</b> ${extracted.title}\n` +
        `🗓️ <b>Date:</b> ${dateStr} IST\n` +
        `📍 <b>Venue:</b> ${extracted.venue_name} (${detectedCity})\n` +
        `💰 <b>Price:</b> ${extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry')}\n\n` +
        `🛡️ <b>STATUS: PENDING ADMIN APPROVAL</b>\n` +
        `<i>Your event has been submitted to the Vibe team! An administrator will review your event and publish it live on Vibe shortly.</i>`;

      inlineKeyboard = [
        [{ text: '🌐 Browse Live Events ↗', url: `${appUrl}/discover` }],
      ];
    }

    await sendTelegramMessage(chatId, previewText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: true, error: error.message });
  }
}
