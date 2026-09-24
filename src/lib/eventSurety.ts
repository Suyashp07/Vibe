export interface SuretyFieldCheck {
  id: string;
  label: string;
  present: boolean;
  value: string | null;
  weight: number;
  importance: 'critical' | 'recommended' | 'optional';
  tip: string;
  missingMessage?: string;
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
  missingAspects: string[]; // Specific human-readable aspects not given by user
  autoApproved: boolean; // score >= 90
  approvalStatus: 'approved' | 'pending';
  approvalLabel: string;
}

export function calculateEventSurety(event: any): EventSuretyReport {
  if (!event) {
    return {
      score: 0,
      tier: 'Incomplete',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      filledCount: 0,
      totalCount: 8,
      checks: [],
      missingCritical: ['Event data unavailable'],
      missingAspects: ['Event details not provided'],
      autoApproved: false,
      approvalStatus: 'pending',
      approvalLabel: 'Requires Admin Approval (<90% Surety)',
    };
  }

  // 1. Title Check (Weight: 20%)
  const title = (event.title || event.name || '').trim();
  const isGenericTitle =
    title.toLowerCase().includes('untitled') ||
    title.toLowerCase() === 'live experience' ||
    title.toLowerCase() === 'curated gathering' ||
    title.toLowerCase() === 'community gathering';
  const titleValid = title.length >= 5 && !isGenericTitle;

  // 2. Date Check (Weight: 20%)
  const rawDate = event.date || (event.start_at ? event.start_at.split('T')[0] : null);
  const dateValid = Boolean(rawDate && !isNaN(new Date(rawDate).getTime()));

  // 3. Time Check (Weight: 15%)
  const rawTime =
    event.time ||
    (event.start_at && event.start_at.includes('T') ? event.start_at.split('T')[1]?.slice(0, 5) : null);
  const timeValid = Boolean(rawTime && rawTime.length >= 4 && rawTime !== '00:00');

  // 4. City Check (Weight: 10%)
  const city = (event.city || '').trim();
  const cityValid = city.length >= 2 && city.toLowerCase() !== 'unknown' && city.toLowerCase() !== 'india';

  // 5. Venue / Place Check (Weight: 20%)
  const venue = (event.venue_name || event.location_name || '').trim();
  const address = (event.venue_address || event.location_address || '').trim();
  const isOnline = event.event_type === 'online' || city.toLowerCase() === 'online';
  const isGenericVenue =
    !venue ||
    venue.toLowerCase() === 'city venue' ||
    venue.toLowerCase() === `${city.toLowerCase()} venue` ||
    venue.toLowerCase() === city.toLowerCase() ||
    venue.toLowerCase().includes('venue tba');
  const venueValid = isOnline ? Boolean(event.online_link || address) : !isGenericVenue && venue.length >= 3;

  // 6. Cover Poster / Image Check (Weight: 5%)
  const coverUrl = (event.cover_image_url || event.cover_image || event.image_url || '').trim();
  const isStockUnsplash = coverUrl.includes('images.unsplash.com');
  const coverValid =
    coverUrl.length > 10 &&
    (coverUrl.startsWith('http://') || coverUrl.startsWith('https://') || coverUrl.startsWith('data:image')) &&
    !isStockUnsplash; // Give bonus if custom artwork/flyer was supplied

  // 7. Description / Storytelling Check (Weight: 5%)
  const description = (event.description || '').trim();
  const descValid = description.length >= 35 && !description.startsWith('Join this exciting upcoming gathering');

  // 8. Pricing & Ticketing Access Check (Weight: 5%)
  const priceText = (event.external_price_text || event.price_text || '').trim();
  const priceInr = event.price_inr;
  const ticketUrl = (event.external_ticket_url || event.ticket_link || '').trim();
  const priceValid =
    ticketUrl.length > 5 ||
    priceText.length > 0 ||
    typeof priceInr === 'number' ||
    priceText.toLowerCase().includes('free');

  const checks: SuretyFieldCheck[] = [
    {
      id: 'title',
      label: 'Event Title',
      present: titleValid,
      value: title || null,
      weight: 20,
      importance: 'critical',
      tip: titleValid ? 'Clear & descriptive event headline' : 'Add a clear title (at least 5 characters)',
      missingMessage: 'Event title not given by user',
    },
    {
      id: 'date',
      label: 'Event Date',
      present: dateValid,
      value: rawDate,
      weight: 20,
      importance: 'critical',
      tip: dateValid ? `Scheduled for ${rawDate}` : 'Select an exact calendar date',
      missingMessage: 'Event date not given by user',
    },
    {
      id: 'venue',
      label: isOnline ? 'Online Link' : 'Place / Venue',
      present: venueValid,
      value: venue || address || null,
      weight: 20,
      importance: 'critical',
      tip: venueValid ? `${venue || address}` : 'Add specific venue name or street landmark',
      missingMessage: 'Place / venue not given by user',
    },
    {
      id: 'time',
      label: 'Start Time',
      present: timeValid,
      value: rawTime,
      weight: 15,
      importance: 'critical',
      tip: timeValid ? `Doors open at ${rawTime}` : 'Specify start time for attendee clarity',
      missingMessage: 'Start time not given by user',
    },
    {
      id: 'city',
      label: 'Host City',
      present: cityValid,
      value: city || null,
      weight: 10,
      importance: 'critical',
      tip: cityValid ? `Located in ${city}` : 'Specify target city for local discovery filtering',
      missingMessage: 'Host city not given by user',
    },
    {
      id: 'cover',
      label: 'Poster / Artwork',
      present: coverValid,
      value: coverValid ? 'Custom artwork uploaded' : null,
      weight: 5,
      importance: 'recommended',
      tip: coverValid ? 'High-resolution flyer attached' : 'Upload custom poster or flyer',
      missingMessage: 'Event flyer / poster not provided',
    },
    {
      id: 'description',
      label: 'Event Description',
      present: descValid,
      value: description ? `${description.slice(0, 60)}...` : null,
      weight: 5,
      importance: 'recommended',
      tip: descValid ? `${description.length} chars description` : 'Provide more details (min 35 characters)',
      missingMessage: 'Event details / description not provided',
    },
    {
      id: 'pricing',
      label: 'Ticketing & Pricing',
      present: priceValid,
      value: priceText || (ticketUrl ? 'External Link' : null),
      weight: 5,
      importance: 'recommended',
      tip: priceValid ? (priceText || 'Link provided') : 'Define ticket price or booking URL',
      missingMessage: 'Ticket pricing / registration link not specified',
    },
  ];

  let totalScore = 0;
  let filledCount = 0;
  const missingCritical: string[] = [];
  const missingAspects: string[] = [];

  checks.forEach((check) => {
    if (check.present) {
      totalScore += check.weight;
      filledCount++;
    } else {
      if (check.importance === 'critical') {
        missingCritical.push(check.label);
      }
      if (check.missingMessage) {
        missingAspects.push(check.missingMessage);
      }
    }
  });

  // Also include any explicitly stored missing_aspects on the event if present
  if (Array.isArray(event.missing_aspects) && event.missing_aspects.length > 0) {
    event.missing_aspects.forEach((m: string) => {
      if (!missingAspects.includes(m)) {
        missingAspects.push(m);
      }
    });
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  // >= 90% threshold for auto-approval rule
  const isManuallyApproved =
    event.approval_status === 'approved' ||
    event.admin_approved === true ||
    ((event.status || '').toLowerCase() === 'live' && event.approval_status !== 'pending');

  const autoApproved = finalScore >= 90 || isManuallyApproved;
  const approvalStatus: 'approved' | 'pending' = autoApproved ? 'approved' : 'pending';

  let tier: 'High' | 'Moderate' | 'Incomplete';
  let badgeColor: string;
  let textColor: string;
  let bgColor: string;
  let borderColor: string;

  if (finalScore >= 90) {
    tier = 'High';
    badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    textColor = 'text-emerald-400';
    bgColor = 'bg-emerald-500/10';
    borderColor = 'border-emerald-500/20';
  } else if (finalScore >= 70) {
    tier = 'Moderate';
    badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    textColor = 'text-amber-300';
    bgColor = 'bg-amber-500/10';
    borderColor = 'border-amber-500/20';
  } else {
    tier = 'Incomplete';
    badgeColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    textColor = 'text-rose-400';
    bgColor = 'bg-rose-500/10';
    borderColor = 'border-rose-500/20';
  }

  const approvalLabel = autoApproved
    ? `Auto-Approved (${finalScore}% Surety)`
    : `Requires Admin Approval (${finalScore}% Surety)`;

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
    missingAspects,
    autoApproved,
    approvalStatus,
    approvalLabel,
  };
}
