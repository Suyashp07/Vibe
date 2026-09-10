import { EventItem, Profile } from '@/types';
import { formatIST, generateGoogleCalendarUrl } from '@/lib/store';

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Base email layout wrapper with organizer white-label branding
 */
function wrapWhiteLabelTemplate(
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string },
  contentHtml: string
): string {
  const brandColor = organizer.brand_color || '#E8621A';
  const logo = organizer.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${organizer.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F7F4; margin: 0; padding: 20px; color: #0F0F0F; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E8E4DF; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .brand-accent-strip { height: 6px; background-color: ${brandColor}; width: 100%; }
    .header { padding: 28px 32px 20px 32px; border-bottom: 1px solid #F0EDE8; display: flex; align-items: center; gap: 14px; }
    .logo { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1px solid #E8E4DF; }
    .org-title { margin: 0; font-size: 16px; font-weight: 700; color: #1A1A2E; }
    .org-handle { margin: 2px 0 0 0; font-size: 12px; color: #8A8A8A; font-family: monospace; }
    .content { padding: 32px; line-height: 1.6; font-size: 15px; color: #4B4B4B; }
    .event-card { background: #F9F7F4; border: 1px solid #E8E4DF; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .event-title { font-size: 20px; font-weight: 800; color: #1A1A2E; margin: 0 0 8px 0; font-family: Georgia, serif; }
    .event-meta { font-size: 13px; color: #4B4B4B; margin: 4px 0; display: flex; align-items: center; gap: 6px; }
    .cta-button { display: inline-block; background-color: ${brandColor}; color: #ffffff !important; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; margin-top: 18px; text-align: center; }
    .footer { padding: 24px 32px; background: #F9F7F4; border-top: 1px solid #E8E4DF; text-align: center; font-size: 11px; color: #8A8A8A; }
    .footer a { color: #E8621A; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-accent-strip"></div>
    <div class="header">
      <img src="${logo}" alt="${organizer.name}" class="logo" />
      <div>
        <h2 class="org-title">${organizer.name}</h2>
        <p class="org-handle">@${organizer.handle || 'host'}</p>
      </div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Powered by <strong>Vibe by Swaniki</strong> • The India-First Experience Platform</p>
      <p style="margin: 0;">Timezone: Asia/Kolkata (IST) • Subscribed to ${organizer.name}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatch an email via Resend API or simulate locally
 */
async function sendEmail({
  to,
  subject,
  html,
  from = 'Vibe by Swaniki <notifications@vibe.swaniki.app>'
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.includes('your-resend-api-key') || apiKey === 're_placeholder') {
    console.log(`[Resend Email Simulated] To: ${to} | Subject: "${subject}"`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to: [to], subject, html })
    });

    if (!res.ok) {
      const errData = await res.json();
      console.warn('[Resend API Error]:', errData);
      return { success: false, error: JSON.stringify(errData) };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error('[Resend Network Error]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 1. RSVP Confirmed Email
 */
export async function sendRsvpConfirmedEmail({
  to,
  guestName,
  event,
  organizer
}: {
  to: string;
  guestName: string;
  event: EventItem;
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string };
}) {
  const calUrl = generateGoogleCalendarUrl(event);
  const formattedTime = formatIST(event.start_at);

  const html = wrapWhiteLabelTemplate(
    organizer,
    `
      <p>Hi <strong>${guestName}</strong> 👋</p>
      <p>Your spot is confirmed for <strong>${event.title}</strong>! Here are your access pass details:</p>

      <div class="event-card">
        <div class="event-title">${event.title}</div>
        <p style="margin: 0 0 12px 0; font-style: italic; color: #8A8A8A; font-size: 13px;">${event.tagline}</p>
        <p class="event-meta">📅 <strong>Date & Time:</strong> ${formattedTime}</p>
        <p class="event-meta">📍 <strong>Venue:</strong> ${event.location_name}, ${event.location_address || event.city}</p>
        ${event.online_link ? `<p class="event-meta">🔗 <strong>Virtual Link:</strong> <a href="${event.online_link}">${event.online_link}</a></p>` : ''}
        <a href="${calUrl}" target="_blank" class="cta-button">Add to Google Calendar 📅</a>
      </div>

      <p style="font-size: 13px; color: #8A8A8A;">Please show this pass or your name at the entry gate upon arrival. Valet and arrival instructions will be sent on WhatsApp.</p>
      <p>See you soon,<br/><strong>${organizer.name}</strong></p>
    `
  );

  return sendEmail({
    to,
    subject: `✅ Confirmed Pass: ${event.title}`,
    html
  });
}

/**
 * 2. Waitlisted Email
 */
export async function sendWaitlistedEmail({
  to,
  guestName,
  position,
  event,
  organizer
}: {
  to: string;
  guestName: string;
  position: number;
  event: EventItem;
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string };
}) {
  const html = wrapWhiteLabelTemplate(
    organizer,
    `
      <p>Hi <strong>${guestName}</strong>,</p>
      <p>Thank you for your interest in <strong>${event.title}</strong>. This experience has reached maximum capacity, and you have been placed on the official waitlist.</p>

      <div class="event-card">
        <div class="event-title">${event.title}</div>
        <p class="event-meta">⏳ <strong>Your Position on Waitlist:</strong> #${position}</p>
        <p class="event-meta">📅 <strong>Event Date:</strong> ${formatIST(event.start_at)}</p>
        <p class="event-meta">📍 <strong>City:</strong> ${event.city}</p>
      </div>

      <p><strong>What happens next?</strong></p>
      <p style="font-size: 13px; color: #4B4B4B;">If an attendee cancels their reservation, spots are automatically allocated to waitlisted guests in sequential order. You will receive an immediate notification pass via email and WhatsApp if a slot opens up.</p>

      <p>Warm regards,<br/><strong>${organizer.name}</strong></p>
    `
  );

  return sendEmail({
    to,
    subject: `⏳ Waitlisted (#${position}): ${event.title}`,
    html
  });
}

/**
 * 3. Event Reminder (24h or 1h before)
 */
export async function sendEventReminderEmail({
  to,
  guestName,
  timing,
  event,
  organizer
}: {
  to: string;
  guestName: string;
  timing: '24h' | '1h';
  event: EventItem;
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string };
}) {
  const timeDesc = timing === '24h' ? 'tomorrow' : 'in 1 hour';
  const html = wrapWhiteLabelTemplate(
    organizer,
    `
      <p>Hi <strong>${guestName}</strong>,</p>
      <p>Just a quick reminder that <strong>${event.title}</strong> is happening <strong>${timeDesc}</strong>!</p>

      <div class="event-card">
        <div class="event-title">${event.title}</div>
        <p class="event-meta">⏰ <strong>When:</strong> ${formatIST(event.start_at)}</p>
        <p class="event-meta">📍 <strong>Where:</strong> ${event.location_name} (${event.city})</p>
        <p class="event-meta">🚗 <strong>Address:</strong> ${event.location_address}</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${event.location_name}, ${event.location_address}`)}" target="_blank" class="cta-button">Open Google Maps Directions 🧭</a>
      </div>

      <p>We look forward to having you with us!</p>
      <p>Best,<br/><strong>${organizer.name}</strong></p>
    `
  );

  return sendEmail({
    to,
    subject: `📅 Reminder: ${event.title} is ${timeDesc}!`,
    html
  });
}

/**
 * 4. Event Updated Email
 */
export async function sendEventUpdatedEmail({
  to,
  guestName,
  changes,
  event,
  organizer
}: {
  to: string;
  guestName: string;
  changes: string;
  event: EventItem;
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string };
}) {
  const html = wrapWhiteLabelTemplate(
    organizer,
    `
      <p>Hi <strong>${guestName}</strong>,</p>
      <p>The organizer has posted an update regarding <strong>${event.title}</strong>:</p>

      <div class="event-card" style="border-left: 4px solid #C9A84C;">
        <p style="margin: 0; font-weight: 700; color: #1A1A2E;">Notice from the Host:</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #4B4B4B;">${changes}</p>
      </div>

      <div class="event-card">
        <div class="event-title">${event.title}</div>
        <p class="event-meta">📅 <strong>Current Date & Time:</strong> ${formatIST(event.start_at)}</p>
        <p class="event-meta">📍 <strong>Venue:</strong> ${event.location_name}</p>
      </div>

      <p>Questions? Feel free to reply directly to this notification.</p>
      <p>Best,<br/><strong>${organizer.name}</strong></p>
    `
  );

  return sendEmail({
    to,
    subject: `📢 Event Update: ${event.title}`,
    html
  });
}

/**
 * 5. Event Cancelled Email
 */
export async function sendEventCancelledEmail({
  to,
  guestName,
  reason,
  event,
  organizer
}: {
  to: string;
  guestName: string;
  reason?: string;
  event: EventItem;
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string };
}) {
  const html = wrapWhiteLabelTemplate(
    organizer,
    `
      <p>Hi <strong>${guestName}</strong>,</p>
      <p>We regret to inform you that <strong>${event.title}</strong> has been cancelled.</p>

      ${reason ? `
        <div class="event-card" style="border-left: 4px solid #E8621A;">
          <p style="margin: 0; font-weight: 700; color: #1A1A2E;">Reason from Host:</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #4B4B4B;">${reason}</p>
        </div>
      ` : ''}

      <p>We apologize for any inconvenience caused and hope to see you at our upcoming gatherings.</p>
      <p>Sincerely,<br/><strong>${organizer.name}</strong></p>
    `
  );

  return sendEmail({
    to,
    subject: `Cancelled: ${event.title}`,
    html
  });
}
