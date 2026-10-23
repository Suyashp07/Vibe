/**
 * Determines whether an event poster was uploaded/provided by a human host/user
 * (flyer, poster photo, custom uploaded graphic) vs an AI-generated or stock ambient backdrop.
 */
export function isUserUploadedPoster(url?: string | null, event?: any): boolean {
  if (!url || typeof url !== 'string') return false;

  const cleanUrl = url.trim().toLowerCase();

  // 1. Explicit theme / event metadata flags
  const theme = event?.theme || event?.originalEvent?.theme;
  if (
    theme?.has_custom_poster === true ||
    theme?.custom_poster === true ||
    event?.has_custom_poster === true ||
    event?.originalEvent?.has_custom_poster === true
  ) {
    return true;
  }

  // 2. Uploaded to Supabase Storage (e.g. event-covers bucket from WhatsApp/Telegram bot or web upload)
  if (
    cleanUrl.includes('event-covers') ||
    cleanUrl.includes('/storage/v1/object/public/event-covers') ||
    cleanUrl.includes('supabase.co/storage')
  ) {
    return true;
  }

  // 3. Browser-uploaded Base64 data or blob URLs
  if (cleanUrl.startsWith('data:image/') || cleanUrl.startsWith('blob:')) {
    return true;
  }

  // 4. Known stock & AI image generator domains -> NOT user posters
  const isStockOrAi =
    cleanUrl.includes('images.unsplash.com') ||
    cleanUrl.includes('unsplash.com') ||
    cleanUrl.includes('pollinations.ai') ||
    cleanUrl.includes('fal.media') ||
    cleanUrl.includes('replicate.delivery') ||
    cleanUrl.includes('oaidalleapiprodscus') ||
    cleanUrl.includes('picsum.photos');

  if (isStockOrAi) {
    return false;
  }

  // 5. If event is explicitly marked ai_generated and no custom poster was provided
  const isAiGen = event?.ai_generated || event?.originalEvent?.ai_generated;
  if (isAiGen && !theme?.has_custom_poster) {
    return false;
  }

  // 6. Any other custom URL (e.g. host's own hosted flyer, cloudinary, external CDN)
  return true;
}
