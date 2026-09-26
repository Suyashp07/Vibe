import { EventItem } from '@/types';

export interface EventDisplayTags {
  category: string;
  sourceLabel: string;
  sourceKey: string;
  priceTag: 'Free' | 'Paid';
  isVerified: boolean;
  moodTags: string[];
}

export function getEventDisplayTags(event: EventItem): EventDisplayTags {
  const title = (event.title || '').toLowerCase();
  const tagline = (event.tagline || '').toLowerCase();
  const desc = (event.description || '').toLowerCase();
  const categoryRaw = (event.category || '').toLowerCase();
  const venue = (event.location_name || '').toLowerCase();
  const city = (event.city || '').toLowerCase();
  const platform = (event.source_platform || '').toLowerCase();
  const priceText = (event.external_price_text || '').toLowerCase();

  const fullText = `${title} ${tagline} ${desc} ${categoryRaw} ${venue} ${city} ${platform}`;

  // 1. Category extraction
  let category = 'Arts';
  if (['comedy', 'stand-up', 'standup', 'roast', 'humor', 'comic'].some((w) => fullText.includes(w))) {
    category = 'Arts';
  } else if (['music', 'concert', 'band', 'acoustic', 'sitar', 'dj', 'gig', 'live', 'orchestra', 'beats'].some((w) => fullText.includes(w))) {
    category = 'Music';
  } else if (['pottery', 'art', 'theatre', 'poetry', 'design', 'craft', 'painting', 'exhibition', 'sculpture'].some((w) => fullText.includes(w))) {
    category = 'Arts';
  } else if (['tech', 'ai', 'developer', 'code', 'software', 'hacker', 'startup'].some((w) => fullText.includes(w))) {
    category = 'Technology';
  } else if (['workshop', 'camp', 'masterclass', 'bootcamp', 'learn', 'lecture', 'residential'].some((w) => fullText.includes(w))) {
    category = 'Education';
  } else if (['fitness', 'yoga', 'wellness', 'mental', 'breathwork', 'meditation'].some((w) => fullText.includes(w))) {
    category = 'Wellness';
  } else if (['sport', 'turf', 'cricket', 'football', 'badminton', 'match', 'padel'].some((w) => fullText.includes(w))) {
    category = 'Sports';
  } else if (['food', 'dining', 'dinner', 'culinary', 'tasting', 'drinks', 'coffee', 'chai', 'cafe'].some((w) => fullText.includes(w))) {
    category = 'Food';
  } else if (['business', 'founder', 'pitch', 'investor', 'summit', 'conference'].some((w) => fullText.includes(w))) {
    category = 'Business';
  } else if (event.category && event.category.trim() && event.category.toLowerCase() !== 'other') {
    category = event.category.trim();
  }

  // 2. Source / Ticketing Partner Tag
  let sourceLabel = '⚡ Vibe Native';
  let sourceKey = 'vibe';

  if (platform.includes('bookmyshow')) {
    sourceLabel = 'Tickets · BookMyShow';
    sourceKey = 'bookmyshow';
  } else if (platform.includes('luma')) {
    sourceLabel = 'Tickets · Luma';
    sourceKey = 'luma';
  } else if (platform.includes('insider') || platform.includes('paytm')) {
    sourceLabel = 'Tickets · Paytm Insider';
    sourceKey = 'insider';
  } else if (platform.includes('district')) {
    sourceLabel = 'Tickets · District';
    sourceKey = 'district';
  } else if (platform.includes('unstop')) {
    sourceLabel = 'Tickets · Unstop';
    sourceKey = 'unstop';
  } else if (event.source_platform) {
    sourceLabel = `Tickets · ${event.source_platform}`;
    sourceKey = event.source_platform.toLowerCase();
  } else if (event.source_type === 'external' || event.is_external || event.external_ticket_url) {
    sourceLabel = 'Tickets · Partner';
    sourceKey = 'external';
  }

  // 3. Price Tag: Free vs Paid
  let priceTag: 'Free' | 'Paid' = 'Paid';
  if (
    priceText.includes('free') ||
    priceText.includes('₹0') ||
    priceText.includes('rs 0') ||
    priceText.includes('rs. 0') ||
    (!event.external_price_text && (event.source_type !== 'external' || !event.external_ticket_url)) ||
    (event as any).is_free
  ) {
    priceTag = 'Free';
  }

  // 4. Verification status
  const isVerified = Boolean(
    event.admin_approved ||
    (event.confidence_score && event.confidence_score >= 0.85) ||
    platform.includes('bookmyshow') ||
    platform.includes('insider') ||
    platform.includes('luma')
  );

  // 5. Mood / Activity Tags matching feed filters
  const moodTags: string[] = [];

  if (['stand-up', 'standup'].some((w) => fullText.includes(w))) {
    moodTags.push('Stand-up');
  }
  if (['comedy', 'comic', 'humor', 'roast'].some((w) => fullText.includes(w)) && !moodTags.includes('Stand-up')) {
    moodTags.push('Comedy');
  }
  if (['workshop', 'camp', 'pottery', 'masterclass', 'hands-on', 'learn'].some((w) => fullText.includes(w))) {
    moodTags.push('Workshop');
  }
  if (['art', 'pottery', 'painting', 'theatre', 'craft', 'poetry'].some((w) => fullText.includes(w))) {
    moodTags.push('Art');
  }
  if (['music', 'concert', 'band', 'acoustic', 'sitar', 'live', 'gig', 'beats'].some((w) => fullText.includes(w))) {
    moodTags.push('Music');
  }
  if (['coffee', 'cafe', 'chai', 'bistro'].some((w) => fullText.includes(w))) {
    moodTags.push('Coffee');
  }
  if (['18+', 'bar', 'pub', 'liquor', 'brewery', 'cocktail', 'nightlife'].some((w) => fullText.includes(w))) {
    moodTags.push('18+');
  }
  if (['party', 'dj', 'club', 'celebration', 'techno'].some((w) => fullText.includes(w))) {
    moodTags.push('Party');
  }
  if (['networking', 'mixer', 'founder', 'connect', 'social'].some((w) => fullText.includes(w))) {
    moodTags.push('Networking');
  }
  if (['meetup', 'gathering', 'community'].some((w) => fullText.includes(w))) {
    moodTags.push('Meetup');
  }
  if (['outdoor', 'rooftop', 'terrace', 'park', 'lawn', 'ground', 'open air'].some((w) => fullText.includes(w))) {
    moodTags.push('Outdoor');
  }
  if (['fitness', 'yoga', 'run', 'marathon', 'workout'].some((w) => fullText.includes(w))) {
    moodTags.push('Fitness');
  }
  if (['sport', 'cricket', 'football', 'badminton', 'turf'].some((w) => fullText.includes(w))) {
    moodTags.push('Sports');
  }

  // Include any extra flash_tags if not already present
  if (event.flash_tags && Array.isArray(event.flash_tags)) {
    event.flash_tags.forEach((t) => {
      const formatted = t.trim();
      if (formatted && !moodTags.includes(formatted)) {
        moodTags.push(formatted);
      }
    });
  }

  // Cap visible tags to 3-4 so the card remains ultra-clean
  const selectedMoods = moodTags.slice(0, 3);

  return {
    category,
    sourceLabel,
    sourceKey,
    priceTag,
    isVerified,
    moodTags: selectedMoods,
  };
}
