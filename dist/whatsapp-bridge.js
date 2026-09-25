"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const qrcode_1 = __importDefault(require("qrcode"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const pino_1 = __importDefault(require("pino"));
// Auto-load environment variables from .env.local if present
function loadEnvLocal() {
    const envPath = path_1.default.resolve(process.cwd(), '.env.local');
    if (fs_1.default.existsSync(envPath)) {
        const lines = fs_1.default.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
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
function getWebhookUrl() {
    if (process.env.VIBE_WEBHOOK_URL) {
        return process.env.VIBE_WEBHOOK_URL;
    }
    const base = 'https://vibe-seven-pied.vercel.app';
    return `${base.replace(/\/$/, '')}/api/whatsapp/webhook`;
}
const VIBE_WEBHOOK_URL = getWebhookUrl();
const AUTH_DIR = path_1.default.resolve(process.cwd(), 'auth_info_baileys');
let sock = null;
let currentQrCode = null;
let connectionState = 'disconnected';
let connectedPhone = null;
// Track sent messages and their correlation to conversationId (in-memory cache)
const sentMessageMap = new Map();
async function startWhatsAppBridge() {
    if (!fs_1.default.existsSync(AUTH_DIR)) {
        fs_1.default.mkdirSync(AUTH_DIR, { recursive: true });
    }
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(AUTH_DIR);
    sock = (0, baileys_1.default)({
        auth: state,
        logger: (0, pino_1.default)({ level: 'silent' }),
        printQRInTerminal: false, // Handled manually with qrcodeTerminal
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            currentQrCode = qr;
            connectionState = 'connecting';
            console.log('\n=============================================================');
            console.log('📱 SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE:');
            console.log('   (WhatsApp → Settings → Linked Devices → Link a Device)');
            console.log('=============================================================\n');
            qrcode_terminal_1.default.generate(qr, { small: true });
            console.log(`\nOr view QR in your browser at: http://localhost:${PORT}/qr\n`);
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut;
            connectionState = 'disconnected';
            connectedPhone = null;
            console.log(`[WhatsApp Bridge] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                setTimeout(startWhatsAppBridge, 5000);
            }
            else {
                console.log('[WhatsApp Bridge] Device logged out. Deleting credentials and waiting for restart.');
                fs_1.default.rmSync(AUTH_DIR, { recursive: true, force: true });
                setTimeout(startWhatsAppBridge, 2000);
            }
        }
        else if (connection === 'open') {
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
        }
    });
    // Listen to incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log('[WhatsApp Bridge] messages.upsert:', {
            type,
            count: messages.length,
            remoteJid: messages[0]?.key?.remoteJid,
            fromMe: messages[0]?.key?.fromMe,
            text: (messages[0]?.message?.conversation || messages[0]?.message?.extendedTextMessage?.text || messages[0]?.message?.imageMessage?.caption || '').slice(0, 40),
        });
        for (const msg of messages) {
            if (!msg.message)
                continue;
            // Ignore messages generated by the bridge itself
            if (msg.key.id && sentMessageMap.has(msg.key.id))
                continue;
            const remoteJid = msg.key.remoteJid || '';
            // Ignore group chats (@g.us) and status broadcasts (@broadcast)
            if (remoteJid.endsWith('@g.us') || remoteJid.includes('@broadcast'))
                continue;
            const userJid = sock?.user?.id || '';
            const myPhone = userJid.split(':')[0] || userJid.split('@')[0];
            const isSelfChat = Boolean(myPhone && remoteJid.includes(myPhone)) || remoteJid === userJid;
            // If sent by me to another contact, ignore. But allow if it is a self-chat ("Message yourself")
            if (msg.key.fromMe && !isSelfChat)
                continue;
            // Unwrap all nested WhatsApp message envelopes (ephemeral, view-once, document-with-caption, interactive)
            let m = msg.message;
            if (m.ephemeralMessage?.message)
                m = m.ephemeralMessage.message;
            if (m.viewOnceMessage?.message)
                m = m.viewOnceMessage.message;
            if (m.viewOnceMessageV2?.message)
                m = m.viewOnceMessageV2.message;
            if (m.documentWithCaptionMessage?.message)
                m = m.documentWithCaptionMessage.message;
            if (m.templateMessage?.hydratedTemplate)
                m = m.templateMessage.hydratedTemplate;
            if (m.interactiveMessage?.body)
                m = { conversation: m.interactiveMessage.body.text };
            const messageContent = m.conversation ||
                m.extendedTextMessage?.text ||
                m.imageMessage?.caption ||
                m.documentMessage?.caption ||
                m.videoMessage?.caption ||
                '';
            const hasImage = Boolean(m.imageMessage ||
                (m.documentMessage && m.documentMessage.mimetype?.startsWith('image/')));
            if (!messageContent.trim() && !hasImage)
                continue;
            // Extract quoted message ID (e.g. if host swiped right on Vibe inquiry)
            const contextInfo = m.extendedTextMessage?.contextInfo ||
                m.imageMessage?.contextInfo ||
                m.documentMessage?.contextInfo;
            const quotedStanzaId = contextInfo?.stanzaId;
            let senderPhone = '';
            if (isSelfChat) {
                senderPhone = connectedPhone || '916264984285';
            }
            else if (remoteJid.includes('@s.whatsapp.net')) {
                senderPhone = remoteJid.replace('@s.whatsapp.net', '');
            }
            else if (msg.key.participant && msg.key.participant.includes('@s.whatsapp.net')) {
                senderPhone = msg.key.participant.replace('@s.whatsapp.net', '');
            }
            else {
                senderPhone = remoteJid.replace(/[^0-9]/g, '');
            }
            const senderName = msg.pushName || 'Host';
            // Check if we have this quoted message stored in memory
            let matchedConversationId = undefined;
            if (quotedStanzaId && sentMessageMap.has(quotedStanzaId)) {
                matchedConversationId = sentMessageMap.get(quotedStanzaId)?.conversationId;
            }
            // Check for attached poster / flyer image
            let imageBase64 = undefined;
            let imageMimeType = undefined;
            if (hasImage && sock) {
                try {
                    const buffer = await (0, baileys_1.downloadMediaMessage)(msg, 'buffer', {}, {
                        logger: (0, pino_1.default)({ level: 'silent' }),
                        reuploadRequest: sock.updateMediaMessage,
                    });
                    imageBase64 = buffer.toString('base64');
                    imageMimeType = m.imageMessage?.mimetype || m.documentMessage?.mimetype || 'image/jpeg';
                    console.log('[WhatsApp Bridge] Downloaded attached poster image:', {
                        mimeType: imageMimeType,
                        sizeBytes: buffer.length,
                    });
                }
                catch (mediaErr) {
                    console.warn('[WhatsApp Bridge] Failed to download image attachment:', mediaErr.message);
                }
            }
            console.log('[WhatsApp Bridge] Inbound message received:', {
                from: senderPhone,
                remoteJid,
                text: messageContent.slice(0, 40),
                hasImage: Boolean(imageBase64),
                quotedStanzaId,
                matchedConversationId,
            });
            // Forward to Vibe Webhook
            const webhookPayload = {
                messageId: msg.key.id,
                senderPhone,
                senderJid: remoteJid,
                senderName,
                text: messageContent.trim(),
                quotedMessageId: quotedStanzaId,
                conversationId: matchedConversationId,
                imageBase64,
                imageMimeType,
            };
            const candidateUrls = [
                VIBE_WEBHOOK_URL,
                'http://localhost:3000/api/whatsapp/webhook',
                'http://127.0.0.1:3000/api/whatsapp/webhook',
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
                    });
                    if (res.ok) {
                        const resData = await res.json().catch(() => ({}));
                        console.log(`[WhatsApp Bridge] Webhook forwarded successfully to ${targetUrl}:`, resData);
                        // Directly send confirmation / reply back to the WhatsApp user
                        const isApproved = resData.event?.status === 'live' || resData.event?.approval_status === 'approved';
                        const suretyPercent = resData.event?.confidence_score ? Math.round(resData.event.confidence_score * 100) : (isApproved ? 95 : 75);
                        const replyToSend = resData.replyText ||
                            (resData.event
                                ? isApproved
                                    ? `⚡ *YOUR FLASH VIBE IS AUTO-APPROVED & LIVE ON VIBE!* (${suretyPercent}% Surety)\n\n` +
                                        `🔥 *${resData.event.title || 'Your Event'}*\n\n` +
                                        `✅ *Auto-Approved:* Full event details verified\n\n` +
                                        `📱 *Open in Vibe Instant:*\nhttps://vibe-seven-pied.vercel.app/vibes?event=${resData.event.slug}\n\n` +
                                        `📲 _Forward this link to your squad — friends can swipe to your card and tap "I'm In" to join!_`
                                    : `⏳ *EVENT SUBMITTED FOR ADMIN APPROVAL* (${suretyPercent}% Surety)\n\n` +
                                        `🔥 *${resData.event.title || 'Your Event'}*\n\n` +
                                        `⚠️ *Aspects Not Given By User:* Venue place or time details were missing or estimated.\n\n` +
                                        `🛡️ _Because event surety is under 90%, our team has queued your event for quick admin verification before publishing live!_\n\n` +
                                        `🔗 *Review Draft Preview:*\nhttps://vibe-seven-pied.vercel.app/${resData.event.slug}`
                                : null);
                        if (replyToSend && sock) {
                            try {
                                const targetJid = remoteJid || (senderPhone ? `${senderPhone}@s.whatsapp.net` : '');
                                if (targetJid) {
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
                            }
                            catch (sendReplyErr) {
                                console.warn(`[WhatsApp Bridge] Could not send reply back to ${remoteJid}:`, sendReplyErr.message);
                            }
                        }
                        forwarded = true;
                        break;
                    }
                    else {
                        console.warn(`[WhatsApp Bridge] Webhook ${targetUrl} returned status ${res.status}`);
                    }
                }
                catch (err) {
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
const server = http_1.default.createServer(async (req, res) => {
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
            const qrDataUrl = await qrcode_1.default.toDataURL(currentQrCode);
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
        }
        catch (qrErr) {
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
                const sent = await sock.sendMessage(targetJid, { text });
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
                        if (firstKey)
                            sentMessageMap.delete(firstKey);
                    }
                }
                console.log('[WhatsApp Bridge] Outbound message sent:', {
                    to: cleanPhone,
                    messageId,
                    conversationId: metadata?.conversationId,
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, messageId }));
            }
            catch (err) {
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
