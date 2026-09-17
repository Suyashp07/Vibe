import { 
  CommunicationChannelAdapter, 
  SendToHostParams, 
  SendToHostResult, 
  IncomingAdapterMessage 
} from '../types';
import { EventItem } from '@/types';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export class TelegramAdapter implements CommunicationChannelAdapter {
  channelName = 'TELEGRAM' as const;

  private getBotToken(): string | null {
    return process.env.TELEGRAM_BOT_TOKEN || null;
  }

  private getHostChatId(): string | number | null {
    return (
      process.env.TELEGRAM_HOST_CHAT_ID ||
      process.env.TELEGRAM_ADMIN_CHAT_ID ||
      null
    );
  }

  /**
   * Creates a dedicated Telegram forum topic inside a Supergroup for an event conversation.
   * Preferring one topic per conversation.
   */
  async createHostTopic(params: {
    event: EventItem;
    guestName: string;
    conversationId: string;
  }): Promise<string | number | null> {
    const token = this.getBotToken();
    const chatId = this.getHostChatId();

    if (!token || !chatId) {
      console.warn('[TelegramAdapter] Missing bot token or host chat ID for creating forum topic.');
      return null;
    }

    try {
      const shortId = params.conversationId.slice(0, 8);
      const topicName = `${params.event.title.slice(0, 25)} — ${params.guestName || 'Guest'} (${shortId})`;

      const url = `${TELEGRAM_API_BASE}/bot${token}/createForumTopic`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          name: topicName,
        }),
      });

      const data = await res.json();
      if (data.ok && data.result?.message_thread_id) {
        console.log('[TelegramAdapter] Created forum topic:', {
          topicId: data.result.message_thread_id,
          name: topicName,
        });
        return data.result.message_thread_id;
      } else {
        console.warn('[TelegramAdapter] Could not create forum topic (chat may not have topics enabled):', data.description);
        return null;
      }
    } catch (err: any) {
      console.warn('[TelegramAdapter] Error creating forum topic:', err.message);
      return null;
    }
  }

  /**
   * Delivers a guest message to the host inside Telegram.
   * Routes to the specific Telegram topic if one exists, otherwise delivers to the group chat.
   */
  async sendToHost(params: SendToHostParams): Promise<SendToHostResult> {
    const token = this.getBotToken();
    const chatId = this.getHostChatId();

    if (!token || !chatId) {
      console.warn('[TelegramAdapter] Telegram is not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_HOST_CHAT_ID). Storing message as PENDING.');
      return {
        status: 'PENDING',
        error: 'Telegram host channel credentials not configured',
      };
    }

    const { conversation, message, event, guestName } = params;
    let topicId = conversation.telegram_topic_id;

    // If no topic exists yet, attempt to create one in the supergroup
    if (!topicId) {
      const newTopicId = await this.createHostTopic({
        event,
        guestName: guestName || conversation.guest_name || 'Attendee',
        conversationId: conversation.id,
      });
      if (newTopicId) {
        topicId = newTopicId;
      }
    }

    const shortId = conversation.id.slice(0, 8);
    const guestDisplayName = guestName || conversation.guest_name || 'Vibe Attendee';

    // Formatted message according to Requirement 8 & 15:
    // Extremely clean, no sensitive phone numbers exposed
    const text = 
      `💬 <b>VIBE — GUEST MESSAGE</b>\n` +
      `<b>Event:</b> ${escapeHtml(event.title)}\n` +
      `<b>Conversation:</b> <code>#${shortId}</code>\n\n` +
      `<b>Guest:</b> ${escapeHtml(guestDisplayName)}\n` +
      `<b>Message:</b>\n${escapeHtml(message.content)}\n\n` +
      `<i>👉 Reply directly in this topic to respond to the guest.</i>\n` +
      `<!-- CONV_ID:${conversation.id} -->`;

    try {
      const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
      const payload: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      };

      if (topicId) {
        payload.message_thread_id = Number(topicId);
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok && data.result?.message_id) {
        console.log('[TelegramAdapter] telegram_message_sent', {
          conversationId: conversation.id,
          messageId: message.id,
          externalMessageId: data.result.message_id,
          topicId,
        });

        return {
          externalMessageId: data.result.message_id,
          status: 'SENT',
          topicId,
        };
      } else {
        console.error('[TelegramAdapter] telegram_message_failed', {
          conversationId: conversation.id,
          messageId: message.id,
          error: data.description,
        });

        return {
          status: 'FAILED',
          error: data.description || 'Telegram API returned non-OK response',
        };
      }
    } catch (err: any) {
      console.error('[TelegramAdapter] telegram_message_failed exception:', {
        conversationId: conversation.id,
        messageId: message.id,
        error: err.message,
      });

      return {
        status: 'FAILED',
        error: err.message,
      };
    }
  }

  /**
   * Processes incoming Telegram webhook update.
   * Correlates incoming host replies by message_thread_id (Telegram topic ID)
   * or reply_to_message.
   */
  async processIncomingMessage(payload: any): Promise<IncomingAdapterMessage | null> {
    if (!payload?.message) {
      return null;
    }

    const msg = payload.message;
    const text = msg.text || msg.caption || '';
    if (!text.trim()) {
      return null;
    }

    // Ignore bot commands (/start, /help)
    if (text.startsWith('/')) {
      return null;
    }

    // Do not process messages sent by bots
    if (msg.from?.is_bot) {
      return null;
    }

    const topicId = msg.message_thread_id || null;
    let extractedConvId: string | undefined = undefined;

    // Check if the reply is replying to a bot message that contains the conversation tag
    if (msg.reply_to_message?.text) {
      const match = msg.reply_to_message.text.match(/CONV_ID:([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        extractedConvId = match[1];
      }
    }

    // Also check if text itself has correlation header
    if (!extractedConvId && text.includes('CONV_ID:')) {
      const match = text.match(/CONV_ID:([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        extractedConvId = match[1];
      }
    }

    // If neither a topic ID nor a conversation tag was found, this is not a communication reply
    if (!topicId && !extractedConvId) {
      return null;
    }

    console.log('[TelegramAdapter] telegram_message_received', {
      externalMessageId: msg.message_id,
      topicId,
      extractedConvId,
      senderId: msg.from?.id,
    });

    return {
      conversationId: extractedConvId,
      telegramTopicId: topicId ? String(topicId) : undefined,
      messageContent: text.trim(),
      senderRole: 'HOST',
      externalMessageId: msg.message_id,
      senderId: String(msg.from?.id || 'telegram-host'),
      senderName: msg.from?.first_name || 'Event Host',
      rawPayload: payload,
    };
  }

  verifyWebhook(req: any): boolean {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!expectedSecret) return true; // Optional security header
    const tokenHeader = req.headers?.get?.('x-telegram-bot-api-secret-token') || req.headers?.['x-telegram-bot-api-secret-token'];
    return tokenHeader === expectedSecret;
  }
}

function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const telegramAdapter = new TelegramAdapter();
