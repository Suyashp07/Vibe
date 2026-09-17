import { 
  CommunicationChannelAdapter, 
  SendToHostParams, 
  SendToHostResult, 
  SendToGuestParams, 
  SendToGuestResult,
  IncomingAdapterMessage 
} from '../types';

/**
 * WhatsAppAdapter stub implementing the unified CommunicationChannelAdapter interface.
 * When a production-ready WhatsApp provider (e.g. Meta Cloud API, Gupshup, or Twilio)
 * is connected, this adapter can be enabled without any changes to the core ConversationService.
 */
export class WhatsAppAdapter implements CommunicationChannelAdapter {
  channelName = 'WHATSAPP' as const;

  async sendToHost(params: SendToHostParams): Promise<SendToHostResult> {
    console.info('[WhatsAppAdapter] WhatsApp host adapter not yet active. Pending Meta API provisioning.');
    return {
      status: 'PENDING',
      error: 'WhatsApp channel adapter pending configuration',
    };
  }

  async sendToGuest(params: SendToGuestParams): Promise<SendToGuestResult> {
    console.info('[WhatsAppAdapter] Outbound WhatsApp message to guest queued.');
    return {
      status: 'PENDING',
      error: 'WhatsApp channel adapter pending configuration',
    };
  }

  async processIncomingMessage(payload: any): Promise<IncomingAdapterMessage | null> {
    // Template for Meta WhatsApp Cloud Webhook processing
    return null;
  }

  verifyWebhook(req: any): boolean {
    return true;
  }
}

export const whatsappAdapter = new WhatsAppAdapter();
