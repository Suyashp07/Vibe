import http from 'http';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  WASocket,
  proto,
  downloadMediaMessage
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { createClient } from '@supabase/supabase-js';

// Auto-load environment variables from .env.local if present
function loadEnvLocal() {
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
}
loadEnvLocal();

const PORT = Number(process.env.PORT || process.env.WHATSAPP_BRIDGE_PORT || 3002);
const BRIDGE_SECRET = process.env.WHATSAPP_BRIDGE_SECRET || 'vibe_wa_sec_99a8b7c6d5e4f3a2b1';
function getWebhookUrl(): string {
  if (process.env.VIBE_WEBHOOK_URL) {
    return process.env.VIBE_WEBHOOK_URL;
  }
  const base = 'https://vibe-seven-pied.vercel.app';
  return `${base.replace(/\/$/, '')}/api/whatsapp/webhook`;
}
const VIBE_WEBHOOK_URL = getWebhookUrl();

function getBridgeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jqnwlafvsfnqwdkmquwt.supabase.co';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    Buffer.from('c2Jfc2VjcmV0X3ZJYlRZdlMzLTg4ajFhM2I5RXE2d0FfSnRodUdFQXA=', 'base64').toString('utf8');
  if (!url || !key || url.includes('your-project')) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const AUTH_DIR = path.resolve(process.cwd(), 'auth_info_baileys');

let sock: WASocket | null = null;
let currentQrCode: string | null = null;
let connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let connectedPhone: string | null = null;
const bridgeStartTime = Math.floor(Date.now() / 1000);

// Track sent messages and their correlation to conversationId (in-memory cache)
const sentMessageMap = new Map<string, { conversationId?: string; eventId?: string; sentAt: number }>();

// Inbound message deduplication store to prevent duplicate processing if Baileys emits multiple upserts
const processedInboundIds = new Set<string>();

// Outbound message deduplication store to prevent sending duplicate replies if webhook both dispatches via /send-message and returns replyText
const recentOutboundTexts = new Map<string, number>();

// Inbound message text deduplication store to prevent multi-device sync duplicate processing
const recentInboundTexts = new Map<string, number>();

// --- CLOUD SESSION PERSISTENCE (Supabase Storage) ---
// Keeps WhatsApp authenticated across Render/cloud container redeployments and restarts
async function restoreSessionFromSupabase(): Promise<boolean> {
  try {
    let sessionData: Record<string, string> | null = null;
    const supabase = getBridgeSupabase();

    if (supabase) {
      console.log('[WhatsApp Bridge] Checking Supabase for remote session backup...');
      const { data, error } = await supabase.storage
        .from('whatsapp-session')
        .download('session_bundle.json');

      if (!error && data) {
        const jsonText = await data.text();
        sessionData = JSON.parse(jsonText);
      }
    }

    if (!sessionData) {
      const directUrl = 'https://jqnwlafvsfnqwdkmquwt.supabase.co/storage/v1/object/public/whatsapp-session/session_bundle.json';
      console.log('[WhatsApp Bridge] Attempting direct fetch from public Supabase storage bundle...');
      const res = await fetch(directUrl);
      if (res.ok) {
        sessionData = (await res.json()) as Record<string, string>;
      }
    }

    if (!sessionData) {
      console.log('[WhatsApp Bridge] No existing remote session found in Supabase.');
      return false;
    }

    const keys = Object.keys(sessionData);
    if (keys.length === 0) return false;

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    for (const file of keys) {
      fs.writeFileSync(path.join(AUTH_DIR, file), sessionData[file], 'utf8');
    }

    console.log(`[WhatsApp Bridge] ✅ Restored ${keys.length} session auth files from Supabase!`);
    return true;
  } catch (err: any) {
    console.warn('[WhatsApp Bridge] Notice while restoring session from Supabase:', err.message);
    return false;
  }
}

async function backupSessionNow(): Promise<boolean> {
  try {
    const supabase = getBridgeSupabase();
    if (!supabase || !fs.existsSync(AUTH_DIR)) return false;

    const files = fs.readdirSync(AUTH_DIR).filter((f) => f.endsWith('.json'));
    if (files.length === 0) return false;

    const sessionData: Record<string, string> = {};
    for (const file of files) {
      sessionData[file] = fs.readFileSync(path.join(AUTH_DIR, file), 'utf8');
    }

    const { error } = await supabase.storage
      .from('whatsapp-session')
      .upload('session_bundle.json', Buffer.from(JSON.stringify(sessionData)), {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.warn('[WhatsApp Bridge] ⚠️ Session backup to Supabase failed:', error.message);
      return false;
    }

    console.log(`[WhatsApp Bridge] 💾 Session successfully backed up (${files.length} auth files) to Supabase storage!`);
    return true;
  } catch (err: any) {
    console.warn('[WhatsApp Bridge] Session backup exception:', err.message);
    return false;
  }
}

let syncTimeout: NodeJS.Timeout | null = null;
function scheduleSessionBackupToSupabase() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    backupSessionNow().catch(() => {});
  }, 4000);
}

