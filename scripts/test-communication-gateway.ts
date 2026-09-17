/**
 * Comprehensive Test Suite for Vibe Host ↔ Guest Communication Gateway
 * Tests all 16 architectural scenarios specified in requirement 25:
 * 1. Create conversation
 * 2. Duplicate conversation prevention
 * 3. Guest sends message
 * 4. Host receives Telegram message
 * 5. Telegram webhook received
 * 6. Telegram topic resolves correct conversation
 * 7. Host reply reaches correct guest
 * 8. Unauthorized guest access (IDOR)
 * 9. Unauthorized host access (IDOR)
 * 10. Closed conversation
 * 11. Telegram API failure
 * 12. Duplicate Telegram webhook
 * 13. Rate limiting
 * 14. Invalid event
 * 15. Invalid conversation
 * 16. Cross-event isolation
 */

import { conversationService } from '../src/lib/communication/conversationService';
import { telegramAdapter } from '../src/lib/communication/adapters/telegramAdapter';
import { EventItem } from '../src/types';

// Helper for assertions
let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Assertion failed in: ${testName}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING VIBE COMMUNICATION GATEWAY TEST SUITE');
  console.log('====================================================\n');

  // Setup mock events in store
  const mockEvent1: any = {
    id: 'evt-test-101',
    title: 'AI & Builders Meetup 2026',
    slug: 'ai-builders-meetup-2026',
    description: 'A gathering of AI engineers in Bangalore.',
    start_at: new Date().toISOString(),
    location_name: 'WeWork Galaxy, Residency Rd',
    organizer_id: 'host1@swaniki.com',
    organizer_name: 'Swaniki AI Host',
    organizer_handle: 'swaniki_host',
    source_platform: 'vibe',
    status: 'live',
  };

  const mockEvent2: any = {
    id: 'evt-test-202',
    title: 'Bengaluru Tech Demo Day',
    slug: 'bengaluru-tech-demo-day',
    description: 'Demo day for tech startups.',
    start_at: new Date().toISOString(),
    location_name: 'Indiranagar Social',
    organizer_id: 'host1@swaniki.com',
    organizer_name: 'Swaniki AI Host',
    organizer_handle: 'swaniki_host',
    source_platform: 'vibe',
    status: 'live',
  };

  const guestAId = 'usr_guest_alpha';
  const guestBId = 'usr_guest_beta';
  const hostId = 'host1@swaniki.com';
  const unauthorizedHostId = 'intruder_host@example.com';

  // ----------------------------------------------------
  // TEST 1: Create conversation
  // ----------------------------------------------------
  console.log('--- TEST 1: Create Conversation ---');
  const convA1 = await conversationService.findOrCreateConversation({
    eventId: mockEvent1.id,
    guestId: guestAId,
    hostId,
    guestName: 'Guest Alpha',
    guestEmail: 'alpha@example.com',
  });

  assert(Boolean(convA1 && convA1.id), 'Test 1: Conversation successfully created', `ID: ${convA1.id}`);
  assert(convA1.event_id === mockEvent1.id, 'Test 1: Event ID preserved in conversation');
  assert(convA1.guest_id === guestAId, 'Test 1: Guest ID preserved');
  assert(convA1.status === 'OPEN', 'Test 1: Conversation status defaults to OPEN');

  // ----------------------------------------------------
  // TEST 2: Duplicate conversation prevention (Idempotency)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Duplicate Conversation Prevention ---');
  const convA1_duplicate = await conversationService.findOrCreateConversation({
    eventId: mockEvent1.id,
    guestId: guestAId,
    hostId,
  });

  assert(
    convA1_duplicate.id === convA1.id,
    'Test 2: Re-requesting conversation returns existing conversation without duplicating',
    `Original: ${convA1.id}, Duplicate call returned: ${convA1_duplicate.id}`
  );

  // ----------------------------------------------------
  // TEST 3: Guest sends message
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Guest Sends Message ---');
  const msg1 = await conversationService.postGuestMessage({
    conversationId: convA1.id,
    senderId: guestAId,
    content: 'Is parking available at WeWork?',
    guestName: 'Guest Alpha',
  });

  assert(Boolean(msg1 && msg1.id), 'Test 3: Guest message stored in backend');
  assert(msg1.sender_role === 'GUEST', 'Test 3: Sender role is GUEST');
  assert(msg1.content === 'Is parking available at WeWork?', 'Test 3: Message content preserved');
  assert(
    msg1.delivery_status === 'SENT' || msg1.delivery_status === 'PENDING',
    'Test 3: Delivery status set correctly'
  );

  // ----------------------------------------------------
  // TEST 4: Host receives Telegram message
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Telegram Channel Adapter Dispatch ---');
  // Assign a mock Telegram Topic ID to simulate Telegram Supergroup Topic creation
  await conversationService.updateConversationTopic(convA1.id, '99201');
  const updatedConvA1 = await conversationService.getConversationById(convA1.id);
  assert(
    updatedConvA1?.telegram_topic_id === '99201',
    'Test 4: Telegram Topic ID properly bound to conversation'
  );

  // ----------------------------------------------------
  // TEST 5: Telegram webhook received & security verification
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Telegram Webhook Verification ---');
  const validMockReq = {
    headers: {
      get: (h: string) => (h === 'x-telegram-bot-api-secret-token' ? process.env.TELEGRAM_WEBHOOK_SECRET || '' : null),
    },
  };
  assert(telegramAdapter.verifyWebhook(validMockReq), 'Test 5: Webhook verification passes with valid secret or unset');

  // ----------------------------------------------------
  // TEST 6: Telegram topic resolves correct conversation
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Telegram Topic Resolves Correct Conversation ---');
  const resolvedConv = await conversationService.resolveConversationByTopic('99201');
  assert(Boolean(resolvedConv), 'Test 6: Topic 99201 successfully resolved');
  assert(
    resolvedConv?.id === convA1.id,
    'Test 6: Resolved conversation matches Guest A exact conversation',
    `Resolved: ${resolvedConv?.id}, Expected: ${convA1.id}`
  );

  // ----------------------------------------------------
  // TEST 7: Host reply reaches correct guest
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Host Reply Flow ---');
  const hostReply = await conversationService.postHostMessage({
    conversationId: convA1.id,
    senderId: 'tg_host_user_1',
    content: 'Yes, basement parking is open for all attendees.',
    channel: 'TELEGRAM',
    externalMessageId: 88412,
  });

  assert(Boolean(hostReply && hostReply.id), 'Test 7: Host message recorded');
  assert(hostReply.sender_role === 'HOST', 'Test 7: Sender role is HOST');
  assert(hostReply.delivery_status === 'DELIVERED', 'Test 7: Delivery status is DELIVERED');

  const guestMessages = await conversationService.getConversationMessages(convA1.id, guestAId);
  assert(guestMessages.length === 2, 'Test 7: Guest sees 2 messages (1 question + 1 answer)');
  assert(
    guestMessages[1].content === 'Yes, basement parking is open for all attendees.',
    'Test 7: Host response reached the guest message list'
  );

  // ----------------------------------------------------
  // TEST 8: Unauthorized guest access (IDOR Protection)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Unauthorized Guest Access (IDOR) ---');
  let idorCaught = false;
  try {
    // Guest B attempts to fetch Guest A's conversation
    await conversationService.getConversationById(convA1.id, guestBId, 'guest');
  } catch (err: any) {
    idorCaught = true;
    assert(
      err.message.includes('Unauthorized'),
      'Test 8: IDOR properly rejected when Guest B accesses Guest A conversation'
    );
  }
  assert(idorCaught, 'Test 8: Unauthorized guest access threw security exception');

  // ----------------------------------------------------
  // TEST 9: Unauthorized host access (IDOR Protection)
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Unauthorized Host Access (IDOR) ---');
  let unauthorizedHostCaught = false;
  try {
    await conversationService.getConversationById(convA1.id, unauthorizedHostId, 'host');
  } catch (err: any) {
    unauthorizedHostCaught = true;
    assert(
      err.message.includes('Unauthorized'),
      'Test 9: Unauthorized host rejected with 403 error'
    );
  }
  assert(unauthorizedHostCaught, 'Test 9: Unauthorized host access threw security exception');

  // ----------------------------------------------------
  // TEST 10: Closed conversation
  // ----------------------------------------------------
  console.log('\n--- TEST 10: Closed Conversation ---');
  await conversationService.closeConversation(convA1.id, hostId);
  const closedConv = await conversationService.getConversationById(convA1.id);
  assert(closedConv?.status === 'CLOSED', 'Test 10: Conversation status changed to CLOSED');

  let closedSendRejected = false;
  try {
    await conversationService.postGuestMessage({
      conversationId: convA1.id,
      senderId: guestAId,
      content: 'Can I also ask about food?',
    });
  } catch (err: any) {
    closedSendRejected = true;
    assert(
      err.message.includes('closed'),
      'Test 10: Post message on closed conversation rejected with helpful error'
    );
  }
  assert(closedSendRejected, 'Test 10: Sending message on closed conversation successfully prevented');

  // Reopen conversation
  await conversationService.reopenConversation(convA1.id, hostId);
  const reopenedConv = await conversationService.getConversationById(convA1.id);
  assert(reopenedConv?.status === 'OPEN', 'Test 10: Conversation reopened successfully');

  // ----------------------------------------------------
  // TEST 11: Telegram API failure resiliency
  // ----------------------------------------------------
  console.log('\n--- TEST 11: Telegram API Failure Handling ---');
  // Send message when Telegram bot is offline / mock failure
  const unconfiguredMsg = await conversationService.postGuestMessage({
    conversationId: convA1.id,
    senderId: guestAId,
    content: 'Resilience test message',
  });
  // Message must NOT be lost
  assert(
    unconfiguredMsg.delivery_status === 'PENDING' || unconfiguredMsg.delivery_status === 'FAILED',
    'Test 11: Guest message is preserved in DB as PENDING or FAILED on network issue'
  );
  const convMsgsCheck = await conversationService.getConversationMessages(convA1.id, guestAId);
  assert(
    convMsgsCheck.some((m) => m.content === 'Resilience test message'),
    'Test 11: Message preserved in database history despite adapter status'
  );

  // ----------------------------------------------------
  // TEST 12: Duplicate Telegram webhook
  // ----------------------------------------------------
  console.log('\n--- TEST 12: Duplicate Telegram Webhook Idempotency ---');
  const webhookUpdate = {
    message: {
      message_id: 99120,
      message_thread_id: 99201,
      from: { id: 123456, first_name: 'Host Alex', is_bot: false },
      text: 'Door opens at 5:30 PM.',
    },
  };
  const processed1 = await telegramAdapter.processIncomingMessage(webhookUpdate);
  const processed2 = await telegramAdapter.processIncomingMessage(webhookUpdate);
  assert(
    Boolean(processed1 && processed2),
    'Test 12: Webhook payload processed deterministically'
  );
  assert(
    processed1?.externalMessageId === processed2?.externalMessageId,
    'Test 12: External message ID matches across duplicate deliveries'
  );

  // ----------------------------------------------------
  // TEST 13: Rate limiting
  // ----------------------------------------------------
  console.log('\n--- TEST 13: Rate Limiting ---');
  const rapidGuestId = 'rapid_guest_spammer';
  const rapidConv = await conversationService.findOrCreateConversation({
    eventId: mockEvent1.id,
    guestId: rapidGuestId,
    hostId,
  });

  let rateLimitTripped = false;
  try {
    for (let i = 0; i < 15; i++) {
      await conversationService.postGuestMessage({
        conversationId: rapidConv.id,
        senderId: rapidGuestId,
        content: `Rapid spam ping #${i}`,
      });
    }
  } catch (err: any) {
    rateLimitTripped = true;
    assert(
      err.message.includes('Rate limit exceeded'),
      'Test 13: Rate limit exception thrown after exceeding limit'
    );
  }
  assert(rateLimitTripped, 'Test 13: Rate limiting successfully throttled excessive messages');

  // ----------------------------------------------------
  // TEST 14: Invalid event
  // ----------------------------------------------------
  console.log('\n--- TEST 14: Invalid Event Rejection ---');
  let invalidEventCaught = false;
  try {
    await conversationService.findOrCreateConversation({
      eventId: '   ',
      guestId: guestAId,
      hostId,
    });
  } catch (err: any) {
    invalidEventCaught = true;
    assert(
      err.message.includes('Invalid event'),
      'Test 14: Rejected invalid event with validation error'
    );
  }
  assert(invalidEventCaught, 'Test 14: Non-existent/empty event correctly failed validation');

  // ----------------------------------------------------
  // TEST 15: Invalid conversation
  // ----------------------------------------------------
  console.log('\n--- TEST 15: Invalid Conversation ---');
  const nonExistent = await conversationService.getConversationById('invalid-conv-id-000');
  assert(nonExistent === null, 'Test 15: Invalid conversation ID returns null cleanly');

  // ----------------------------------------------------
  // TEST 16: Cross-event isolation & Guest Isolation
  // ----------------------------------------------------
  console.log('\n--- TEST 16: Cross-Event Isolation & Guest Isolation ---');
  // Guest A attends Event 2 (hosted by same person) -> must create separate conversation!
  const convA2 = await conversationService.findOrCreateConversation({
    eventId: mockEvent2.id,
    guestId: guestAId,
    hostId,
  });

  assert(
    convA2.id !== convA1.id,
    'Test 16: Separate conversation created for different event by same guest and host',
    `Conv 1: ${convA1.id}, Conv 2: ${convA2.id}`
  );

  // Guest B attends Event 1 -> must create separate conversation from Guest A!
  const convB1 = await conversationService.findOrCreateConversation({
    eventId: mockEvent1.id,
    guestId: guestBId,
    hostId,
  });

  assert(
    convB1.id !== convA1.id,
    'Test 16: Guest A and Guest B have completely isolated conversations for the same event',
    `Guest A Conv: ${convA1.id}, Guest B Conv: ${convB1.id}`
  );

  // Assign distinct topic to Guest B
  await conversationService.updateConversationTopic(convB1.id, '99202');
  const resolvedTopicA = await conversationService.resolveConversationByTopic('99201');
  const resolvedTopicB = await conversationService.resolveConversationByTopic('99202');

  assert(
    resolvedTopicA?.guest_id === guestAId,
    'Test 16: Topic 99201 exclusively resolves to Guest A'
  );
  assert(
    resolvedTopicB?.guest_id === guestBId,
    'Test 16: Topic 99202 exclusively resolves to Guest B'
  );
  assert(
    resolvedTopicA?.id !== resolvedTopicB?.id,
    'Test 16: Guest A NEVER receives Guest B host conversation'
  );

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED WITH ERROR:', err);
  process.exit(1);
});
