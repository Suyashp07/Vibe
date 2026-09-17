import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Setup environment for testing
process.env.WHATSAPP_BRIDGE_URL = 'http://127.0.0.1:3098';
process.env.WHATSAPP_BRIDGE_SECRET = 'vibe_wa_sec_test_token_123';
process.env.WHATSAPP_WEBHOOK_SECRET = 'vibe_wa_sec_test_token_123';
process.env.NEXT_PUBLIC_APP_URL = 'https://vibe-seven-pied.vercel.app';

console.log('===============================================================');
console.log('🚀 TESTING WHATSAPP EVENT CREATION PIPELINE');
console.log('===============================================================');

async function runWhatsAppEventCreationTests() {
  const TEST_PORT = 3098;
  const sentMessages: Array<{ to: string; text: string }> = [];

  // Mock Bridge Server to intercept replies
  const mockBridgeServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/send-message') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const parsed = JSON.parse(body);
        sentMessages.push(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, messageId: `msg-${Date.now()}` }));
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockBridgeServer.listen(TEST_PORT, '127.0.0.1', resolve));

  try {
    const { POST } = await import('../src/app/api/whatsapp/webhook/route');

    // -------------------------------------------------------------
    // TEST 1: Greeting & Help Command
    // -------------------------------------------------------------
    console.log('\n--- Test 1: User Sends "hi" or "/help" ---');
    sentMessages.length = 0;

    const reqHelp = new Request('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whatsapp-webhook-secret': 'vibe_wa_sec_test_token_123',
      },
      body: JSON.stringify({
        messageId: 'wa-help-1',
        senderPhone: '916264984285',
        senderName: 'Suyash',
        text: 'hi',
      }),
    });

    const resHelp = await POST(reqHelp as any);
    const jsonHelp = await resHelp.json();

    assert(jsonHelp.ok === true, 'Help endpoint returned ok');
    assert(jsonHelp.handledBy === 'welcome_prompt', 'Handled by welcome prompt');
    assert(sentMessages.length === 1, 'Sent welcome reply to user');
    assert(sentMessages[0].text.includes('Welcome to Vibe Event Creator'), 'Contains welcome guidance');
    assert(sentMessages[0].text.includes('Send a Poster'), 'Mentions poster submission');
    console.log('✅ [PASS] User greeting received helpful event creation instructions');

    // -------------------------------------------------------------
    // TEST 2: Event Creation via Text Blurb
    // -------------------------------------------------------------
    console.log('\n--- Test 2: User Sends Event Details Text Blurb ---');
    sentMessages.length = 0;

    const eventBlurb = 
      '🚀 AI Founders Meetup Mumbai!\n' +
      'Join us this Saturday at 6:30 PM at Subko Specialty Coffee Bandra West.\n' +
      'Typography, tech pitches, and filter coffee. Entry is free!\n' +
      'RSVP: https://vibe.fyi/mumbai-ai';

    const reqCreate = new Request('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whatsapp-webhook-secret': 'vibe_wa_sec_test_token_123',
      },
      body: JSON.stringify({
        messageId: 'wa-create-event-1',
        senderPhone: '916264984285',
        senderName: 'Suyash Pandey',
        text: eventBlurb,
      }),
    });

    const resCreate = await POST(reqCreate as any);
    const jsonCreate = await resCreate.json();

    console.log('[Webhook Response]:', jsonCreate);
    assert(jsonCreate.ok === true, 'Webhook returned ok');
    assert(jsonCreate.handledBy === 'event_creation', 'Handled by event_creation pipeline');
    assert(jsonCreate.event?.slug, 'Event slug generated');
    assert(jsonCreate.event?.url, 'Live event URL returned');

    // Verify confirmation message sent back to user's WhatsApp
    assert(sentMessages.length >= 2, 'Sent analysis progress + final live link message');
    const finalMsg = sentMessages[sentMessages.length - 1];
    assert(finalMsg.to === '916264984285', 'Sent to organizer phone number');
    assert(finalMsg.text.includes('YOUR EVENT IS LIVE ON VIBE!'), 'Contains live confirmation header');
    assert(finalMsg.text.includes(jsonCreate.event.url), 'Contains clickable live event URL');
    assert(finalMsg.text.includes('Subko'), 'Contains venue extracted by AI');
    console.log('✅ [PASS] Event successfully created from WhatsApp text blurb!');
    console.log('   Live URL sent to organizer:', jsonCreate.event.url);

    // -------------------------------------------------------------
    // TEST 3: Host ↔ Guest Quoted Reply Still Works (No Regression)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Verify Host ↔ Guest Quoted Reply Gateway is Unbroken ---');
    const { conversationService } = await import('../src/lib/communication/conversationService');

    const conv = await conversationService.findOrCreateConversation({
      eventId: 'evt-test-wa-creation',
      guestId: 'guest-test-123',
      hostId: 'host-wa',
      guestChannel: 'WEB',
      hostChannel: 'WHATSAPP',
    });

    // Guest sends message
    const guestMsg = await conversationService.postGuestMessage({
      conversationId: conv.id,
      senderId: 'guest-test-123',
      content: 'Where can I park?',
      event: { id: 'evt-test-wa-creation', title: 'Test Event' } as any,
    });

    // Host replies via WhatsApp quote
    const reqReply = new Request('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whatsapp-webhook-secret': 'vibe_wa_sec_test_token_123',
      },
      body: JSON.stringify({
        messageId: 'wa-reply-quote-1',
        senderPhone: '916264984285',
        senderName: 'Suyash',
        text: 'Parking is free at Gate 2',
        quotedMessageId: guestMsg.external_message_id || 'random-quoted-id',
        conversationId: conv.id,
      }),
    });

    const resReply = await POST(reqReply as any);
    const jsonReply = await resReply.json();

    assert(jsonReply.ok === true, 'Quote reply returned ok');
    assert(jsonReply.handledBy === 'communication_gateway', 'Correctly routed to communication gateway');
    console.log('✅ [PASS] Quoted replies to guests continue to work with zero interference');

    console.log('\n===============================================================');
    console.log('🎉 ALL WHATSAPP EVENT CREATION TESTS PASSED (100%)!');
    console.log('===============================================================');
  } finally {
    await new Promise<void>((resolve) => mockBridgeServer.close(() => resolve()));
  }
}

runWhatsAppEventCreationTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
