/**
 * Telegram Host Channel Adapter for Vibe Communication Gateway
 * 
 * Implements:
 * 1. Telegram Bot API integration (createForumTopic, closeForumTopic, reopenForumTopic, sendMessage)
 * 2. Outgoing message service with clean HTML formatting
 * 3. Incoming webhook handler with secret validation
 * 4. Telegram chat ID mapping & storage
 * 5. Telegram topic/thread mapping
 * 6. Deterministic message correlation (no guessing)
 * 7. Duplicate webhook protection (update_id deduplication cache & DB)
 * 8. Comprehensive error handling (400, 403, 429 rate limit, network timeout)
 * 9. Retry-safe message delivery with exponential backoff & retry_after handling
 * 10. Structured sanitized logging
 * 11. Secure secret handling via environment variables
 */

import { 
  CommunicationChannelAdapter, 
  SendToHostParams, 
  SendToHostResult, 
  IncomingAdapterMessage 
} from '../types';
import { EventItem } from '@/types';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project')) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// In-memory deduplication set for update_ids (LRU/TTL pattern)
const processedUpdateIds: Set<number> = (globalThis as any).__vibeProcessedUpdates || new Set<number>();
(globalThis as any).__vibeProcessedUpdates = processedUpdateIds;

// Structured sanitized logger
export function logTelegramEvent(event: string, payload: Record<string, any>) {
  const cleanPayload = { ...payload };
  // Never log private bot tokens or credentials
  delete cleanPayload.botToken;
  delete cleanPayload.token;
  delete cleanPayload.secret;
  console.log(`[TelegramAdapter] ${event}`, JSON.stringify(cleanPayload));
}

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
   * Helper: Performs an API call to Telegram Bot API with retry-safe logic:
   * - AbortController timeout (10s)
   * - Exponential backoff on 5xx or fetch errors
   * - Reads retry_after on 429 Too Many Requests
   * - Fails fast without retrying on 4xx client errors (400, 403)
   */
  private async sendWithRetry(
    apiMethod: string,
    body: Record<string, any>,
    maxRetries = 3
  ): Promise<{ ok: boolean; result?: any; description?: string; errorCode?: number }> {
    const token = this.getBotToken();
    if (!token) {
      return { ok: false, description: 'Missing TELEGRAM_BOT_TOKEN' };
    }

    const url = `${TELEGRAM_API_BASE}/bot${token}/${apiMethod}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await res.json().catch(() => null);

        if (res.ok && data?.ok) {
          return { ok: true, result: data.result };
        }

        const errorCode = data?.error_code || res.status;
        const description = data?.description || res.statusText;

        // Check for 429 Too Many Requests
        if (errorCode === 429) {
          const retryAfterSec = data?.parameters?.retry_after || 1;
          const waitMs = Math.min(retryAfterSec * 1000, 3000);
          logTelegramEvent('telegram_api_retry', {
            method: apiMethod,
            attempt,
            reason: 'Rate limited (429)',
            waitMs,
          });
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }
        }

        // Fail fast on non-retryable client errors (400, 403, 404)
        if (errorCode >= 400 && errorCode < 500 && errorCode !== 429) {
          logTelegramEvent('telegram_message_failed', {
            method: apiMethod,
            errorCode,
            description,
            retryable: false,
          });
          return { ok: false, description, errorCode };
        }

        // Retry on 5xx server errors
        if (attempt < maxRetries) {
          const backoffMs = Math.min(2000, 300 * Math.pow(2, attempt - 1));
          logTelegramEvent('telegram_api_retry', {
            method: apiMethod,
            attempt,
            errorCode,
            description,
            backoffMs,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        return { ok: false, description, errorCode };
      } catch (err: any) {
        clearTimeout(timeoutId);

        if (attempt < maxRetries) {
          const backoffMs = Math.min(2000, 300 * Math.pow(2, attempt - 1));
          logTelegramEvent('telegram_api_retry', {
            method: apiMethod,
            attempt,
            error: err.message,
            backoffMs,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        return { ok: false, description: err.message || 'Network fetch timeout' };
      }
    }

    return { ok: false, description: 'Exceeded maximum retries' };
  }

  /**
   * Checks whether a Telegram webhook update has already been processed (Deduplication).
   */
  async isDuplicateUpdate(updateId: number): Promise<boolean> {
    if (!updateId) return false;

    // 1. Fast in-memory check
    if (processedUpdateIds.has(updateId)) {
      return true;
    }

    // 2. Database check if available
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('telegram_webhook_updates')
          .select('update_id')
          .eq('update_id', updateId)
          .maybeSingle();

        if (data) {
          processedUpdateIds.add(updateId);
          return true;
        }
      } catch (err) {
        // Table may not exist yet or connection blip, proceed safely
      }
    }

    return false;
  }

  /**
   * Records that an update_id was successfully processed.
   */
  async recordProcessedUpdate(updateId: number): Promise<void> {
    if (!updateId) return;

    // Store in memory (keep max 10,000 to prevent memory growth)
    if (processedUpdateIds.size > 10000) {
      const firstEntries = Array.from(processedUpdateIds).slice(0, 2000);
      firstEntries.forEach((id) => processedUpdateIds.delete(id));
    }
    processedUpdateIds.add(updateId);

    // Store in Supabase
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('telegram_webhook_updates')
          .insert([{ update_id: updateId }])
          .select()
          .maybeSingle();
      } catch (err) {
        // Safe to ignore duplicate key error
      }
    }
  }

  /**
   * Creates a dedicated Telegram Supergroup Forum Topic for a Vibe conversation.
   * Named with event title + guest display name + short conversation ID.
   */
  async createHostTopic(params: {
    event: EventItem;
    guestName: string;
    conversationId: string;
  }): Promise<string | number | null> {
    const chatId = this.getHostChatId();
    if (!chatId) {
      console.warn('[TelegramAdapter] Missing TELEGRAM_HOST_CHAT_ID for creating topic.');
      return null;
    }

    const shortId = params.conversationId.slice(0, 8);
    // Max topic name length in Telegram is 128 characters
    const cleanTitle = (params.event.title || 'Event').slice(0, 30);
    const cleanGuest = (params.guestName || 'Guest').slice(0, 25);
    const topicName = `${cleanTitle} — ${cleanGuest} (#${shortId})`;

    const resp = await this.sendWithRetry('createForumTopic', {
      chat_id: chatId,
      name: topicName,
    });

    if (resp.ok && resp.result?.message_thread_id) {
      const topicId = resp.result.message_thread_id;
      logTelegramEvent('telegram_topic_created', {
        chatId,
        topicId,
        topicName,
        conversationId: params.conversationId,
      });
      return topicId;
    }

    logTelegramEvent('telegram_topic_failed', {
      chatId,
      error: resp.description,
    });
    return null;
  }

  /**
   * Closes a Telegram Forum Topic when the host closes the conversation in Vibe.
   */
  async closeHostTopic(params: {
    topicId: string | number;
    chatId?: string | number | null;
  }): Promise<boolean> {
    const chatId = params.chatId || this.getHostChatId();
    if (!chatId || !params.topicId) return false;

    const resp = await this.sendWithRetry('closeForumTopic', {
      chat_id: chatId,
      message_thread_id: Number(params.topicId),
    });

    if (resp.ok) {
      logTelegramEvent('telegram_topic_closed', {
        chatId,
        topicId: params.topicId,
      });
      return true;
    }
    return false;
  }

  /**
   * Reopens a Telegram Forum Topic when the conversation is reopened.
   */
  async reopenHostTopic(params: {
    topicId: string | number;
    chatId?: string | number | null;
  }): Promise<boolean> {
    const chatId = params.chatId || this.getHostChatId();
    if (!chatId || !params.topicId) return false;

    const resp = await this.sendWithRetry('reopenForumTopic', {
      chat_id: chatId,
      message_thread_id: Number(params.topicId),
    });

    if (resp.ok) {
      logTelegramEvent('telegram_topic_reopened', {
        chatId,
        topicId: params.topicId,
      });
      return true;
    }
    return false;
  }

  /**
   * Delivers a guest message to the host inside Telegram.
   * Sends to the specific message_thread_id if topic exists.
   */
  async sendToHost(params: SendToHostParams): Promise<SendToHostResult> {
    const token = this.getBotToken();
    const chatId = params.conversation.telegram_chat_id || this.getHostChatId();

    if (!token || !chatId) {
      console.warn('[TelegramAdapter] Telegram unconfigured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_HOST_CHAT_ID). Storing message as PENDING.');
      return {
        status: 'PENDING',
        error: 'Telegram host credentials not configured',
      };
    }

    const { conversation, message, event, guestName } = params;
    let topicId = conversation.telegram_topic_id;

    // Create topic if not already created
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

    // Format IST time
    const timeStr = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Formatted message adhering strictly to requirements:
    // Extremely clean, no phone numbers exposed
    const text =
      `💬 <b>VIBE — GUEST MESSAGE</b>\n` +
      `<b>Event:</b> ${escapeHtml(event.title)}\n` +
      `<b>Conversation:</b> <code>#${shortId}</code>\n\n` +
      `<b>Guest:</b> ${escapeHtml(guestDisplayName)}\n` +
      `<b>Time:</b> ${timeStr} (IST)\n\n` +
      `<b>Message:</b>\n${escapeHtml(message.content)}\n\n` +
      `<i>👉 Reply directly in this topic to respond to the guest.</i>\n` +
      `<!-- CONV_ID:${conversation.id} -->`;

    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    if (topicId) {
      payload.message_thread_id = Number(topicId);
    }

    const resp = await this.sendWithRetry('sendMessage', payload);

    if (resp.ok && resp.result?.message_id) {
      logTelegramEvent('telegram_message_sent', {
        conversationId: conversation.id,
        messageId: message.id,
        externalMessageId: resp.result.message_id,
        chatId,
        topicId,
      });

      return {
        externalMessageId: resp.result.message_id,
        status: 'SENT',
        topicId,
        chatId,
      };
    } else {
      logTelegramEvent('telegram_message_failed', {
        conversationId: conversation.id,
        messageId: message.id,
        error: resp.description,
      });

      return {
        status: 'FAILED',
        error: resp.description || 'Telegram API returned failure',
      };
    }
  }

  /**
   * Processes incoming Telegram webhook update.
   * Enforces:
   * 1. Duplicate webhook protection (update_id deduplication)
   * 2. Accurate correlation by (chat_id, message_thread_id) or embedded CONV_ID
   * 3. If unmapped: NEVER guess. Log and mark as isUnmapped.
   */
  async processIncomingMessage(payload: any): Promise<IncomingAdapterMessage | null> {
    if (!payload?.message) {
      return null;
    }

    const updateId = payload.update_id;
    if (updateId && (await this.isDuplicateUpdate(updateId))) {
      logTelegramEvent('telegram_webhook_duplicate', { updateId });
      return {
        messageContent: '',
        senderRole: 'HOST',
        isDuplicate: true,
        rawPayload: payload,
      };
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

    const chatId = msg.chat?.id;
    const topicId = msg.message_thread_id || null;
    let extractedConvId: string | undefined = undefined;

    // Check if replying to a bot message that contains the conversation tag
    if (msg.reply_to_message?.text) {
      const match = msg.reply_to_message.text.match(/CONV_ID:([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        extractedConvId = match[1];
      }
    }

    // Check if text itself contains correlation tag
    if (!extractedConvId && text.includes('CONV_ID:')) {
      const match = text.match(/CONV_ID:([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        extractedConvId = match[1];
      }
    }

    // Requirement 6 & 10: If neither a topic ID nor a conversation tag was found,
    // this topic cannot be mapped. Do NOT guess the conversation!
    if (!topicId && !extractedConvId) {
      logTelegramEvent('telegram_webhook_unmapped_topic', {
        chatId,
        messageId: msg.message_id,
        senderId: msg.from?.id,
        preview: text.slice(0, 50),
      });
      return {
        messageContent: text.trim(),
        senderRole: 'HOST',
        isUnmapped: true,
        rawPayload: payload,
      };
    }

    // Record that this update_id has now been processed
    if (updateId) {
      await this.recordProcessedUpdate(updateId);
    }

    logTelegramEvent('telegram_message_received', {
      externalMessageId: msg.message_id,
      chatId,
      topicId,
      extractedConvId,
      senderId: msg.from?.id,
    });

    return {
      conversationId: extractedConvId,
      telegramChatId: chatId ? String(chatId) : undefined,
      telegramTopicId: topicId ? String(topicId) : undefined,
      messageContent: text.trim(),
      senderRole: 'HOST',
      externalMessageId: msg.message_id,
      senderId: String(msg.from?.id || 'telegram-host'),
      senderName: msg.from?.first_name || 'Event Host',
      rawPayload: payload,
    };
  }

  /**
   * Webhook security verification:
   * Validates x-telegram-bot-api-secret-token against process.env.TELEGRAM_WEBHOOK_SECRET
   */
  verifyWebhook(req: any): boolean {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!expectedSecret) return true; // Optional security header if not yet set in environment

    const tokenHeader =
      req.headers?.get?.('x-telegram-bot-api-secret-token') ||
      req.headers?.['x-telegram-bot-api-secret-token'];

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
