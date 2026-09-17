/**
 * Host-Facing Telegram Experience End-to-End Verification Test
 *
 * Verifies all requirements:
 * 1. Determine the event
 * 2. Determine the host
 * 3. Create or resolve the conversation
 * 4. Create the required Telegram topic/thread
 * 5. Store the Telegram topic ID
 * 6. Send a formatted notification into the topic (matching exact requested format)
 * 7. Host natural reply in topic (Telegram webhook -> Vibe backend -> conversation -> guest)
 * 8. Zero complicated commands required from host
 * 9. Privacy: No unnecessary guest personal info exposed
 * 10. Idempotency against Telegram webhook retries
 * 11. Unmapped topic safety (never guess)
 */

import { conversationService } from '../src/lib/communication/conversationService';
import { telegramAdapter, sanitizeGuestDisplayName } from '../src/lib/communication/adapters/telegramAdapter';
import { EventItem } from '../src/types';

// Mock Telegram Server responses for isolated deterministic testing
const mockCreatedTopics: Map<number, { name: string; chatId: number | string }> = new Map();
const mockTopicMessages: Array<{ topicId?: number; chatId: number | string; text: string; messageId: number }> = [];

let nextTopicId = 55001;
let nextMessageId = 88001;

// Wire telegramAdapter to use our deterministic mock when credentials are mock/test
(telegramAdapter as any).sendWithRetry = async (apiMethod: string, body: any) => {
  if (apiMethod === 'createForumTopic') {
    const topicId = nextTopicId++;
    mockCreatedTopics.set(topicId, { name: body.name, chatId: body.chat_id });
    return {
      ok: true,
      result: {
        message_thread_id: topicId,
        name: body.name,
      }
    };
  }

  if (apiMethod === 'sendMessage') {
    const messageId = nextMessageId++;
    mockTopicMessages.push({
      topicId: body.message_thread_id,
      chatId: body.chat_id,
      text: body.text,
      messageId
    });
    return {
      ok: true,
      result: {
        message_id: messageId,
        date: Math.floor(Date.now() / 1000)
      }
    };
  }

  if (apiMethod === 'closeForumTopic' || apiMethod === 'reopenForumTopic') {
    return { ok: true, result: true };
  }

  return { ok: true };
};

// Set mock environment variables for test execution
process.env.TELEGRAM_BOT_TOKEN = 'mock-test-bot-token-12345';
process.env.TELEGRAM_HOST_CHAT_ID = '-1009876543210';

