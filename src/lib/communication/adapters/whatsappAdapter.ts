import { 
  CommunicationChannelAdapter, 
  SendToHostParams, 
  SendToHostResult, 
  SendToGuestParams, 
  SendToGuestResult,
  IncomingAdapterMessage 
} from '../types';
import crypto from 'crypto';

/**
 * Deduplication store for WhatsApp update/message IDs
 */
const processedWhatsAppMessages = new Set<string>();

/**
 * Strips phone numbers and emails to protect guest privacy
 */
function sanitizeGuestDisplayName(rawName?: string, rawEmail?: string): string {
  if (rawName && rawName.trim()) {
    const withoutPhone = rawName.replace(/(\+?\d[\d\s-]{7,}\d)/g, '').trim();
    if (withoutPhone) return withoutPhone;
  }
  if (rawEmail && rawEmail.includes('@')) {
    const prefix = rawEmail.split('@')[0];
    return `Guest (${prefix.slice(0, 10)})`;
  }
  return 'Vibe Guest';
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * WhatsAppAdapter implementing the unified CommunicationChannelAdapter interface
 * for the WhatsApp Web QR-code Bridge (Baileys microservice).
 */
import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project')) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export class WhatsAppAdapter implements CommunicationChannelAdapter {
  channelName = 'WHATSAPP' as const;

  getBridgeUrl(): string {
    return (process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');
  }

  getBridgeSecret(): string | undefined {
    return process.env.WHATSAPP_BRIDGE_SECRET || process.env.WHATSAPP_WEBHOOK_SECRET;
  }

  getHostPhone(): string | undefined {
    const raw = process.env.WHATSAPP_HOST_PHONE;
    return raw ? normalizePhone(raw) : undefined;
  }

  /**
   * Dispatches guest inquiry to host's WhatsApp via the WhatsApp Web Bridge.
   */
  async sendToHost(params: SendToHostParams): Promise<SendToHostResult> {
    const { conversation, message, event, guestName } = params;
    const bridgeUrl = this.getBridgeUrl();
    const bridgeSecret = this.getBridgeSecret();

    let hostPhone: string | undefined =
      normalizePhone(event?.whatsapp_host_phone || event?.theme?.whatsapp_host_phone || '');

    // If not found on event, look up organizer's phone in Supabase profiles
    if (!hostPhone && event?.organizer_id) {
      try {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', event.organizer_id)
            .maybeSingle();
          if (prof?.phone) {
            hostPhone = normalizePhone(prof.phone);
          }
        }
      } catch (profErr) {
        console.warn('[WhatsAppAdapter] Profile phone lookup note:', profErr);
      }
    }

    if (!hostPhone) {
      hostPhone = this.getHostPhone();
    }

    if (!hostPhone) {
      console.warn('[WhatsAppAdapter] No host WhatsApp number found on event or in env. Message saved as PENDING.');
      return {
        status: 'PENDING',
        error: 'Host WhatsApp number not configured',
      };
    }

    const guestDisplayName = sanitizeGuestDisplayName(
      guestName || conversation.guest_name,
      conversation.guest_email
    );

    const formattedText = 
      `*VIBE*\n\n` +
      `*Event:* ${event.title || 'Event'}\n\n` +
      `*Guest:*\n${guestDisplayName}\n\n` +
      `*Message:*\n${message.content}\n\n` +
      `👉 _Swipe right and reply to this message to respond directly to the guest._`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (bridgeSecret) {
        headers['Authorization'] = `Bearer ${bridgeSecret}`;
      }

      const res = await fetch(`${bridgeUrl}/send-message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: hostPhone,
          text: formattedText,
          metadata: {
            conversationId: conversation.id,
            eventId: event.id,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[WhatsAppAdapter] Bridge returned error:', res.status, errText);
        return {
          status: 'FAILED',
          error: `WhatsApp bridge returned ${res.status}: ${errText}`,
        };
      }

      const data = await res.json();
      console.log('[WhatsAppAdapter] Message dispatched to WhatsApp bridge:', {
        conversationId: conversation.id,
        messageId: data.messageId,
      });

      return {
        status: 'SENT',
        externalMessageId: data.messageId || `wa-${Date.now()}`,
      };
    } catch (err: any) {
      console.warn('[WhatsAppAdapter] WhatsApp bridge connection failed (is bridge running?):', err.message);
      return {
        status: 'PENDING',
        error: `WhatsApp bridge unreachable: ${err.message}`,
      };
    }
  }

  async sendToGuest(params: SendToGuestParams): Promise<SendToGuestResult> {
    return {
      status: 'PENDING',
      error: 'Direct WhatsApp guest outbound messaging not yet active',
    };
  }

  /**
   * Processes incoming webhook payloads sent by the WhatsApp Bridge.
   */
  async processIncomingMessage(payload: any): Promise<IncomingAdapterMessage | null> {
    if (!payload || !payload.text) {
      return null;
    }

    const messageId = payload.messageId || payload.id;
    if (messageId && processedWhatsAppMessages.has(String(messageId))) {
      return {
        messageContent: '',
        senderRole: 'HOST',
        isDuplicate: true,
        rawPayload: payload,
      };
    }

    if (messageId) {
      processedWhatsAppMessages.add(String(messageId));
      if (processedWhatsAppMessages.size > 2000) {
        const oldest = processedWhatsAppMessages.values().next().value;
        if (oldest) processedWhatsAppMessages.delete(oldest);
      }
    }

    const text = payload.text.trim();
    if (!text) return null;

    const senderPhone = payload.senderPhone ? normalizePhone(payload.senderPhone) : undefined;

    return {
      conversationId: payload.conversationId,
      messageContent: text,
      senderRole: 'HOST',
      externalMessageId: messageId,
      senderId: senderPhone || 'whatsapp-host',
      senderName: payload.senderName || 'Host',
      rawPayload: payload,
    };
  }

  /**
   * Verifies incoming webhook request from the bridge
   */
  verifyWebhook(req: any): boolean {
    const expectedSecret = this.getBridgeSecret();
    if (!expectedSecret) return true;

    const tokenHeader =
      req.headers?.get?.('x-whatsapp-webhook-secret') ||
      req.headers?.['x-whatsapp-webhook-secret'] ||
      req.headers?.get?.('authorization')?.replace(/^Bearer\s+/i, '') ||
      req.headers?.['authorization']?.replace(/^Bearer\s+/i, '');

    if (!tokenHeader) return false;

    const expectedBuf = Buffer.from(expectedSecret);
    const tokenBuf = Buffer.from(tokenHeader);

    if (expectedBuf.length !== tokenBuf.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(expectedBuf, tokenBuf);
    } catch {
      return false;
    }
  }
}

export const whatsappAdapter = new WhatsAppAdapter();