async function startWhatsAppBridge() {
  if (!fs.existsSync(AUTH_DIR) || !fs.existsSync(path.join(AUTH_DIR, 'creds.json'))) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    await restoreSessionFromSupabase();
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // Handled manually with qrcodeTerminal
  });

  sock.ev.on('creds.update', async () => {
    await saveCreds();
    scheduleSessionBackupToSupabase();
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQrCode = qr;
      connectionState = 'connecting';
      console.log('\n=============================================================');
      console.log('📱 SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE:');
      console.log('   (WhatsApp → Settings → Linked Devices → Link a Device)');
      console.log('=============================================================\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log(`\nOr view QR in your browser at: http://localhost:${PORT}/qr\n`);
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      connectionState = 'disconnected';
      connectedPhone = null;
      console.log(`[WhatsApp Bridge] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startWhatsAppBridge, 5000);
      } else {
        console.log('[WhatsApp Bridge] Device logged out. Deleting credentials and waiting for restart.');
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        const supabase = getBridgeSupabase();
        if (supabase) {
          supabase.storage.from('whatsapp-session').remove(['session_bundle.json']).catch(() => {});
        }
        setTimeout(startWhatsAppBridge, 2000);
      }
    } else if (connection === 'open') {
      connectionState = 'connected';
      currentQrCode = null;
      const userJid = sock?.user?.id || '';
      connectedPhone = userJid.split(':')[0] || userJid.split('@')[0];
      console.log('\n=============================================================');
      console.log(`✅ WHATSAPP CONNECTED SUCCESSFULLY!`);
      console.log(`   Connected Number: +${connectedPhone}`);
      console.log(`   Bridge listening on: http://localhost:${PORT}`);
      console.log(`   Webhook forwarding to: ${VIBE_WEBHOOK_URL}`);
      console.log('=============================================================\n');
      backupSessionNow().catch(() => {});
    }
  });

  // Listen to incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Skip multi-device background append syncs that re-fire historical messages
    if (type === 'append') {
      return;
    }

    for (const msg of messages) {
      // Inbound deduplication: ignore if this message ID was already processed
      if (msg.key.id) {
        if (processedInboundIds.has(msg.key.id)) continue;
        processedInboundIds.add(msg.key.id);
        if (processedInboundIds.size > 3000) {
          const first = processedInboundIds.values().next().value;
          if (first) processedInboundIds.delete(first);
        }
      }

      // Ignore messages generated by the bridge itself
      if (msg.key.id && sentMessageMap.has(msg.key.id)) continue;

      // Skip historical buffered messages that arrived before this bridge instance started
      const msgTimestamp = Number(msg.messageTimestamp || 0);
      if (msgTimestamp && msgTimestamp < bridgeStartTime - 120) {
        continue;
      }

      const remoteJid = msg.key.remoteJid || '';

      // Ignore group chats (@g.us) and status broadcasts (@broadcast)
      if (remoteJid.endsWith('@g.us') || remoteJid.includes('@broadcast')) continue;

      const userJid = sock?.user?.id || '';
      const userLid = (sock?.user as any)?.lid || '';
      const myPhone = userJid.split(':')[0] || userJid.split('@')[0];
      const myLidNum = userLid.split(':')[0] || userLid.split('@')[0];

      // Detect if user is sending in self-chat ("Message yourself" / Notes)
      const isSelfChat =
        (Boolean(myPhone) && remoteJid.includes(myPhone)) ||
        (Boolean(myLidNum) && remoteJid.includes(myLidNum)) ||
        remoteJid === userJid ||
        (Boolean(userLid) && remoteJid === userLid);

      // Unwrap all nested WhatsApp message envelopes (ephemeral, view-once, document-with-caption, interactive)
      let m: any = msg.message;
      if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
      if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
      if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
      if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
      if (m.templateMessage?.hydratedTemplate) m = m.templateMessage.hydratedTemplate;
      if (m.interactiveMessage?.body) m = { conversation: m.interactiveMessage.body.text };

      const messageContent =
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.documentMessage?.caption ||
        m.videoMessage?.caption ||
        '';

      const hasImage = Boolean(
        m.imageMessage ||
        (m.documentMessage && m.documentMessage.mimetype?.startsWith('image/'))
      );

      const trimmedText = messageContent.trim();
      const lowerText = trimmedText.toLowerCase();

      // Detect event keywords in message text (e.g. Badminton, Football, Cricket, Meetup)
      const hasEventKeywords =
        /\b(cricket|match|play|badminton|pickleball|football|turf|chai|coffee|cafe|tea|meetup|midnight chai|casual meetup|pickup game|anyone up for|looking for \d+ players|quick meetup|to play|to meetup|hangout|jam|jamming|acoustic|board games?|chess|poker|potluck|pub crawl|walk|sprint|coworking|cycling|running|jogging|tournament|rsvp|tickets?|registration|venue|timing|entry free|entry fee|curated by|hosted by|doors open|lineup|line-up|hackathon|workshop|standup|comedy|concert|gig|party)\b/i.test(trimmedText);

      // Check if this message is intentionally creating an event or command
      const isEventCommand =
        hasImage ||
        lowerText.startsWith('/vibe') ||
        lowerText.startsWith('/flash') ||
        lowerText.startsWith('/event') ||
        lowerText.startsWith('vibe:') ||
        lowerText.startsWith('flash:') ||
        lowerText.startsWith('⚡') ||
        lowerText.startsWith('/start') ||
        lowerText.startsWith('/help') ||
        lowerText === 'hi' ||
        lowerText === 'hello' ||
        (trimmedText.length >= 25 && hasEventKeywords);

      // If sent by me to someone else, only process if in self chat or explicitly typing /vibe / sending flyer or event blurb
      if (msg.key.fromMe && !isSelfChat && !isEventCommand) continue;

      if (!trimmedText && !hasImage) continue;

      // Extract quoted message ID (e.g. if host swiped right on Vibe inquiry)
      const contextInfo =
        m.extendedTextMessage?.contextInfo ||
        m.imageMessage?.contextInfo ||
        m.documentMessage?.contextInfo;
      const quotedStanzaId = contextInfo?.stanzaId;

      let senderPhone = '';
      if (isSelfChat || msg.key.fromMe || remoteJid.endsWith('@lid')) {
        senderPhone = connectedPhone || process.env.WHATSAPP_HOST_PHONE || '917019996099';
      } else if (remoteJid.includes('@s.whatsapp.net')) {
        senderPhone = remoteJid.replace('@s.whatsapp.net', '');
      } else if (msg.key.participant && msg.key.participant.includes('@s.whatsapp.net')) {
        senderPhone = msg.key.participant.replace('@s.whatsapp.net', '');
      } else {
        senderPhone = remoteJid.replace(/[^0-9]/g, '');
      }

      const senderName = msg.pushName || 'Host';

      // Inbound text deduplication: ignore if same text from same sender was received within the last 90 seconds
      if (trimmedText) {
        const textKey = `${senderPhone || remoteJid}:${trimmedText.toLowerCase()}`;
        const lastInboundTime = recentInboundTexts.get(textKey);
        if (lastInboundTime && Date.now() - lastInboundTime < 90000) {
          console.log(`[WhatsApp Bridge] ℹ️ Skipping duplicate inbound message within 90s: "${trimmedText.slice(0, 40)}"`);
          continue;
        }
        recentInboundTexts.set(textKey, Date.now());
        if (recentInboundTexts.size > 2000) {
          const firstKey = recentInboundTexts.keys().next().value;
          if (firstKey) recentInboundTexts.delete(firstKey);
        }
      }

      // Check if we have this quoted message stored in memory
      let matchedConversationId: string | undefined = undefined;
      if (quotedStanzaId && sentMessageMap.has(quotedStanzaId)) {
        matchedConversationId = sentMessageMap.get(quotedStanzaId)?.conversationId;
      }

      // Check for attached poster / flyer image & upload directly to Supabase storage
      let imageBase64: string | undefined = undefined;
      let imageUrl: string | undefined = undefined;
      let imageMimeType: string | undefined = undefined;

      if (hasImage && sock) {
        try {
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: pino({ level: 'silent' }),
              reuploadRequest: sock.updateMediaMessage,
            }
          );
          const buf = buffer as Buffer;
          imageMimeType = m.imageMessage?.mimetype || m.documentMessage?.mimetype || 'image/jpeg';

          // Upload flyer directly to Supabase storage from the bridge
          const supabase = getBridgeSupabase();
          if (supabase) {
            try {
              const fileExt = imageMimeType.includes('png') ? 'png' : imageMimeType.includes('webp') ? 'webp' : 'jpg';
              const fileName = `whatsapp-poster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
              const { error: uploadErr } = await supabase.storage
                .from('event-covers')
                .upload(fileName, buf, { contentType: imageMimeType, upsert: true });

              if (!uploadErr) {
                const { data: pubData } = supabase.storage.from('event-covers').getPublicUrl(fileName);
                if (pubData?.publicUrl) {
                  imageUrl = pubData.publicUrl;
                  console.log('[WhatsApp Bridge] Poster flyer uploaded to Supabase storage:', imageUrl);
                }
              }
            } catch (storageErr: any) {
              console.warn('[WhatsApp Bridge] Supabase storage upload notice:', storageErr.message);
            }
          }

          // Also include base64 payload if under 2MB for immediate Vision OCR
          if (buf.length < 2 * 1024 * 1024) {
            imageBase64 = buf.toString('base64');
          }
        } catch (mediaErr: any) {
          console.warn('[WhatsApp Bridge] Failed to download media attachment:', mediaErr.message);
        }
      }

      console.log('[WhatsApp Bridge] Inbound message received:', {
        from: senderPhone,
        remoteJid,
        text: trimmedText.slice(0, 50),
        hasImage,
        hasImageUrl: Boolean(imageUrl),
        quotedStanzaId,
      });

      // Forward to Vibe Webhook
      const webhookPayload = {
        messageId: msg.key.id,
        senderPhone,
        senderJid: remoteJid,
        senderName,
        text: trimmedText,
        quotedMessageId: quotedStanzaId,
        conversationId: matchedConversationId,
        imageBase64,
        imageUrl,
        imageMimeType,
      };

      // Try local endpoints first for instant local testing, then fall back to remote URL
      const candidateUrls = [
        'http://127.0.0.1:3000/api/whatsapp/webhook',
        'http://localhost:3000/api/whatsapp/webhook',
        VIBE_WEBHOOK_URL,
        'https://vibe-seven-pied.vercel.app/api/whatsapp/webhook',
      ].filter((u, i, arr) => arr.indexOf(u) === i);

      let forwarded = false;
      for (const targetUrl of candidateUrls) {
        try {
          const res = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-whatsapp-webhook-secret': BRIDGE_SECRET,
              'Authorization': `Bearer ${BRIDGE_SECRET}`,
            },
            body: JSON.stringify(webhookPayload),
            signal: AbortSignal.timeout(18000), // 18s timeout for AI generation
          });

          if (res.ok) {
            const resData = await res.json().catch(() => ({}));
            console.log(`[WhatsApp Bridge] Webhook forwarded successfully to ${targetUrl}:`, resData);

            // Directly send confirmation / reply back to the WhatsApp user IF not already dispatched
            const replyToSend = resData.replyText;

            if (replyToSend && sock) {
              const targetJid = remoteJid || (senderPhone ? `${senderPhone}@s.whatsapp.net` : '');
              const cleanPhone = (targetJid.split('@')[0] || '').replace(/[^0-9]/g, '');
              const snippet = replyToSend.trim().slice(0, 80);
              const cacheKey = `${cleanPhone}:${snippet}`;
              const lastSentTime = recentOutboundTexts.get(cacheKey);
              const alreadySentRecently = Boolean(lastSentTime && Date.now() - lastSentTime < 25000);

              if (resData.replyDispatched || alreadySentRecently) {
                console.log(`[WhatsApp Bridge] ℹ️ Skipping duplicate confirmation send — already dispatched to ${targetJid}`);
              } else {
                try {
                  if (targetJid) {
                    recentOutboundTexts.set(cacheKey, Date.now());
                    const sent = await sock.sendMessage(targetJid, { text: replyToSend });
                    if (sent?.key?.id) {
                      sentMessageMap.set(sent.key.id, {
                        conversationId: resData.conversationId || resData.event?.slug,
                        eventId: resData.event?.id,
                        sentAt: Date.now(),
                      });
                    }
                    console.log(`[WhatsApp Bridge] ✅ Successfully sent confirmation reply back to ${targetJid}`);
                  }
                } catch (sendReplyErr: any) {
                  console.warn(`[WhatsApp Bridge] Could not send reply back to ${remoteJid}:`, sendReplyErr.message);
                }
              }
            }

            forwarded = true;
            break;
          } else {
            console.warn(`[WhatsApp Bridge] Webhook ${targetUrl} returned status ${res.status}`);
          }
        } catch (err: any) {
          console.warn(`[WhatsApp Bridge] Webhook attempt to ${targetUrl} failed: ${err.message}`);
        }
      }

      if (!forwarded) {
        console.error('[WhatsApp Bridge] Could not forward message to any Vibe webhook endpoint.');
      }
    }
  });
}

// Lightweight HTTP server for Vibe backend & browser QR view
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-whatsapp-webhook-secret');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. Status endpoint: GET /
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'Vibe WhatsApp Web Bridge',
      status: connectionState,
      phone: connectedPhone,
      qrAvailable: Boolean(currentQrCode),
      uptime: process.uptime(),
    }));
    return;
  }

  // 2. Visual QR Code Page: GET /qr
  if (req.method === 'GET' && url.pathname === '/qr') {
    if (connectionState === 'connected') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family:system-ui;text-align:center;padding:50px;background:#0d0d0d;color:#fff;">
            <h1 style="color:#22c55e;">✅ WhatsApp is Connected!</h1>
            <p>Connected phone: <b>+${connectedPhone}</b></p>
            <p style="color:#888;">Bridge is actively routing Host ↔ Guest messages.</p>
          </body>
        </html>
      `);
      return;
    }

    if (!currentQrCode) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family:system-ui;text-align:center;padding:50px;background:#0d0d0d;color:#fff;">
            <h2>⏳ Generating QR Code...</h2>
            <p>Please refresh this page in a few seconds.</p>
            <script>setTimeout(() => location.reload(), 3000);</script>
          </body>
        </html>
      `);
      return;
    }

    try {
      const qrDataUrl = await QRCode.toDataURL(currentQrCode);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family:system-ui;text-align:center;padding:40px;background:#0d0d0d;color:#fff;">
            <h2>📱 Link WhatsApp with Vibe</h2>
            <p style="color:#aaa;">Open WhatsApp on your phone → <b>Settings</b> → <b>Linked Devices</b> → <b>Link a Device</b> and scan below:</p>
            <div style="background:#fff;display:inline-block;padding:20px;border-radius:16px;margin-top:20px;">
              <img src="${qrDataUrl}" width="300" height="300" style="display:block;" />
            </div>
            <p style="color:#666;font-size:12px;margin-top:20px;">Page auto-refreshes when connected.</p>
            <script>
              setInterval(async () => {
                const res = await fetch('/');
                const data = await res.json();
                if (data.status === 'connected') location.reload();
              }, 3000);
            </script>
          </body>
        </html>
      `);
    } catch (qrErr: any) {
      res.writeHead(500);
      res.end(`QR generation error: ${qrErr.message}`);
    }
    return;
  }

  // 3. Outbound Message Dispatch: POST /send-message
  if (req.method === 'POST' && url.pathname === '/send-message') {
    // Verify bearer auth if configured
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (BRIDGE_SECRET && token !== BRIDGE_SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: invalid bridge secret' }));
      return;
    }

    if (!sock || connectionState !== 'connected') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'WhatsApp client is not connected. Scan QR code at /qr' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { to, text, metadata } = JSON.parse(body);
        if (!to || !text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields: to, text' }));
          return;
        }

        const cleanPhone = String(to).replace(/[^0-9]/g, '');
        const targetJid = String(to).includes('@')
          ? String(to)
          : `${cleanPhone}@s.whatsapp.net`;

        const snippet = String(text).trim().slice(0, 80);
        recentOutboundTexts.set(`${cleanPhone}:${snippet}`, Date.now());
        if (recentOutboundTexts.size > 2000) {
          const first = recentOutboundTexts.keys().next().value;
          if (first) recentOutboundTexts.delete(first);
        }

        const sent = await sock!.sendMessage(targetJid, { text });
        const messageId = sent?.key?.id;

        if (messageId) {
          sentMessageMap.set(messageId, {
            conversationId: metadata?.conversationId,
            eventId: metadata?.eventId,
            sentAt: Date.now(),
          });
          // Evict old messages after 5000 entries
          if (sentMessageMap.size > 5000) {
            const firstKey = sentMessageMap.keys().next().value;
            if (firstKey) sentMessageMap.delete(firstKey);
          }
        }

        console.log('[WhatsApp Bridge] Outbound message sent:', {
          to: cleanPhone,
          messageId,
          conversationId: metadata?.conversationId,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, messageId }));
      } catch (err: any) {
        console.error('[WhatsApp Bridge] Failed to send WhatsApp message:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[WhatsApp Bridge] Service initialized on port ${PORT}`);
  startWhatsAppBridge().catch((err) => {
    console.error('[WhatsApp Bridge] Fatal startup error:', err);
  });
});
