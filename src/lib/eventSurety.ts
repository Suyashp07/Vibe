export interface SuretyFieldCheck {
  id: string;
  label: string;
  present: boolean;
  value: string | null;
  weight: number;
  importance: 'critical' | 'recommended' | 'optional';
  tip: string;
}

export interface EventSuretyReport {
  score: number; // 0 to 100%
  tier: 'High' | 'Moderate' | 'Incomplete';
  badgeColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  filledCount: number;
  totalCount: number;
  checks: SuretyFieldCheck[];
  missingCritical: string[];
}

export function calculateEventSurety(event: any): EventSuretyReport {
  if (!event) {
    return {
      score: 0,
      tier: 'Incomplete',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      filledCount: 0,
      totalCount: 10,
      checks: [],
      missingCritical: ['Event data unavailable'],
    };
  }

  // 1. Title Check
  const title = (event.title || event.name || '').trim();
  const titleValid = title.length >= 5 && !title.toLowerCase().includes('untitled');

  // 2. Date Check
  const rawDate = event.date || (event.start_at ? event.start_at.split('T')[0] : null);
  const dateValid = Boolean(rawDate && !isNaN(new Date(rawDate).getTime()));

  // 3. Time Check
  const rawTime =
    event.time ||
    (event.start_at && event.start_at.includes('T') ? event.start_at.split('T')[1]?.slice(0, 5) : null);
  const timeValid = Boolean(rawTime && rawTime.length >= 4);

  // 4. City Check
  const city = (event.city || '').trim();
  const cityValid = city.length >= 2 && city.toLowerCase() !== 'unknown';

  // 5. Venue / Address Check
  const venue = (event.venue_name || event.location_name || '').trim();
  const address = (event.venue_address || event.location_address || '').trim();
  const isOnline = event.event_type === 'online' || city.toLowerCase() === 'online';
  const venueValid = isOnline
    ? Boolean(event.online_link || address)
    : venue.length >= 3 && venue.toLowerCase() !== city.toLowerCase();

  // 6. Cover Poster / Image Check
  const coverUrl = (event.cover_image_url || event.cover_image || event.image_url || '').trim();
  const coverValid =
    coverUrl.length > 10 &&
    (coverUrl.startsWith('http://') || coverUrl.startsWith('https://') || coverUrl.startsWith('data:image'));

  // 7. Description / Storytelling Check
  const description = (event.description || '').trim();
  const descValid = description.length >= 40;

  // 8. Pricing & Ticketing Access Check
  const priceText = (event.external_price_text || event.price_text || '').trim();
  const priceInr = event.price_inr;
  const ticketUrl = (event.external_ticket_url || event.ticket_link || '').trim();
  const priceValid =
    ticketUrl.length > 5 ||
    priceText.length > 0 ||
    typeof priceInr === 'number' ||
    priceText.toLowerCase().includes('free');

  // 9. Category Check
  const category = (event.category || '').trim();
  const categoryValid = category.length >= 3 && category.toLowerCase() !== 'other';

  // 10. FAQ / Entry Policy Check
  const faqs = Array.isArray(event.faq) ? event.faq : [];
  const faqValid = faqs.length > 0 || Boolean(event.confirmation_message);

  const checks: SuretyFieldCheck[] = [
    {
      id: 'title',
      label: 'Event Title',
      present: titleValid,
      value: title || null,
      weight: 15,
      importance: 'critical',
      tip: titleValid ? 'Clear & descriptive event headline' : 'Add a clear title (at least 5 characters)',
    },
    {
      id: 'date',
      label: 'Event Date',
      present: dateValid,
      value: rawDate,
      weight: 15,
      importance: 'critical',
      tip: dateValid ? `Scheduled for ${rawDate}` : 'Select an exact calendar date',
    },
    {
      id: 'time',
      label: 'Start Time',
      present: timeValid,
      value: rawTime,
      weight: 10,
      importance: 'recommended',
      tip: timeValid ? `Doors open at ${rawTime}` : 'Specify start time for attendee clarity',
    },
    {
      id: 'city',
      label: 'Host City',
      present: cityValid,
      value: city || null,
      weight: 10,
      importance: 'critical',
      tip: cityValid ? `Located in ${city}` : 'Specify target city for local discovery filtering',
    },
    {
      id: 'venue',
      label: isOnline ? 'Online Link' : 'Venue & Address',
      present: venueValid,
      value: venue || address || null,
      weight: 10,
      importance: 'recommended',
      tip: venueValid ? `${venue || address}` : 'Add specific venue name or street landmark',
    },
    {
      id: 'cover',
      label: 'Poster / Artwork',
      present: coverValid,
      value: coverValid ? 'Artwork uploaded' : null,
      weight: 15,
      importance: 'recommended',
      tip: coverValid ? 'High-resolution flyer attached' : 'Upload custom poster or select curated banner',
    },
    {
      id: 'description',
      label: 'Event Description',
      present: descValid,
      value: description ? `${description.slice(0, 60)}...` : null,
      weight: 10,
      importance: 'recommended',
      tip: descValid ? `${description.length} chars description` : 'Provide more details (min 40 characters)',
    },
    {
      id: 'pricing',
      label: 'Ticketing & Pricing',
      present: priceValid,
      value: priceText || (ticketUrl ? 'External Link' : null),
      weight: 5,
      importance: 'recommended',
      tip: priceValid ? (priceText || 'Link provided') : 'Define ticket price or booking URL',
    },
    {
      id: 'category',
      label: 'Category Tag',
      present: categoryValid,
      value: category || null,
      weight: 5,
      importance: 'optional',
      tip: categoryValid ? category : 'Assign category (Tech, Music, Comedy, etc.)',
    },
    {
      id: 'faq',
      label: 'FAQ / Entry Policy',
      present: faqValid,
      value: faqs.length > 0 ? `${faqs.length} FAQ item(s)` : null,
      weight: 5,
      importance: 'optional',
      tip: faqValid ? `${faqs.length} Q&As added` : 'Include attendee entry policy or dress code',
    },
  ];

  let totalScore = 0;
  let filledCount = 0;
  const missingCritical: string[] = [];

  checks.forEach((check) => {
    if (check.present) {
      totalScore += check.weight;
      filledCount++;
    } else if (check.importance === 'critical') {
      missingCritical.push(check.label);
    }
  });

  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  let tier: 'High' | 'Moderate' | 'Incomplete';
  let badgeColor: string;
  let textColor: string;
  let bgColor: string;
  let borderColor: string;

  if (finalScore >= 80) {
    tier = 'High';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    textColor = 'text-emerald-700';
    bgColor = 'bg-emerald-50';
    borderColor = 'border-emerald-200';
  } else if (finalScore >= 50) {
    tier = 'Moderate';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    textColor = 'text-amber-700';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
  } else {
    tier = 'Incomplete';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    textColor = 'text-rose-700';
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-200';
  }

  return {
    score: finalScore,
    tier,
    badgeColor,
    textColor,
    bgColor,
    borderColor,
    filledCount,
    totalCount: checks.length,
    checks,
    missingCritical,
  };
}
