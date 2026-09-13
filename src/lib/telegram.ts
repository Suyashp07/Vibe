/**
 * Telegram Bot Helper Library for Vibe Ingestion Pipeline
 */

export function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }
  return token;
}

export async function isAuthorizedCurator(senderId: string | number): Promise<boolean> {
  const idStr = String(senderId).trim();
  const idNum = parseInt(idStr, 10);

  // 1. Check environment variable whitelist first (zero latency)
  const envAllowed = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (envAllowed) {
    const allowedList = envAllowed
      .replace(/['"\r\n]/g, '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (allowedList.includes(idStr)) return true;
  }

  // 2. Check dynamic telegram_curators table in Supabase
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key && !isNaN(idNum)) {
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await client
        .from('telegram_curators')
        .select('id')
        .eq('telegram_user_id', idNum)
        .eq('is_active', true)
        .maybeSingle();
      if (data) return true;
    }
  } catch (err) {
    console.warn('[Telegram] Dynamic curator check warning:', err);
  }

  // Fallback if no admin ID is configured
  if (!envAllowed) {
    console.warn('[Telegram] TELEGRAM_ADMIN_CHAT_ID not configured! All senders accepted.');
    return true;
  }

  return false;
}

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Send a formatted message to a Telegram chat with optional inline keyboard buttons
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: {
      inline_keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
    };
  }
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;

  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode || 'HTML',
  };

  if (options?.reply_markup) {
    payload.reply_markup = options.reply_markup;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
}

/**
 * Edit an existing message (e.g. update button state after approval)
 */
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  options?: {
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: {
      inline_keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
    };
  }
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/editMessageText`;

  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options?.parse_mode || 'HTML',
  };

  if (options?.reply_markup) {
    payload.reply_markup = options.reply_markup;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
}

/**
 * Answer an inline button callback query to dismiss loading state
 */
export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
) {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/answerCallbackQuery`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || '',
      show_alert: showAlert,
    }),
  });
}

/**
 * Get permanent download URL for a file sent to the bot
 */
export async function getTelegramFileDownloadUrl(fileId: string): Promise<string> {
  const token = getBotToken();
  const infoUrl = `${TELEGRAM_API_BASE}/bot${token}/getFile?file_id=${fileId}`;

  const res = await fetch(infoUrl);
  const data = await res.json();

  if (!data.ok || !data.result?.file_path) {
    throw new Error(`Failed to get file path from Telegram: ${JSON.stringify(data)}`);
  }

  return `${TELEGRAM_API_BASE}/file/bot${token}/${data.result.file_path}`;
}

/**
 * Download a file sent to Telegram as a binary Buffer (e.g. flyer poster)
 */
export async function downloadTelegramFileBuffer(fileId: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  downloadUrl: string;
}> {
  const downloadUrl = await getTelegramFileDownloadUrl(fileId);
  const fileRes = await fetch(downloadUrl);
  const arrayBuffer = await fileRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let mimeType = 'image/jpeg';
  const lowerUrl = downloadUrl.toLowerCase();
  if (lowerUrl.endsWith('.png')) {
    mimeType = 'image/png';
  } else if (lowerUrl.endsWith('.webp')) {
    mimeType = 'image/webp';
  } else if (lowerUrl.endsWith('.gif')) {
    mimeType = 'image/gif';
  } else if (buffer.length > 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      mimeType = 'image/png';
    } else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      mimeType = 'image/jpeg';
    }
  }

  return {
    buffer,
    mimeType,
    downloadUrl,
  };
}
