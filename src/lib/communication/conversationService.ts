import { 
  Conversation, 
  ConversationMessage, 
  ConversationStatus, 
  CommunicationChannel, 
  MessageDeliveryStatus,
  EventItem 
} from '@/types';
import { telegramAdapter } from './adapters/telegramAdapter';
import { whatsappAdapter } from './adapters/whatsappAdapter';
import { CommunicationChannelAdapter } from './types';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project')) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// In-memory rate limiting map: guestId -> timestamps[]
const rateLimitMap: Map<string, number[]> =
  (globalThis as any).__vibeRateLimitMap || new Map<string, number[]>();
(globalThis as any).__vibeRateLimitMap = rateLimitMap;

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 10; // Max 10 messages per minute

// In-memory / local fallback stores (persisted globally across server routes)
const memoryConversations: Map<string, Conversation> =
  (globalThis as any).__vibeConversations || new Map<string, Conversation>();
(globalThis as any).__vibeConversations = memoryConversations;

const memoryMessages: Map<string, ConversationMessage[]> =
  (globalThis as any).__vibeMessages || new Map<string, ConversationMessage[]>();
(globalThis as any).__vibeMessages = memoryMessages;

export class ConversationService {
  private adapters: Map<CommunicationChannel, CommunicationChannelAdapter>;

  constructor() {
    this.adapters = new Map();
    this.adapters.set('TELEGRAM', telegramAdapter);
    this.adapters.set('WHATSAPP', whatsappAdapter);
  }

  private getAdapter(channel: CommunicationChannel): CommunicationChannelAdapter {
    const adapter = this.adapters.get(channel);
    if (!adapter) {
      throw new Error(`Unsupported communication channel: ${channel}`);
    }
    return adapter;
  }

  /**
   * Enforces sliding window rate limit on guest messaging
   */
  private checkRateLimit(guestId: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const timestamps = (rateLimitMap.get(guestId) || []).filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );

    if (timestamps.length >= MAX_MESSAGES_PER_WINDOW) {
      const oldestInWindow = timestamps[0];
      const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
      return { allowed: false, retryAfterMs };
    }

