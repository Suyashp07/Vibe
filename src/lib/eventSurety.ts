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

// Generic Title Detection
export function isGenericEventTitle(title: string | null | undefined): boolean {
  if (!title || typeof title !== 'string') return true;
  const clean = title.trim().toLowerCase();
  if (clean.length < 4) return true;

  const genericPhrases = [
    'new event',
    'event',
    'my event',
    'an event',
    'the event',
    'test event',
    'test',
    'testing',
    'dummy event',
    'dummy',
    'sample event',
    'sample',
    'untitled',
    'untitled event',
    'untitled gathering',
    'live experience',
    'curated gathering',
    'community gathering',
    'special gathering',
    'exciting gathering',
    'vibe event',
    'vibe meetup',
    'flash vibe',
    'flash meetup',
    'quick meetup',
    'casual meetup',
    'gathering',
    'meetup',
    'hangout',
    'party',
  ];

  if (genericPhrases.includes(clean)) return true;
  if (clean.startsWith('untitled')) return true;
  if (/^(?:new|test|sample|dummy)\s+(?:event|meetup|gathering|vibe|party)$/i.test(clean)) return true;
  if (/^event\s*\d*$/i.test(clean)) return true;
  if (/^https?:\/\//i.test(clean)) return true;

  return false;
}

// Generic Venue Detection
export function isGenericEventVenue(venue: string | null | undefined, city?: string | null): boolean {
  if (!venue || typeof venue !== 'string') return true;
  const clean = venue.trim().toLowerCase();
  if (clean.length < 2) return true;

  const genericVenues = [
    'tba',
    'tbd',
    'to be announced',
    'to be decided',
    'venue tba',
    'location tba',
    'venue tbd',
    'location tbd',
    'tba venue',
    'tbd venue',
    't.b.a',
    't.b.a.',
    't.b.d',
    't.b.d.',
    'venue',
    'location',
    'place',
    'somewhere',
    'city venue',
    'unknown',
    'offline',
    'in-person',
    'near me',
    'tba (to be announced)',
  ];

  if (genericVenues.includes(clean)) return true;
  if (/^(?:venue|location|place)\s*(?:tba|tbd)?$/i.test(clean)) return true;
  if (/^(?:tba|tbd)\b/i.test(clean)) return true;
  if (clean.endsWith('tba') || clean.endsWith('tbd')) return true;
  if (city && (clean === `${city.toLowerCase()} venue` || clean === city.toLowerCase())) return true;
  if (/^[a-z\s]+ venue$/i.test(clean)) return true;

  return false;
}

// Boilerplate Description Detection
export function isGenericEventDescription(description: string | null | undefined): boolean {
  if (!description || typeof description !== 'string') return true;
  const clean = description.trim();
  if (clean.length < 35) return true;
  const lower = clean.toLowerCase();

  const boilerplatePrefixes = [
    'join us for an engaging upcoming event',
    'join us for this event',
    'join us for an exciting',
    'experience the vibe in',
    'experience the gathering in',
    'join this exciting upcoming gathering',
    'an exciting gathering bringing people together',
    'an intimate, curated experience bringing together',
    'an engaging upcoming event featuring live experi',
    'an exciting gathering bringing together passionate people',
  ];

  for (const prefix of boilerplatePrefixes) {
    if (lower.startsWith(prefix) || lower.includes(prefix)) {
      return true;
    }
  }

  if (lower.startsWith('join us for') && (lower.includes('bringing people together') || lower.includes('curated experience'))) {
    return true;
  }

  return false;
}

// Verified Pricing Detection
export function isVerifiedEventPricing(event: any): boolean {
  if (!event) return false;
  const priceText = (event.external_price_text || event.price_text || '').trim();
  const ticketUrl = (event.external_ticket_url || event.ticket_link || event.ticket_url || '').trim();
  const priceInr = event.price_inr;

  if (typeof priceInr === 'number' && priceInr >= 0) return true;
  if (ticketUrl && ticketUrl.length > 5 && !ticketUrl.includes('example.com')) return true;

  if (priceText) {
    // If explicit amount given: ₹499, Rs 500, $10, etc.
    if (/[\d₹$€£]/.test(priceText)) return true;
    // Explicit confirmation from prompt or metadata
    if (event.price_explicit === true || event.is_price_confirmed === true || event.theme?.price_explicit === true) return true;
    // If ticketUrl is present
    if (ticketUrl) return true;
  }

  return false;
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
  const titleGeneric = isGenericEventTitle(title);
  const titleValid = title.length >= 5 && !titleGeneric;

  // 2. Date Check (Weight: 20%)
  const rawDate = event.date || (event.start_at ? event.start_at.split('T')[0] : null);
  const isDateInferred =
    event.date_inferred === true ||
    event.date_missing === true ||
    event.is_date_confirmed === false ||
    event.theme?.date_inferred === true;
  const dateTimestamp = rawDate ? new Date(rawDate).getTime() : NaN;
  const dateValid = Boolean(rawDate && !isNaN(dateTimestamp) && !isDateInferred);

  // 3. Time Check (Weight: 15%)
  const rawTime =
    event.time ||
    (event.start_at && event.start_at.includes('T') ? event.start_at.split('T')[1]?.slice(0, 5) : null);
  const isTimeInferred =
    event.time_inferred === true ||
    event.time_missing === true ||
    event.theme?.time_inferred === true;
  const timeValid = Boolean(rawTime && rawTime.length >= 4 && rawTime !== '00:00' && !isTimeInferred);

  // 4. City Check (Weight: 10%)
  const city = (event.city || '').trim();
  const isCityInferred =
    event.city_inferred === true ||
    event.theme?.city_inferred === true;
  const cityValid =
    city.length >= 2 &&
    city.toLowerCase() !== 'unknown' &&
    city.toLowerCase() !== 'india' &&
    city.toLowerCase() !== 'online' &&
    !isCityInferred;

  // 5. Venue / Place Check (Weight: 20%)
  const venue = (event.venue_name || event.location_name || '').trim();
  const address = (event.venue_address || event.location_address || '').trim();
  const isOnline = event.event_type === 'online' || city.toLowerCase() === 'online';
  const isVenueInferred =
    event.venue_inferred === true ||
    event.venue_missing === true ||
    event.theme?.venue_inferred === true;
  const venueGeneric = isGenericEventVenue(venue, city);
  const venueValid = isOnline
    ? Boolean(event.online_link || address)
    : !venueGeneric && !isVenueInferred && venue.length >= 3;

  // 6. Cover Poster / Image Check (Weight: 5%)
  const coverUrl = (event.cover_image_url || event.cover_image || event.image_url || '').trim();
  const isStockUnsplash = coverUrl.includes('images.unsplash.com');
  const coverValid =
    coverUrl.length > 10 &&
    (coverUrl.startsWith('http://') || coverUrl.startsWith('https://') || coverUrl.startsWith('data:image')) &&
    !isStockUnsplash;

  // 7. Description / Storytelling Check (Weight: 5%)
  const description = (event.description || '').trim();
  const descGeneric = isGenericEventDescription(description);
  const descValid = description.length >= 35 && !descGeneric;

  // 8. Pricing & Ticketing Access Check (Weight: 5%)
  const priceText = (event.external_price_text || event.price_text || '').trim();
  const ticketUrl = (event.external_ticket_url || event.ticket_link || '').trim();
  const priceValid = isVerifiedEventPricing(event);

  const checks: SuretyFieldCheck[] = [
    {
      id: 'title',
      label: 'Event Title',
      present: titleValid,
      value: titleValid ? title : title ? `${title} (Generic)` : null,
      weight: 20,
      importance: 'critical',
      tip: titleValid ? 'Clear & descriptive event headline' : 'Add a descriptive event name (e.g. "Sunset Acoustic Jam")',
      missingMessage: titleGeneric ? 'Event title is generic or placeholder' : 'Event title not given by user',
    },
    {
      id: 'date',
      label: 'Event Date',
      present: dateValid,
      value: dateValid ? rawDate : rawDate ? `${rawDate} (Unconfirmed)` : null,
      weight: 20,
      importance: 'critical',
      tip: dateValid ? `Scheduled for ${rawDate}` : 'Select a confirmed calendar date',
      missingMessage: isDateInferred ? 'Event date was inferred/unverified' : 'Event date not given by user',
    },
    {
      id: 'venue',
      label: isOnline ? 'Online Link' : 'Place / Venue',
      present: venueValid,
      value: venueValid ? (venue || address) : venue ? `${venue} (Unverified/TBA)` : null,
      weight: 20,
      importance: 'critical',
      tip: venueValid ? `${venue || address}` : 'Add specific venue name or street landmark (TBA requires approval)',
      missingMessage: venueGeneric ? 'Venue is marked TBA or generic placeholder' : 'Place / venue not given by user',
    },
    {
      id: 'time',
      label: 'Start Time',
      present: timeValid,
      value: timeValid ? rawTime : rawTime ? `${rawTime} (Unconfirmed)` : null,
      weight: 15,
      importance: 'critical',
      tip: timeValid ? `Doors open at ${rawTime}` : 'Specify start time for attendee clarity',
      missingMessage: 'Start time not given by user',
    },
    {
      id: 'city',
      label: 'Host City',
      present: cityValid,
      value: cityValid ? city : city ? `${city} (Default)` : null,
      weight: 10,
      importance: 'critical',
      tip: cityValid ? `Located in ${city}` : 'Specify target city for local discovery filtering',
      missingMessage: 'Host city not specified by user',
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
      value: descValid ? `${description.slice(0, 60)}...` : descGeneric && description ? 'Template copy (Needs details)' : null,
      weight: 5,
      importance: 'recommended',
      tip: descValid ? `${description.length} chars description` : 'Provide authentic event details (min 35 characters)',
      missingMessage: descGeneric ? 'Description is auto-generated template copy' : 'Event details / description not provided',
    },
    {
      id: 'pricing',
      label: 'Ticketing & Pricing',
      present: priceValid,
      value: priceValid ? (priceText || (ticketUrl ? 'Ticket Link' : null)) : priceText ? `${priceText} (Unconfirmed)` : null,
      weight: 5,
      importance: 'recommended',
      tip: priceValid ? (priceText || 'Link provided') : 'Define ticket price or booking URL',
      missingMessage: 'Ticket pricing / registration link not specified',
    },
  ];

  let rawScore = 0;
  let filledCount = 0;
  const missingCritical: string[] = [];
  const missingAspects: string[] = [];

  checks.forEach((check) => {
    if (check.present) {
      rawScore += check.weight;
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

  // CRITICAL FAILURE CHECK:
  // An event CANNOT be high surety or auto-approved if Title, Venue, Date, or Time are missing/generic!
  const hasCriticalFailure = !titleValid || !venueValid || !dateValid || !timeValid;
  const hasMajorMissing = !titleValid || !venueValid || !dateValid;

  // Apply heavy score penalty if critical fields are absent
  let finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  if (hasMajorMissing) {
    // Cap score at 45% max if Title, Venue, or Date is missing/generic
    finalScore = Math.min(finalScore, 45);
  } else if (hasCriticalFailure) {
    // Cap score at 65% max if Time or City is missing
    finalScore = Math.min(finalScore, 65);
  }

  // Manual admin approval overrides auto-approval check
  const isManuallyApproved =
    event.approval_status === 'approved' ||
    event.admin_approved === true ||
    event.theme?.admin_approved === true;

  // Auto-approval ONLY allowed if >= 90% AND zero critical failures!
  const autoApproved = isManuallyApproved || (!hasCriticalFailure && finalScore >= 90);
  const approvalStatus: 'approved' | 'pending' = autoApproved ? 'approved' : 'pending';

  let tier: 'High' | 'Moderate' | 'Incomplete';
  let badgeColor: string;
  let textColor: string;
  let bgColor: string;
  let borderColor: string;

  if (finalScore >= 90 && !hasCriticalFailure) {
    tier = 'High';
    badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    textColor = 'text-emerald-400';
    bgColor = 'bg-emerald-500/10';
    borderColor = 'border-emerald-500/20';
  } else if (finalScore >= 70 && !hasMajorMissing) {
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
    : hasCriticalFailure
    ? `Requires Admin Approval (${finalScore}% Surety · Missing Critical Details)`
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
