/**
 * Eventbrite API v3 Integration Service
 * 
 * Fetches events directly from Eventbrite organizations, user accounts, and event IDs.
 * Maps Eventbrite API schema into Vibe's internal EventItem format.
 */

import { EventItem } from '@/types';

export interface EventbriteEventResponse {
  id: string;
  name: { text: string; html?: string };
  description: { text: string; html?: string };
  url: string;
  start: { timezone: string; local: string; utc: string };
  end: { timezone: string; local: string; utc: string };
  organization_id?: string;
  status?: string;
  currency?: string;
  is_free?: boolean;
  online_event?: boolean;
  capacity?: number;
  logo?: { url?: string; original?: { url: string } };
  venue?: {
    name?: string;
    address?: {
      address_1?: string;
      address_2?: string;
      city?: string;
      region?: string;
      postal_code?: string;
      country?: string;
      localized_address_display?: string;
    };
    latitude?: string;
    longitude?: string;
  };
  ticket_availability?: {
    has_available_tickets?: boolean;
    is_free?: boolean;
    minimum_ticket_price?: {
      currency?: string;
      display?: string;
      value?: number;
    };
  };
}

export interface EventbritePagination {
  object_count: number;
  page_number: number;
  page_size: number;
  page_count: number;
  has_more_items: boolean;
}

/**
 * Fetches user profile / organization list from Eventbrite using Private OAuth Token
 */
export async function getEventbriteOrganizations(token: string) {
  const cleanToken = token.trim();
  const res = await fetch('https://www.eventbriteapi.com/v3/users/me/organizations/', {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error_description || errorBody.error || `Eventbrite Auth Error (Status ${res.status})`
    );
  }

  const data = await res.json();
  return data.organizations || [];
}

/**
 * Fetches all events from an Eventbrite organization
 */
export async function getEventbriteOrgEvents(
  token: string,
  organizationId: string,
  status: 'live' | 'all' = 'live'
): Promise<EventbriteEventResponse[]> {
  const cleanToken = token.trim();
  const url = new URL(`https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`);
  url.searchParams.set('expand', 'venue,ticket_availability,logo');
  if (status !== 'all') {
    url.searchParams.set('status', status);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error_description || errorBody.error || `Failed to fetch organization events (Status ${res.status})`
    );
  }

  const data = await res.json();
  return data.events || [];
}

/**
 * Fetches a single event by ID using Eventbrite Private OAuth Token
 */
export async function getEventbriteEventById(
  token: string,
  eventId: string
): Promise<EventbriteEventResponse> {
  const cleanToken = token.trim();
  const cleanId = eventId.replace(/[^0-9]/g, '');
  const url = `https://www.eventbriteapi.com/v3/events/${cleanId}/?expand=venue,ticket_availability,logo`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.error_description || errorBody.error || `Failed to fetch event ${eventId} (Status ${res.status})`
    );
  }

  return res.json();
}

/**
 * Maps an Eventbrite API event into Vibe's internal EventItem format
 */
export function mapEventbriteToVibeEvent(eb: EventbriteEventResponse): Partial<EventItem> {
  const title = eb.name?.text || 'Eventbrite Event';
  const description = eb.description?.text || '';
  const coverUrl = eb.logo?.original?.url || eb.logo?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
  
  const venue = eb.venue;
  const address = venue?.address;
  const locationName = venue?.name || (eb.online_event ? 'Online / Virtual' : 'Live Venue');
  const city = address?.city || 'Mumbai';
  const fullAddress = address?.localized_address_display || address?.address_1 || `${locationName}, ${city}`;
  
  const isFree = Boolean(eb.is_free || eb.ticket_availability?.is_free);
  const minPrice = eb.ticket_availability?.minimum_ticket_price;
  const priceText = isFree
    ? 'Free Entry'
    : minPrice?.display || (minPrice?.value ? `₹${minPrice.value / 100}` : 'Paid Entry');

  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 45);
  const suffix = Math.random().toString(36).substring(2, 6);
  const slug = `${slugBase || 'eventbrite'}-${suffix}`;

  return {
    slug,
    title,
    tagline: description.slice(0, 120).trim() || 'Live experience curated via Eventbrite',
    description,
    cover_image_url: coverUrl,
    event_type: eb.online_event ? 'online' : 'in-person',
    location_name: locationName,
    location_address: fullAddress,
    city,
    start_at: eb.start?.utc || eb.start?.local ? new Date(eb.start.utc || eb.start.local).toISOString() : new Date().toISOString(),
    end_at: eb.end?.utc || eb.end?.local ? new Date(eb.end.utc || eb.end.local).toISOString() : undefined,
    timezone: eb.start?.timezone || 'Asia/Kolkata',
    capacity: eb.capacity || 100,
    is_public: true,
    status: 'live',
    source_type: 'external',
    source_platform: 'eventbrite',
    external_ticket_url: eb.url,
    external_price_text: priceText,
    confidence_score: 0.95,
  };
}
