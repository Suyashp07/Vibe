import { EventItem } from '@/types';
import { formatIST, generateGoogleCalendarUrl } from '@/lib/store';

export interface EmailSendResult {
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
  contentHtml: string,
  preheader: string = ''
): string {
  const brandColor = organizer.brand_color || '#E8621A';
  const logo = organizer.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${organizer.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F2; margin: 0; padding: 24px 12px; color: #111827; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #E5E1D8; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
    .brand-accent-strip { height: 6px; background-color: ${brandColor}; width: 100%; }
    .header { padding: 24px 32px 18px 32px; border-bottom: 1px solid #F0EDE6; display: flex; align-items: center; gap: 14px; background: #FFFFFF; }
    .logo { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 1px solid #E5E1D8; }
    .org-title { margin: 0; font-size: 16px; font-weight: 800; color: #111827; }
    .org-handle { margin: 2px 0 0 0; font-size: 12px; color: #6B7280; font-family: monospace; }
    .content { padding: 32px; line-height: 1.6; font-size: 15px; color: #374151; background: #FFFFFF; }
    .cta-button { display: inline-block; background-color: ${brandColor}; color: #ffffff !important; padding: 13px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    .secondary-button { display: inline-block; background-color: #F3F4F6; color: #1F2937 !important; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; text-align: center; border: 1px solid #E5E7EB; }
    .footer { padding: 24px 32px; background: #F8F6F2; border-top: 1px solid #E5E1D8; text-align: center; font-size: 11px; color: #6B7280; }
    .footer a { color: #E8621A; text-decoration: none; font-weight: 600; }
    @media only screen and (max-width: 600px) {
      body { padding: 12px 6px; }
      .content { padding: 22px 18px; }
      .header { padding: 18px 20px; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
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
      <p style="margin: 0 0 6px 0;">Powered by <strong>Vibe by Swaniki</strong> • The India-First White-Label Experience Platform</p>
      <p style="margin: 0;">Timezone: Asia/Kolkata (IST) • Secure automated notification</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatch an email via Resend API or simulate locally
 */
export async function sendEmail({
  to,
  subject,
  html,
  from
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  // Default to onboarding@resend.dev (supported on all Resend accounts without custom domain verification)
  const defaultFrom = process.env.EMAIL_FROM || 'Vibe by Swaniki <onboarding@resend.dev>';
  const sender = from || defaultFrom;

  if (!apiKey || apiKey.includes('your-resend-api-key') || apiKey === 're_placeholder') {
    console.log(`\n======================================================`);
    console.log(`📨 [SIMULATED EMAIL DISPATCH]`);
    console.log(`To: ${to}`);
    console.log(`From: ${sender}`);
    console.log(`Subject: "${subject}"`);
    console.log(`Tip: Add a real RESEND_API_KEY in .env.local to send live emails.`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: sender,
        to: [to],
        subject,
        html
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      console.warn('[Resend API Error]:', errData);
      return { success: false, error: JSON.stringify(errData) };
    }

    const data = await res.json();
    console.log(`✅ [Resend Email Sent] ID: ${data.id} -> ${to}`);
    return { success: true, messageId: data.id };
  } catch (err: any) {
    console.error('[Resend Network Error]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Organizer Event Creation Confirmation Email
 */
export async function sendEventCreatedEmail({
  to,
  organizerName,
  event,
  organizer,
  appUrl
}: {
  to: string;
  organizerName: string;
  event: EventItem;
  organizer?: { name: string; brand_color?: string; logo_url?: string; handle?: string };
  appUrl?: string;
}) {
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com';
  const eventUrl = `${baseUrl}/${event.slug}`;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const formattedTime = formatIST(event.start_at);
  const brandColor = organizer?.brand_color || event.organizer_brand_color || '#E8621A';

  const orgData = organizer || {
    name: event.organizer_name || organizerName || 'Event Host',
    brand_color: brandColor,
    logo_url: event.organizer_logo,
    handle: event.organizer_handle
  };

  const html = wrapWhiteLabelTemplate(
    orgData,
    `
      <div style="margin-bottom: 24px; text-align: center;">
        <span style="display: inline-block; background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px; border: 1px solid #A7F3D0;">
          ✦ Event Published & Live
        </span>
        <h1 style="font-size: 24px; font-weight: 900; color: #111827; margin: 14px 0 6px 0; font-family: Georgia, serif;">
          Your Event is Officially Live! 🎉
        </h1>
        <p style="margin: 0; color: #6B7280; font-size: 14px;">
          Congratulations, <strong>${organizerName}</strong>! Your event page is ready to accept guest RSVPs.
        </p>
      </div>

      ${event.cover_image_url ? `
        <div style="margin: 20px 0; border-radius: 14px; overflow: hidden; border: 1px solid #E5E7EB; max-height: 240px;">
          <img src="${event.cover_image_url}" alt="${event.title}" style="width: 100%; height: auto; object-fit: cover; display: block;" />
        </div>
      ` : ''}

      <!-- Event Summary Card -->
      <div style="background: #FAF8F5; border: 1px solid #EAE5DE; border-radius: 14px; padding: 22px; margin: 24px 0;">
        <h2 style="font-size: 19px; font-weight: 800; color: #111827; margin: 0 0 6px 0; font-family: Georgia, serif;">
          ${event.title}
        </h2>
        ${event.tagline ? `<p style="margin: 0 0 16px 0; font-style: italic; color: #6B7280; font-size: 13px;">${event.tagline}</p>` : ''}
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #374151;">
          <tr>
            <td style="padding: 6px 0; width: 32px; vertical-align: top;">📅</td>
            <td style="padding: 6px 0;"><strong>Date & Time:</strong> ${formattedTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; vertical-align: top;">📍</td>
            <td style="padding: 6px 0;">
              <strong>Venue:</strong> ${event.location_name}${event.city ? `, ${event.city}` : ''}
              ${event.location_address ? `<br/><span style="color: #6B7280; font-size: 12px;">${event.location_address}</span>` : ''}
            </td>
          </tr>
          ${event.online_link ? `
            <tr>
              <td style="padding: 6px 0; vertical-align: top;">🔗</td>
              <td style="padding: 6px 0;"><strong>Virtual Link:</strong> <a href="${event.online_link}" style="color: ${brandColor};">${event.online_link}</a></td>
            </tr>
          ` : ''}
          <tr>
            <td style="padding: 6px 0; vertical-align: top;">👥</td>
            <td style="padding: 6px 0;"><strong>Capacity:</strong> ${event.capacity ? `${event.capacity} Attendees` : 'Unlimited'}</td>
          </tr>
        </table>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 28px 0 20px 0;">
        <a href="${dashboardUrl}" target="_blank" class="cta-button" style="margin-right: 8px; margin-bottom: 10px;">
          Open Organizer Dashboard →
        </a>
        <a href="${eventUrl}" target="_blank" class="secondary-button" style="margin-bottom: 10px;">
          View Public Page ↗
        </a>
      </div>

      <!-- Quick Share Options -->
      <div style="background: #FFFFFF; border: 1px dashed #D1D5DB; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 1px;">
          ⚡ Share With Your Community
        </p>
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #6B7280;">
          Copy this public invite link or share instantly:
        </p>
        <div style="background: #F3F4F6; padding: 8px 12px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; color: #1F2937; margin-bottom: 12px;">
          ${eventUrl}
        </div>
        <div style="display: inline-flex; gap: 8px;">
          <a href="https://wa.me/?text=${encodeURIComponent(`Check out ${event.title} happening on ${formattedTime}! RSVP here: ${eventUrl}`)}" target="_blank" style="background: #25D366; color: #FFFFFF; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 700;">
            Share on WhatsApp
          </a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Excited to host ${event.title}! Join us: ${eventUrl}`)}" target="_blank" style="background: #111827; color: #FFFFFF; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 700;">
            Share on X
          </a>
        </div>
      </div>

      <!-- Host Tips -->
      <div style="border-top: 1px solid #F3F4F6; padding-top: 18px; margin-top: 24px; font-size: 12px; color: #6B7280; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;"><strong>Organizer Pro-Tips:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 18px;">
          <li>All attendee RSVPs will sync live to your <strong>Organizer Dashboard</strong>.</li>
          <li>Guests receive an automated boarding pass with an encrypted QR code for door check-in.</li>
          <li>Use the built-in QR scanner in your dashboard on event day for 1-second check-ins.</li>
        </ul>
      </div>
    `,
    `Your event "${event.title}" is published and live on Vibe by Swaniki!`
  );

  return sendEmail({
    to,
    subject: `🎉 Your Event is Live: "${event.title}" | Vibe by Swaniki`,
    html
  });
}

/**
 * 2. Guest RSVP Confirmation Email with Digital Boarding Pass & Scannable QR Code
 */
export async function sendRsvpConfirmedEmail({
  to,
  guestName,
  rsvp,
  event,
  organizer,
  appUrl
}: {
  to: string;
  guestName: string;
  rsvp?: any;
  event: EventItem;
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string };
  appUrl?: string;
}) {
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com';
  const calUrl = generateGoogleCalendarUrl(event);
  const formattedTime = formatIST(event.start_at);
  const brandColor = organizer?.brand_color || event.organizer_brand_color || '#E8621A';

  // Compute deterministic serial matching DigitalPassModal.tsx
  const rsvpId = rsvp?.id || `r-${Date.now()}`;
  const cityCode = (event.city || 'IND').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'DEL');
  const cleanId = String(rsvpId).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'PASS';
  const hash = Math.abs(
    (rsvpId + (to || '') + event.slug).split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0) | 0, 0)
  ).toString(36).toUpperCase().padStart(4, '0').slice(-4);

  const ticketSerial = `VB-${cityCode}-${cleanId}-${hash}`;
  const digitalPassUrl = `${baseUrl}/${event.slug}?ticket=${encodeURIComponent(ticketSerial)}&guest=${encodeURIComponent(rsvpId)}`;
  
  // High-reliability QR Code image URL (works natively across Gmail, Outlook, Apple Mail)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&format=png&data=${encodeURIComponent(digitalPassUrl)}`;
  const mapsUrl = event.maps_url || (event.location_name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.location_name}, ${event.location_address || event.city}`)}` : undefined);

  const html = wrapWhiteLabelTemplate(
    organizer,
    `
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 9999px; border: 1px solid #A7F3D0;">
          ✓ Confirmed Reservation
        </span>
        <h1 style="font-size: 22px; font-weight: 900; color: #111827; margin: 12px 0 6px 0; font-family: Georgia, serif;">
          You're In, ${guestName}! 🎟️
        </h1>
        <p style="margin: 0; color: #4B5563; font-size: 14px;">
          Your spot for <strong>${event.title}</strong> has been secured. Here is your official entry pass:
        </p>
      </div>

      <!-- DIGITAL BOARDING PASS TICKET CARD -->
      <div style="background: #0F172A; border-radius: 18px; overflow: hidden; color: #FFFFFF; margin: 24px 0; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);">
        
        <!-- Ticket Header -->
        <div style="background: linear-gradient(135deg, ${brandColor}, #1E1B4B); padding: 20px 24px; position: relative;">
          <div style="font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85; margin-bottom: 4px;">
            OFFICIAL ADMISSION PASS
          </div>
          <div style="font-size: 20px; font-weight: 900; line-height: 1.25; font-family: Georgia, serif;">
            ${event.title}
          </div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
            Hosted by <strong>${organizer.name}</strong>
          </div>
        </div>

        <!-- Perforated Tear-Line -->
        <div style="border-top: 2px dashed rgba(255,255,255,0.25); margin: 0;"></div>

        <!-- Ticket Body -->
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding-bottom: 14px; vertical-align: top; width: 60%;">
                <span style="font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 700;">
                  ATTENDEE NAME
                </span>
                <span style="font-size: 16px; font-weight: 800; color: #F8FAFC;">
                  ${guestName}
                </span>
                ${rsvp?.plus_one_name ? `
                  <div style="font-size: 11px; color: #38BDF8; margin-top: 2px; font-weight: 600;">
                    + 1 Guest: ${rsvp.plus_one_name}
                  </div>
                ` : ''}
              </td>
              <td style="padding-bottom: 14px; vertical-align: top; text-align: right; width: 40%;">
                <span style="font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 700;">
                  STATUS
                </span>
                <span style="font-size: 12px; font-weight: 800; color: #34D399; background: rgba(52, 211, 153, 0.15); padding: 3px 8px; border-radius: 6px; display: inline-block;">
                  CONFIRMED
                </span>
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top;" colspan="2">
                <span style="font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 700;">
                  PASS SERIAL CODE
                </span>
                <span style="font-family: monospace; font-size: 15px; font-weight: 900; color: #F8FAFC; letter-spacing: 1.5px;">
                  ${ticketSerial}
                </span>
              </td>
            </tr>
          </table>

          <!-- QR CODE GATE SCANNER SECTION -->
          <div style="background: #FFFFFF; border-radius: 14px; padding: 18px; text-align: center; margin: 16px 0;">
            <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 1.5px;">
              ✦ Present for Gate Check-In ✦
            </p>
            <div style="display: inline-block; padding: 8px; background: #FFFFFF; border-radius: 10px; border: 1px solid #E2E8F0;">
              <img src="${qrImageUrl}" alt="Pass QR Code" width="180" height="180" style="display: block; width: 180px; height: 180px;" />
            </div>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #64748B;">
              Fast door entry • Scannable by event staff
            </p>
          </div>

          <!-- Date & Venue Info inside Pass -->
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; margin-top: 16px; font-size: 13px;">
            <div style="margin-bottom: 6px;">
              📅 <strong>Date & Time:</strong> ${formattedTime}
            </div>
            <div>
              📍 <strong>Venue:</strong> ${event.location_name}${event.city ? `, ${event.city}` : ''}
              ${event.location_address ? `<br/><span style="color: #94A3B8; font-size: 11px; padding-left: 20px;">${event.location_address}</span>` : ''}
            </div>
          </div>

        </div>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 24px 0;">
        <a href="${digitalPassUrl}" target="_blank" class="cta-button" style="margin-right: 8px; margin-bottom: 10px;">
          View / Save Full Digital Pass 🎟️
        </a>
        <a href="${calUrl}" target="_blank" class="secondary-button" style="margin-bottom: 10px;">
          Add to Google Calendar 📅
        </a>
        ${mapsUrl ? `
          <div style="margin-top: 8px;">
            <a href="${mapsUrl}" target="_blank" style="font-size: 12px; color: ${brandColor}; font-weight: 600; text-decoration: underline;">
              Get Venue Directions on Google Maps 🧭
            </a>
          </div>
        ` : ''}
      </div>

      <!-- Arrival Instructions -->
      <div style="background: #F8F9FA; border-left: 4px solid ${brandColor}; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-top: 24px; font-size: 13px; color: #4B5563;">
        <p style="margin: 0 0 4px 0; font-weight: 700; color: #111827;">Door Check-in Instructions:</p>
        <p style="margin: 0;">
          Please show this email or save your pass on your smartphone. The entry staff will scan your QR code at the registration desk for seamless check-in.
        </p>
      </div>
    `,
    `Confirmed: Your digital admission pass for "${event.title}"`
  );

  return sendEmail({
    to,
    subject: `🎟️ Your Entry Pass: ${event.title} | Vibe by Swaniki`,
    html
  });
}

/**
 * 3. Waitlisted Email
 */
export async function sendWaitlistedEmail({
  to,
  guestName,
  position,
  event,
  organizer,
  appUrl
}: {
  to: string;
  guestName: string;
  position: number;
  event: EventItem;
  organizer: { name: string; brand_color?: string; logo_url?: string; handle?: string };
  appUrl?: string;
}) {
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com';
  const eventUrl = `${baseUrl}/${event.slug}`;

  const html = wrapWhiteLabelTemplate(
    organizer,
    `
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; background: #FEF3C7; color: #B45309; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 9999px; border: 1px solid #FCD34D;">
          ⏳ Priority Waitlist
        </span>
        <h1 style="font-size: 22px; font-weight: 900; color: #111827; margin: 12px 0 6px 0; font-family: Georgia, serif;">
          You are on the Waitlist, ${guestName}
        </h1>
        <p style="margin: 0; color: #4B5563; font-size: 14px;">
          <strong>${event.title}</strong> has reached maximum capacity. You have been reserved a priority waitlist queue spot.
        </p>
      </div>

      <div style="background: #F9F7F4; border: 1px solid #E8E4DF; border-radius: 14px; padding: 22px; margin: 24px 0;">
        <div style="font-size: 18px; font-weight: 800; color: #111827; margin: 0 0 10px 0; font-family: Georgia, serif;">
          ${event.title}
        </div>
        <p style="font-size: 14px; color: #111827; margin: 4px 0;">⏳ <strong>Your Position on Waitlist:</strong> <span style="font-weight: 800; color: #B45309;">#${position}</span></p>
        <p style="font-size: 13px; color: #4B5563; margin: 4px 0;">📅 <strong>Event Date:</strong> ${formatIST(event.start_at)}</p>
        <p style="font-size: 13px; color: #4B5563; margin: 4px 0;">📍 <strong>Location:</strong> ${event.location_name}${event.city ? `, ${event.city}` : ''}</p>
      </div>

      <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 14px 18px; border-radius: 0 10px 10px 0; margin: 20px 0; font-size: 13px; color: #1E40AF;">
        <p style="margin: 0 0 4px 0; font-weight: 700;">What happens next?</p>
        <p style="margin: 0;">
          If any registered attendee cancels their reservation, spots are automatically awarded to waitlisted guests in sequential order. You will receive an immediate email notification and digital pass as soon as a spot opens.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${eventUrl}" target="_blank" class="secondary-button">
          Check Event Status Page ↗
        </a>
      </div>
    `,
    `You are on the priority waitlist for ${event.title}`
  );

  return sendEmail({
    to,
    subject: `⏳ Waitlisted (#${position}): ${event.title}`,
    html
  });
}

/**
 * 4. Event Reminder (24h or 1h before)
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

      <div style="background: #F9F7F4; border: 1px solid #E8E4DF; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 20px; font-weight: 800; color: #1A1A2E; margin: 0 0 8px 0; font-family: Georgia, serif;">${event.title}</div>
        <p style="font-size: 13px; color: #4B4B4B; margin: 4px 0;">⏰ <strong>When:</strong> ${formatIST(event.start_at)}</p>
        <p style="font-size: 13px; color: #4B4B4B; margin: 4px 0;">📍 <strong>Where:</strong> ${event.location_name} (${event.city})</p>
        ${event.location_address ? `<p style="font-size: 13px; color: #4B4B4B; margin: 4px 0;">🚗 <strong>Address:</strong> ${event.location_address}</p>` : ''}
      </div>

      <p>We look forward to welcoming you!</p>
      <p>Best,<br/><strong>${organizer.name}</strong></p>
    `,
    `Reminder: ${event.title} starts ${timeDesc}`
  );

  return sendEmail({
    to,
    subject: `📅 Reminder: ${event.title} is ${timeDesc}!`,
    html
  });
}

/**
 * 5. Event Updated Email
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
      <p>The organizer has posted an important update regarding <strong>${event.title}</strong>:</p>

      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 0 10px 10px 0; margin: 20px 0;">
        <p style="margin: 0; font-weight: 700; color: #92400E;">Host Notice:</p>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #78350F;">${changes}</p>
      </div>

      <p>Best,<br/><strong>${organizer.name}</strong></p>
    `,
    `Important update for ${event.title}`
  );

  return sendEmail({
    to,
    subject: `📢 Event Update: ${event.title}`,
    html
  });
}

/**
 * 6. Event Cancelled Email
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
        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px 18px; border-radius: 0 10px 10px 0; margin: 20px 0;">
          <p style="margin: 0; font-weight: 700; color: #991B1B;">Reason from Host:</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; color: #7F1D1D;">${reason}</p>
        </div>
      ` : ''}

      <p>We apologize for any inconvenience caused.</p>
      <p>Sincerely,<br/><strong>${organizer.name}</strong></p>
    `,
    `Event cancelled: ${event.title}`
  );

  return sendEmail({
    to,
    subject: `Cancelled: ${event.title}`,
    html
  });
}
