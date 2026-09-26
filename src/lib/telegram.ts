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

export async function isAuthorizedCurator(_senderId?: string | number): Promise<boolean> {
  // All users are allowed to submit events through Telegram bot
  return true;
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
    message_thread_id?: number | string;
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

  if (options?.message_thread_id) {
    payload.message_thread_id = Number(options.message_thread_id);
  }

  if (options?.reply_markup?.inline_keyboard) {
    // Sanitize callback_data to adhere to Telegram's strict 1-64 byte limit
    const safeKeyboard = options.reply_markup.inline_keyboard.map((row) =>
      row.map((btn) => {
        if (btn.callback_data && Buffer.byteLength(btn.callback_data, 'utf8') > 64) {
          console.warn('[Telegram] Truncating oversized callback_data (exceeds 64 bytes):', btn.callback_data);
          return {
            text: btn.text,
            callback_data: btn.callback_data.slice(0, 64),
            url: btn.url,
          };
        }
        return btn;
      })
    );
    payload.reply_markup = { inline_keyboard: safeKeyboard };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('[sendTelegramMessage] Telegram API error:', data, 'payload was:', payload);
    // If rejected due to reply_markup or button formatting, automatically retry sending the message without reply_markup
    if (payload.reply_markup) {
      delete payload.reply_markup;
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return retryRes.json();
    }
  }

  return data;
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

  if (options?.reply_markup?.inline_keyboard) {
    const safeKeyboard = options.reply_markup.inline_keyboard.map((row) =>
      row.map((btn) => {
        if (btn.callback_data && Buffer.byteLength(btn.callback_data, 'utf8') > 64) {
          return {
            text: btn.text,
            callback_data: btn.callback_data.slice(0, 64),
            url: btn.url,
          };
        }
        return btn;
      })
    );
    payload.reply_markup = { inline_keyboard: safeKeyboard };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('[editTelegramMessage] Telegram API error:', data);
    if (payload.reply_markup) {
      delete payload.reply_markup;
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return retryRes.json();
    }
  }

  return data;
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

/**
 * Create a Telegram invite link that requires host approval (anti-scam gate)
 */
export async function createJoinRequestInviteLink(
  chatId: string | number,
  name?: string
): Promise<string | null> {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/createChatInviteLink`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        name: (name || 'Vibe Event').slice(0, 32),
        creates_join_request: true,
      }),
    });
    const data = await res.json();
    if (data.ok && data.result?.invite_link) {
      return data.result.invite_link;
    }
    console.warn('[createJoinRequestInviteLink] Failed to create invite link:', data);
  } catch (err) {
    console.error('[createJoinRequestInviteLink] Network error:', err);
  }
  return null;
}

/**
 * Approve a Telegram chat join request
 */
export async function approveChatJoinRequest(
  chatId: string | number,
  userId: number
): Promise<boolean> {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/approveChatJoinRequest`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
      }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.error('[approveChatJoinRequest] Network error:', err);
    return false;
  }
}

/**
 * Decline a Telegram chat join request
 */
export async function declineChatJoinRequest(
  chatId: string | number,
  userId: number
): Promise<boolean> {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/declineChatJoinRequest`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        user_id: userId,
      }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.error('[declineChatJoinRequest] Network error:', err);
    return false;
  }
}

