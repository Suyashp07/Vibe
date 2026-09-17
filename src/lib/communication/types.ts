import { 
  Conversation, 
  ConversationMessage, 
  CommunicationChannel, 
  MessageDeliveryStatus, 
  EventItem 
} from '@/types';

export interface SendToHostParams {
  conversation: Conversation;
  message: ConversationMessage;
  event: EventItem;
  guestName?: string;
}

export interface SendToHostResult {
  externalMessageId?: string | number;
  status: MessageDeliveryStatus;
  error?: string;
  topicId?: string | number | null;
  chatId?: string | number | null;
}

export interface SendToGuestParams {
  conversation: Conversation;
  message: ConversationMessage;
  event: EventItem;
  hostName?: string;
}

export interface SendToGuestResult {
  externalMessageId?: string | number;
  status: MessageDeliveryStatus;
  error?: string;
}

export interface IncomingAdapterMessage {
  conversationId?: string;
  telegramChatId?: string | number;
  telegramTopicId?: string | number;
  messageContent: string;
  senderRole: 'GUEST' | 'HOST';
  externalMessageId?: string | number;
  senderId?: string;
  senderName?: string;
  isDuplicate?: boolean;
  isUnmapped?: boolean;
  rawPayload?: any;
}

/**
 * Channel-independent adapter interface.
 * Implemented by TelegramAdapter, WhatsAppAdapter, WebAdapter, etc.
 */
export interface CommunicationChannelAdapter {
  channelName: CommunicationChannel;
  
  createHostTopic?(params: {
    event: EventItem;
    guestName: string;
    conversationId: string;
  }): Promise<string | number | null>;

  sendToHost(params: SendToHostParams): Promise<SendToHostResult>;

  sendToGuest?(params: SendToGuestParams): Promise<SendToGuestResult>;

  processIncomingMessage?(payload: any): Promise<IncomingAdapterMessage | null>;

  verifyWebhook?(req: Request | any): Promise<boolean> | boolean;
}
