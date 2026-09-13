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

// Fallback high-res cover photos by category if image upload is unavailable
const CATEGORY_COVERS: Record<string, string> = {
  music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  comedy: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
  tech: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  nightlife: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  workshop: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
};

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

      if (!isAuthorizedCurator(senderId)) {
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

    // Security Check: Whitelist Authorized Curators
    if (!isAuthorizedCurator(senderId)) {
      await sendTelegramMessage(
        chatId,
        '🚫 <b>Access Denied</b>\n\nThis bot is restricted to verified Vibe curators. Your user ID: <code>' +
          senderId +
          '</code> is not authorized.',
        { parse_mode: 'HTML' }
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /start or /help command
    const textContent = message.text || message.caption || '';
    if (textContent.startsWith('/start') || textContent.startsWith('/help')) {
      const welcome = `👋 <b>Welcome to Vibe Ingestion Bot!</b>\n\nI can automatically convert flyers, posters, and links into live events on Vibe.\n\n<b>How to use:</b>\n📸 <b>Send a Poster Image:</b> Forward any event flyer or Instagram screenshot.\n🔗 <b>Send a Link:</b> Paste any Unstop, District, BookMyShow, or Luma URL.\n💬 <b>Send a Text:</b> Forward any WhatsApp event blurb.\n\nGemini AI will extract all venue, date, and ticketing details with 1-tap publishing!`;
      await sendTelegramMessage(chatId, welcome, { parse_mode: 'HTML' });
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabaseAdmin();
    let extracted: ExtractedEventData;
    let coverImageUrl = CATEGORY_COVERS.default;

    // CASE A: Flyer Image Provided
    if (message.photo && message.photo.length > 0) {
      await sendTelegramMessage(chatId, '🔍 <i>Analyzing event poster with Gemini Vision...</i>', {
        parse_mode: 'HTML',
      });

      // Get highest resolution photo
      const highestResPhoto = message.photo[message.photo.length - 1];
      const { buffer, mimeType } = await downloadTelegramFileBuffer(highestResPhoto.file_id);

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
    }
    // CASE B: Text / Link Provided
    else if (message.text) {
      await sendTelegramMessage(chatId, '🔍 <i>Extracting event details with AI...</i>', {
        parse_mode: 'HTML',
      });
      extracted = await extractEventFromText(message.text);
      // Pick suitable cover photo by detected category or platform
      coverImageUrl = CATEGORY_COVERS[extracted.source_platform] || CATEGORY_COVERS.default;
    } else {
      await sendTelegramMessage(
        chatId,
        '⚠️ Please send an event flyer photo, an event URL, or a text description.',
        { parse_mode: 'HTML' }
      );
      return NextResponse.json({ ok: true });
    }

    // Ensure valid slug uniqueness
    const finalSlug = `${extracted.suggested_slug}-${nanoid(4)}`;

    // Format theme configuration
    const themeConfig = {
      palette: extracted.template === 'ember' ? 'sunset' : 'forest',
      font: 'Inter + Fraunces',
      bg_style: 'texture',
      button_style: 'solid',
    };

    // 3. Insert into Supabase `public.events` as draft
    const insertPayload = {
      slug: finalSlug,
      title: extracted.title || 'Untitled Event',
      tagline: extracted.tagline || 'Experience the vibe in Pune',
      description: extracted.description || '',
      cover_image_url: coverImageUrl,
      template: extracted.template || 'grove',
      theme: themeConfig,
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: extracted.venue_name || 'Pune Venue',
      location_address: extracted.location_address || 'Pune, Maharashtra',
      city: extracted.city || 'Pune',
      start_at: extracted.start_at || new Date(Date.now() + 86400000).toISOString(),
      end_at: extracted.end_at || new Date(Date.now() + 86400000 + 10800000).toISOString(),
      timezone: 'Asia/Kolkata',
      capacity: 250,
      is_public: true,
      status: 'draft',
      ai_generated: true,
      source_type: 'external',
      source_platform: extracted.source_platform || 'telegram',
      external_ticket_url: extracted.ticket_url || undefined,
      external_price_text: extracted.price_text || 'Registration on entry',
      confidence_score: extracted.confidence_score || 0.9,
      faq: extracted.faq || [],
      rsvp_form_config: {
        ask_plus_one: false,
        ask_dietary: false,
        ask_tshirt: false,
        waitlist_enabled: false,
        confirmation_message: 'Redirecting to ticketing platform',
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

    // 4. Send Confirmation Card with Inline Buttons to Telegram
    const previewText = `✨ <b>EVENT EXTRACTED!</b> (Confidence: ${confidencePercent}%)

📌 <b>Title:</b> ${extracted.title}
🗓️ <b>Date:</b> ${dateStr} IST
📍 <b>Venue:</b> ${extracted.venue_name}
💰 <b>Price:</b> ${extracted.price_text || 'Free'}
🎟️ <b>Platform:</b> ${extracted.source_platform.toUpperCase()}
${extracted.ticket_url ? `🔗 <b>Link:</b> ${extracted.ticket_url}\n` : ''}
<i>Review the details above. Tap approve to immediately publish live to Vibe!</i>`;

    await sendTelegramMessage(chatId, previewText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Approve & Publish Live',
              callback_data: `publish:${savedEvent.id}`,
            },
          ],
          [
            {
              text: '❌ Discard Draft',
              callback_data: `discard:${savedEvent.id}`,
            },
          ],
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: true, error: error.message });
  }
}