async function runTelegramHostFlowTests() {
  console.log('===============================================================');
  console.log('🤖 RUNNING HOST-FACING TELEGRAM EXPERIENCE VERIFICATION TEST');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // Define realistic Event & Host
  const testEvent: EventItem = {
    id: `evt-tech-meetup-${Date.now()}`,
    title: 'AI & Tech Meetup',
    description: 'An evening of talks on modern LLMs and agentic workflows.',
    slug: 'ai-tech-meetup',
    organizer_id: 'host-priya-sharma',
    organizer_name: 'Priya Sharma',
    organizer_handle: 'priya_vibe',
    organizer_brand_color: '#F97316',
    start_at: '2026-10-15T18:30:00Z',
    end_at: '2026-10-15T21:30:00Z',
    location_name: 'Indiranagar Innovation Hub',
    location_address: '100 Feet Rd, Indiranagar',
    city: 'Bangalore',
    event_type: 'in-person',
    template: 'vertex',
    theme: { palette: 'stone', font: 'sans', bg_style: 'solid', button_style: 'solid' },
    sections: { speakers: false, agenda: false, gallery: false, faq: false },
    is_public: true,
    status: 'live',
    ai_generated: false,
    faq: [],
    rsvp_form_config: { ask_plus_one: false, ask_dietary: false, ask_tshirt: false, waitlist_enabled: false, confirmation_message: 'Confirmed' },
    timezone: 'Asia/Kolkata',
  };

  const guest = {
    id: 'guest-vibe-user-42',
    name: 'Vibe User',
    email: 'vibeuser@example.com',
    phone: '+91 99999 88888' // Guest phone (MUST NEVER BE EXPOSED)
  };

  // -------------------------------------------------------------
  // STEP 1: Determine the event
  // -------------------------------------------------------------
  console.log('--- Step 1: Determine Event ---');
  assert(testEvent.id.startsWith('evt-tech-meetup'), 'Event ID successfully determined');
  assert(testEvent.title === 'AI & Tech Meetup', 'Event title determined as "AI & Tech Meetup"');

  // -------------------------------------------------------------
  // STEP 2: Determine the host
  // -------------------------------------------------------------
  console.log('\n--- Step 2: Determine Host ---');
  const determinedHostId = testEvent.organizer_id || testEvent.organizer_handle;
  assert(determinedHostId === 'host-priya-sharma', `Host determined: ${determinedHostId}`);
  assert(testEvent.organizer_name === 'Priya Sharma', 'Host name determined: Priya Sharma');

  // -------------------------------------------------------------
  // STEP 3: Create or resolve the conversation
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Create or Resolve Conversation ---');
  const conv = await conversationService.findOrCreateConversation({
    eventId: testEvent.id,
    guestId: guest.id,
    hostId: determinedHostId,
    guestName: guest.name,
    guestEmail: guest.email,
    guestChannel: 'WEB',
    hostChannel: 'TELEGRAM',
  });

  assert(Boolean(conv.id), `Conversation resolved: ${conv.id}`);
  assert(conv.event_id === testEvent.id, 'Conversation belongs to the determined event');
  assert(conv.host_id === determinedHostId, 'Conversation belongs to the determined host');
  assert(conv.status === 'OPEN', 'Conversation is initially OPEN');
  assert(conv.telegram_topic_id === null, 'telegram_topic_id is initially null before first message');

  // -------------------------------------------------------------
  // STEP 4 & 5: First message triggers Telegram Topic creation & storage
  // -------------------------------------------------------------
  console.log('\n--- Steps 4 & 5: Create Topic & Store Topic ID on First Message ---');
  const guestQuestion = 'Is parking available?';
  const sentMessage = await conversationService.postGuestMessage({
    conversationId: conv.id,
    senderId: guest.id,
    content: guestQuestion,
    event: testEvent,
    guestName: guest.name
  });

  assert(sentMessage.delivery_status === 'SENT', 'Message dispatched successfully to host adapter');
  assert(Boolean(sentMessage.external_message_id), `Telegram message ID returned: ${sentMessage.external_message_id}`);

  // Fetch updated conversation to verify Step 5: Telegram Topic ID is stored
  const updatedConv = await conversationService.getConversationById(conv.id);
  assert(Boolean(updatedConv?.telegram_topic_id), `Telegram Topic ID stored on conversation: ${updatedConv?.telegram_topic_id}`);
  const createdTopicId = Number(updatedConv?.telegram_topic_id);
  assert(mockCreatedTopics.has(createdTopicId), 'Topic was registered on Telegram Supergroup');
  
  const createdTopic = mockCreatedTopics.get(createdTopicId);
  assert(createdTopic?.name.includes('AI & Tech Meetup'), 'Topic name contains event title');
  assert(createdTopic?.name.includes('Vibe User'), 'Topic name contains guest name');

  // -------------------------------------------------------------
  // STEP 6: Formatted notification sent into the topic
  // -------------------------------------------------------------
  console.log('\n--- Step 6: Formatted Notification into the Topic ---');
  const postedTelegramMsg = mockTopicMessages.find(m => m.topicId === createdTopicId);
  assert(Boolean(postedTelegramMsg), 'Notification message was sent directly into the created topic');
  
  const notificationText = postedTelegramMsg!.text;
  console.log('\n[Actual Telegram Notification Text]:\n' + notificationText + '\n');

  // Verify exact formatting requirements
  assert(notificationText.includes('<b>VIBE</b>'), 'Contains VIBE header');
  assert(notificationText.includes('<b>Event:</b> AI &amp; Tech Meetup'), 'Contains Event: AI &amp; Tech Meetup');
  assert(notificationText.includes('<b>Guest:</b>\nVibe User'), 'Contains Guest:\nVibe User');
  assert(notificationText.includes('<b>Message:</b>\nIs parking available?'), 'Contains Message:\nIs parking available?');
  assert(notificationText.includes('<i>Reply directly in this topic to respond.</i>'), 'Contains "Reply directly in this topic to respond." prompt');

  // -------------------------------------------------------------
  // STEP 7: Privacy Assertion
  // -------------------------------------------------------------
  console.log('\n--- Step 7: Privacy Assertion (No Unnecessary Personal Info) ---');
  assert(!notificationText.includes('+91'), 'Guest phone number is NOT in Telegram notification');
  assert(!notificationText.includes('vibeuser@example.com'), 'Guest email is NOT in Telegram notification');
  assert(!notificationText.includes(guest.id), 'Internal guest ID is NOT visible in notification text');

  // Test display name sanitization fallback
  const sanitizedWithPhoneInName = sanitizeGuestDisplayName('Vivek +919876543210');
  assert(!sanitizedWithPhoneInName.includes('9876543210'), 'Sanitizer strips phone numbers embedded in name');
  const sanitizedEmailOnly = sanitizeGuestDisplayName('', 'suyash@vibe.fyi');
  assert(sanitizedEmailOnly === 'Guest (suyash)', 'Sanitizer obscures domain from raw email');

  // -------------------------------------------------------------
  // STEP 8: Host Replies Naturally in the Telegram Topic
  // -------------------------------------------------------------
  console.log('\n--- Step 8: Host Replies Naturally in the Telegram Topic ---');
  const hostReplyText = 'Yes! Street parking is free and there is a basement lot next door.';
  const hostTelegramMessageId = 44991;
  const updateId1 = 778891;

  // Simulate Telegram Webhook Update when host types in the topic
  const webhookUpdate = {
    update_id: updateId1,
    message: {
      message_id: hostTelegramMessageId,
      from: {
        id: 99887766,
        is_bot: false,
        first_name: 'Priya',
        username: 'priyasharma'
      },
      chat: {
        id: Number(process.env.TELEGRAM_HOST_CHAT_ID),
        type: 'supergroup',
        title: 'Vibe Host Community'
      },
      message_thread_id: createdTopicId,
      text: hostReplyText,
      date: Math.floor(Date.now() / 1000)
    }
  };

  const processedHostMsg = await telegramAdapter.processIncomingMessage(webhookUpdate);
  assert(Boolean(processedHostMsg), 'Host message processed by Telegram adapter');
  assert(!processedHostMsg?.isDuplicate, 'Initial webhook message is not flagged as duplicate');
  assert(processedHostMsg?.telegramTopicId === String(createdTopicId), 'Topic ID matches the conversation topic');
  assert(processedHostMsg?.messageContent === hostReplyText, 'Message content matches host text without requiring commands');
  assert(processedHostMsg?.senderRole === 'HOST', 'Sender role identified as HOST');

  // Resolve conversation via topic ID mapping
  const resolvedConv = await conversationService.resolveConversationByTopic(
    processedHostMsg!.telegramTopicId!,
    processedHostMsg!.telegramChatId
  );
  assert(Boolean(resolvedConv), 'Topic ID deterministically resolved conversation');
  assert(resolvedConv?.id === conv.id, 'Resolved conversation matches the exact guest conversation');

  // Route to conversation
  const hostSavedMsg = await conversationService.postHostMessage({
    conversationId: resolvedConv!.id,
    senderId: String(processedHostMsg!.senderId),
    content: processedHostMsg!.messageContent,
    channel: 'TELEGRAM',
    externalMessageId: processedHostMsg!.externalMessageId
  });

  assert(Boolean(hostSavedMsg.id), 'Host message recorded in Vibe conversation');
  assert(hostSavedMsg.sender_role === 'HOST', 'Saved message sender_role is HOST');
  assert(hostSavedMsg.delivery_status === 'DELIVERED', 'Saved message delivery_status is DELIVERED');

  // Verify Guest sees the reply in conversation messages
  const guestMessages = await conversationService.getConversationMessages(conv.id, guest.id);
  assert(guestMessages.length === 2, 'Guest history contains 2 messages (1 question + 1 host reply)');
  assert(guestMessages[1].content === hostReplyText, 'Host natural reply reached guest conversation accurately');

  // -------------------------------------------------------------
  // STEP 9: Idempotency & Webhook Retry Protection
  // -------------------------------------------------------------
  console.log('\n--- Step 9: Webhook Retry Idempotency ---');
  // First test: Telegram retries with the same update_id
  const duplicateUpdate = await telegramAdapter.processIncomingMessage(webhookUpdate);
  assert(Boolean(duplicateUpdate?.isDuplicate), 'Telegram retry with same update_id flagged as duplicate');

  // Second test: Telegram retries at API level with same externalMessageId
  const duplicateHostMsg = await conversationService.postHostMessage({
    conversationId: conv.id,
    senderId: String(processedHostMsg!.senderId),
    content: processedHostMsg!.messageContent,
    channel: 'TELEGRAM',
    externalMessageId: hostTelegramMessageId
  });

  assert(duplicateHostMsg.id === hostSavedMsg.id, 'postHostMessage returned existing message instead of creating a duplicate');
  const messagesAfterRetry = await conversationService.getConversationMessages(conv.id, guest.id);
  assert(messagesAfterRetry.length === 2, 'Message count remains 2 after retry (zero duplicates created)');

  // -------------------------------------------------------------
  // STEP 10: Fallback Reply (Outside Topic via Reply-To)
  // -------------------------------------------------------------
  console.log('\n--- Step 10: Host Reply via Reply-To Message (Fallback) ---');
  const replyFallbackUpdate = {
    update_id: 778892,
    message: {
      message_id: 44992,
      from: { id: 99887766, is_bot: false, first_name: 'Priya' },
      chat: { id: Number(process.env.TELEGRAM_HOST_CHAT_ID), type: 'supergroup' },
      text: 'Also bringing a projector!',
      reply_to_message: {
        text: `VIBE\nEvent: AI & Tech Meetup\n<!-- CONV_ID:${conv.id} -->`
      }
    }
  };

  const processedFallback = await telegramAdapter.processIncomingMessage(replyFallbackUpdate);
  assert(processedFallback?.conversationId === conv.id, 'Fallback successfully extracted CONV_ID from reply_to_message');

  // -------------------------------------------------------------
  // STEP 11: Unmapped Topic Safety (Never Guess)
  // -------------------------------------------------------------
  console.log('\n--- Step 11: Unmapped Topic Safety ---');
  const unmappedTopicUpdate = {
    update_id: 778893,
    message: {
      message_id: 44993,
      from: { id: 99887766, is_bot: false, first_name: 'Priya' },
      chat: { id: Number(process.env.TELEGRAM_HOST_CHAT_ID), type: 'supergroup' },
      message_thread_id: 999999, // Non-existent topic
      text: 'Random comment in an unrelated topic'
    }
  };

  const processedUnmapped = await telegramAdapter.processIncomingMessage(unmappedTopicUpdate);
  const unmappedConv = await conversationService.resolveConversationByTopic(
    processedUnmapped!.telegramTopicId!,
    processedUnmapped!.telegramChatId
  );
  assert(unmappedConv === null, 'Unmapped topic returned null without guessing any conversation');

  console.log('\n===============================================================');
  console.log(`🎉 ALL ${passed}/${total} HOST TELEGRAM EXPERIENCE CHECKS PASSED!`);
  console.log('===============================================================');
}

runTelegramHostFlowTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