    timestamps.push(now);
    rateLimitMap.set(guestId, timestamps);
    return { allowed: true };
  }

  /**
   * Find existing conversation for (event_id, guest_id) or create a new one.
   * Enforces that each guest has exactly one conversation per event.
   */
  async findOrCreateConversation(params: {
    eventId: string;
    guestId: string;
    hostId: string;
    guestName?: string;
    guestEmail?: string;
    guestChannel?: CommunicationChannel;
    hostChannel?: CommunicationChannel;
  }): Promise<Conversation> {
    const {
      eventId,
      guestId,
      hostId,
      guestName,
      guestEmail,
      guestChannel = 'WEB',
      hostChannel = 'TELEGRAM',
    } = params;

    if (!eventId || !eventId.trim()) {
      throw new Error('Invalid event: eventId cannot be empty.');
    }
    if (!guestId || !guestId.trim()) {
      throw new Error('Invalid guest: guestId cannot be empty.');
    }
    if (!hostId || !hostId.trim()) {
      throw new Error('Invalid host: hostId cannot be empty.');
    }

    const supabase = getSupabaseAdmin();

    // 1. Check existing in Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('event_id', eventId)
          .eq('guest_id', guestId)
          .maybeSingle();

        if (data && !error) {
          memoryConversations.set(data.id, data);
          return data;
        }
      } catch (err) {
        console.warn('[ConversationService] Supabase conversation query warning:', err);
      }
    }

    // 2. Check existing in memory
    for (const conv of Array.from(memoryConversations.values())) {
      if (conv.event_id === eventId && conv.guest_id === guestId) {
        return conv;
      }
    }

    // 3. Create new conversation
    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event_id: eventId,
      guest_id: guestId,
      host_id: hostId,
      guest_name: guestName,
      guest_email: guestEmail,
      status: 'OPEN',
      guest_channel: guestChannel,
      host_channel: hostChannel,
      telegram_topic_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    };

    memoryConversations.set(newConv.id, newConv);
    memoryMessages.set(newConv.id, []);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert([{
            event_id: eventId,
            guest_id: guestId,
            host_id: hostId,
            guest_name: guestName,
            guest_email: guestEmail,
            status: 'OPEN',
            guest_channel: guestChannel,
            host_channel: hostChannel,
          }])
          .select()
          .single();

        if (data && !error) {
          memoryConversations.set(data.id, data);
          console.log('[ConversationService] conversation_created in Supabase:', data.id);
          return data;
        }
      } catch (dbErr) {
        console.warn('[ConversationService] Supabase conversation insert note:', dbErr);
      }
    }

    console.log('[ConversationService] conversation_created locally:', newConv.id);
    return newConv;
  }

  /**
   * Retrieves conversation with IDOR authorization validation
   */
  async getConversationById(
    conversationId: string,
    requesterId?: string,
    requesterRole?: string
  ): Promise<Conversation | null> {
    const supabase = getSupabaseAdmin();
    let conv: Conversation | null = memoryConversations.get(conversationId) || null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .maybeSingle();

        if (data && !error) {
          conv = data;
          memoryConversations.set(data.id, data);
        }
      } catch (err) {
        console.warn('[ConversationService] Supabase getConversationById warning:', err);
      }
    }

    if (!conv) return null;

    // IDOR Protection: requester must be the guest, the host, or a super_admin
    if (requesterId) {
      const isGuest = conv.guest_id.toLowerCase() === requesterId.toLowerCase();
      const isHost = conv.host_id.toLowerCase() === requesterId.toLowerCase();
      const isAdmin = requesterRole === 'super_admin';

      if (!isGuest && !isHost && !isAdmin) {
        throw new Error('Unauthorized: You do not have access to this conversation.');
      }
    }

    return conv;
  }

  /**
   * Resolves conversation by Telegram topic ID
   */
  async resolveConversationByTopic(topicId: string | number): Promise<Conversation | null> {
    const topicStr = String(topicId);
    const supabase = getSupabaseAdmin();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('telegram_topic_id', topicStr)
          .maybeSingle();

        if (data && !error) {
          console.log('[ConversationService] conversation_resolved by topic:', {
            topicId: topicStr,
            conversationId: data.id,
          });
          return data;
        }
      } catch (err) {
        console.warn('[ConversationService] resolveConversationByTopic warning:', err);
      }
    }

    for (const conv of Array.from(memoryConversations.values())) {
      if (conv.telegram_topic_id && String(conv.telegram_topic_id) === topicStr) {
        return conv;
      }
    }

    return null;
  }

  /**
   * Get all conversations for a specific guest or host
   */
  async getConversationsForUser(
    userId: string,
    role: 'guest' | 'host'
  ): Promise<Conversation[]> {
    const supabase = getSupabaseAdmin();
    const qUser = userId.toLowerCase().trim();

    if (supabase) {
      try {
        const query = supabase.from('conversations').select('*').order('last_message_at', { ascending: false });
        if (role === 'guest') {
          query.eq('guest_id', qUser);
        } else {
          query.eq('host_id', qUser);
        }
        const { data, error } = await query;
        if (data && !error) {
          data.forEach((c) => memoryConversations.set(c.id, c));
          return data;
        }
      } catch (err) {
        console.warn('[ConversationService] getConversationsForUser query warning:', err);
      }
    }

    const list: Conversation[] = [];
    for (const conv of Array.from(memoryConversations.values())) {
      if (role === 'guest' && conv.guest_id.toLowerCase() === qUser) {
        list.push(conv);
      } else if (role === 'host' && conv.host_id.toLowerCase() === qUser) {
        list.push(conv);
      }
    }

    return list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  }

  /**
   * Retrieves messages for a conversation with authorization check
   */
  async getConversationMessages(
    conversationId: string,
    requesterId?: string,
    requesterRole?: string
  ): Promise<ConversationMessage[]> {
    await this.getConversationById(conversationId, requesterId, requesterRole);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (data && !error) {
          memoryMessages.set(conversationId, data);
          return data;
        }
      } catch (err) {
        console.warn('[ConversationService] getConversationMessages warning:', err);
      }
    }

    return memoryMessages.get(conversationId) || [];
  }

  /**
   * Post a message from a guest to the conversation.
   * Dispatches to the host channel adapter (Telegram).
   */
  async postGuestMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    event: EventItem;
    guestName?: string;
  }): Promise<ConversationMessage> {
    const { conversationId, senderId, content, event, guestName } = params;

    // 1. Validate message size
    const trimmed = content?.trim() || '';
    if (!trimmed || trimmed.length === 0) {
      throw new Error('Message content cannot be empty.');
    }
    if (trimmed.length > 2000) {
      throw new Error('Message length exceeds the 2000 character limit.');
    }

    // 2. Validate rate limit
    const rate = this.checkRateLimit(senderId);
    if (!rate.allowed) {
      const waitSec = Math.ceil((rate.retryAfterMs || 1000) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitSec} seconds before sending another message.`);
    }

    // 3. Validate conversation & status
    const conv = await this.getConversationById(conversationId, senderId);
    if (!conv) {
      throw new Error('Conversation not found.');
    }
    if (conv.status === 'CLOSED') {
      throw new Error('This conversation has been closed by the host.');
    }
    if (conv.status === 'BLOCKED') {
      throw new Error('This conversation is currently blocked.');
    }

    const newMsg: ConversationMessage = {
      id: `cmsg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: conv.id,
      event_id: conv.event_id,
      sender_id: senderId,
      sender_role: 'GUEST',
      content: trimmed,
      channel: 'WEB',
      delivery_status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    // Store in memory
    const curList = memoryMessages.get(conv.id) || [];
    curList.push(newMsg);
    memoryMessages.set(conv.id, curList);

    console.log('[ConversationService] message_created', {
      messageId: newMsg.id,
      conversationId: conv.id,
      senderRole: 'GUEST',
    });

    // 4. Dispatch through Host Channel Adapter (Telegram)
    const adapter = this.getAdapter(conv.host_channel);
    try {
      const dispatchResult = await adapter.sendToHost({
        conversation: conv,
        message: newMsg,
        event,
        guestName: guestName || conv.guest_name,
      });

      newMsg.delivery_status = dispatchResult.status;
      newMsg.external_message_id = dispatchResult.externalMessageId || null;

      // Update topic if new topic was created
      if (dispatchResult.topicId && (!conv.telegram_topic_id || conv.telegram_topic_id !== dispatchResult.topicId)) {
        await this.updateConversationTopic(conv.id, dispatchResult.topicId);
      }
    } catch (dispatchErr: any) {
      console.error('[ConversationService] Channel adapter dispatch failed:', dispatchErr.message);
      newMsg.delivery_status = 'FAILED';
    }

    // 5. Update last_message_at
    conv.last_message_at = newMsg.created_at;
    conv.updated_at = newMsg.created_at;

    // 6. Dual-persist to Supabase
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('conversations')
          .update({
            last_message_at: conv.last_message_at,
            updated_at: conv.updated_at,
          })
          .eq('id', conv.id);

        const { data } = await supabase
          .from('conversation_messages')
          .insert([{
            conversation_id: conv.id,
            event_id: conv.event_id,
            sender_id: senderId,
            sender_role: 'GUEST',
            content: trimmed,
            channel: 'WEB',
            delivery_status: newMsg.delivery_status,
            external_message_id: newMsg.external_message_id ? String(newMsg.external_message_id) : null,
          }])
          .select()
          .single();

        if (data) {
          newMsg.id = data.id;
        }
      } catch (dbErr) {
        console.warn('[ConversationService] Supabase message save error:', dbErr);
      }
    }

    console.log('[ConversationService] guest_message_delivered', {
      messageId: newMsg.id,
      deliveryStatus: newMsg.delivery_status,
    });

    return newMsg;
  }

  /**
   * Post a reply from the host (typically received via Telegram webhook).
   */
  async postHostMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    channel?: CommunicationChannel;
    externalMessageId?: string | number;
  }): Promise<ConversationMessage> {
    const { conversationId, senderId, content, channel = 'TELEGRAM', externalMessageId } = params;

    const trimmed = content?.trim() || '';
    if (!trimmed) {
      throw new Error('Message content cannot be empty.');
    }

    const conv = await this.getConversationById(conversationId);
    if (!conv) {
      throw new Error('Conversation not found.');
    }

    const newMsg: ConversationMessage = {
      id: `cmsg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: conv.id,
      event_id: conv.event_id,
      sender_id: senderId,
      sender_role: 'HOST',
      content: trimmed,
      channel,
      delivery_status: 'DELIVERED',
      external_message_id: externalMessageId || null,
      created_at: new Date().toISOString(),
    };

    const curList = memoryMessages.get(conv.id) || [];
    curList.push(newMsg);
    memoryMessages.set(conv.id, curList);

    conv.last_message_at = newMsg.created_at;
    conv.updated_at = newMsg.created_at;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('conversations')
          .update({
            last_message_at: conv.last_message_at,
            updated_at: conv.updated_at,
          })
          .eq('id', conv.id);

        const { data } = await supabase
          .from('conversation_messages')
          .insert([{
            conversation_id: conv.id,
            event_id: conv.event_id,
            sender_id: senderId,
            sender_role: 'HOST',
            content: trimmed,
            channel,
            delivery_status: 'DELIVERED',
            external_message_id: externalMessageId ? String(externalMessageId) : null,
          }])
          .select()
          .single();

        if (data) {
          newMsg.id = data.id;
        }
      } catch (dbErr) {
        console.warn('[ConversationService] Supabase host message save error:', dbErr);
      }
    }

    console.log('[ConversationService] host_message_delivered', {
      conversationId: conv.id,
      messageId: newMsg.id,
      externalMessageId,
    });

    return newMsg;
  }

  /**
   * Update Telegram topic mapping for conversation
   */
  async updateConversationTopic(conversationId: string, topicId: string | number): Promise<void> {
    const topicStr = String(topicId);
    const conv = memoryConversations.get(conversationId);
    if (conv) {
      conv.telegram_topic_id = topicStr;
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('conversations')
          .update({ telegram_topic_id: topicStr })
          .eq('id', conversationId);
      } catch (err) {
        console.warn('[ConversationService] updateConversationTopic warning:', err);
      }
    }
  }

  /**
   * Close a conversation (only host or admin allowed)
   */
  async closeConversation(conversationId: string, requesterId: string): Promise<Conversation> {
    const conv = await this.getConversationById(conversationId, requesterId);
    if (!conv) throw new Error('Conversation not found.');

    conv.status = 'CLOSED';
    conv.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('conversations')
          .update({ status: 'CLOSED', updated_at: conv.updated_at })
          .eq('id', conversationId);
      } catch (err) {
        console.warn('[ConversationService] closeConversation warning:', err);
      }
    }

    return conv;
  }

  /**
   * Reopen a conversation
   */
  async reopenConversation(conversationId: string, requesterId: string): Promise<Conversation> {
    const conv = await this.getConversationById(conversationId, requesterId);
    if (!conv) throw new Error('Conversation not found.');

    conv.status = 'OPEN';
    conv.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('conversations')
          .update({ status: 'OPEN', updated_at: conv.updated_at })
          .eq('id', conversationId);
      } catch (err) {
        console.warn('[ConversationService] reopenConversation warning:', err);
      }
    }

    return conv;
  }
}

export const conversationService = new ConversationService();
