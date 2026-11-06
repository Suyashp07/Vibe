import { EventItem, PosterSources } from '@/types';

/**
 * Derives normalized image URLs and dimensions for an event poster.
 * Gracefully falls back to cover_image_url / poster_original_url when variants are pending or null.
 */
export function getPosterSources(event?: Partial<EventItem> | null): PosterSources {
  if (!event) {
    return {
      hero: '',
      card: '',
      thumb: '',
      original: '',
      blur: undefined,
      width: undefined,
      height: undefined,
      aspectRatio: undefined,
      dominantColor: '#07133A',
      isLowRes: false,
      isCustomPoster: false,
    };
  }

  // Original fallback: poster_original_url -> cover_image_url
  const original = (
    event.poster_original_url ||
    event.cover_image_url ||
    (event as any).cover_image ||
    (event as any).image_url ||
    ''
  ).trim();

  // If theme object has nested poster data (for resilience before DB migration)
  const themePoster = (event.theme as any)?.poster || {};

  const hero = (event.poster_hero_url || themePoster.hero_url || original).trim();
  const card = (event.poster_card_url || themePoster.card_url || original).trim();
  const thumb = (event.poster_thumb_url || themePoster.thumb_url || original).trim();
  const blur = event.poster_blur_data_url || themePoster.blur_data_url || undefined;

  const width = event.poster_width || themePoster.width || undefined;
  const height = event.poster_height || themePoster.height || undefined;

  let aspectRatio: number | undefined = event.poster_aspect_ratio || themePoster.aspect_ratio;
  if (!aspectRatio && width && height && height > 0) {
    aspectRatio = Number((width / height).toFixed(4));
  }
  // Default BookMyShow banners to standard 16:9 landscape aspect ratio
  if (!aspectRatio) {
    if (
      event.source_platform === 'bookmyshow' ||
      original.includes('bmscdn.com') ||
      hero.includes('bmscdn.com') ||
      card.includes('bmscdn.com')
    ) {
      aspectRatio = Number((16 / 9).toFixed(4));
    }
  }

  const dominantColor = (
    event.poster_dominant_color ||
    themePoster.dominant_color ||
    '#07133A'
  ).trim();

  const isLowRes = Boolean(
    event.poster_is_low_res ??
    themePoster.is_low_res ??
    (width && height && (width < 400 || height < 400))
  );

  // Check if poster is custom (from external aggregator, BookMyShow, user upload)
  const isCustomPoster = Boolean(
    original &&
    !original.includes('images.unsplash.com') &&
    !original.includes('images.pexels.com')
  );

  return {
    hero,
    card,
    thumb,
    original,
    blur,
    width,
    height,
    aspectRatio,
    dominantColor,
    isLowRes,
    isCustomPoster,
  };
}

/**
 * Darkens a hex color for high-contrast background info panels.
 */
export function getDarkenedDominantColor(hexColor?: string, fallback = '#0b1535'): string {
  if (!hexColor || !hexColor.startsWith('#')) return fallback;
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6 && hex.length !== 3) return fallback;

  let r = 0, g = 0, b = 0;
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback;

  // Darken significantly (by 70-80%) and clamp minimums to keep text readable
  const factor = 0.22;
  const darkR = Math.max(7, Math.min(30, Math.round(r * factor)));
  const darkG = Math.max(12, Math.min(35, Math.round(g * factor)));
  const darkB = Math.max(25, Math.min(55, Math.round(b * factor)));

  return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
}

