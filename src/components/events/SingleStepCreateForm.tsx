'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Ticket,
  Link2,
  Users,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { EventItem } from '@/types';
import { saveEvent } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { POPULAR_CITIES, INDIAN_CITIES } from '@/lib/location';

// Curated aesthetic fallback covers by category
const CATEGORY_PRESETS: Record<string, string[]> = {
  'Tech & AI': [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
  ],
  'Music & Gigs': [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
  ],
  'Social & Mixers': [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  ],
  'Design & Creative': [
    'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  ],
  'Wellness & Fitness': [
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
  ],
  'Culture & Baithak': [
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80',
  ],
};

const CATEGORIES = [
  'Tech & AI',
  'Music & Gigs',
  'Social & Mixers',
  'Design & Creative',
  'Wellness & Fitness',
  'Culture & Baithak',
  'Food & Drinks',
  'Other',
];

export default function SingleStepCreateForm() {
  const router = useRouter();
  const { profile } = useAuth();

  // Basic Details
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Tech & AI');

  // Date & Time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');

  // Location
  const [eventType, setEventType] = useState<'in-person' | 'online'>('in-person');
  const [city, setCity] = useState('Mumbai');
  const [venueName, setVenueName] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');

  // Description
  const [description, setDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Cover Image
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
  );

  // Admission / Ticketing
  const [ticketingMode, setTicketingMode] = useState<'native' | 'external'>('native');
  const [capacity, setCapacity] = useState('100');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalPrice, setExternalPrice] = useState('₹499');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Description Enhancement
  const handleEnhanceWithAI = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter an event title before generating AI description.');
      return;
    }

    setIsEnhancing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${title}. Tagline: ${tagline || 'Experience the vibe'}. Venue: ${venueName || city}. Category: ${category}`,
          field: 'description',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setDescription(data.result);
        }
      }
    } catch {
      // Fallback description
      setDescription(
        `Join us for ${title} in ${city}. An intimate gathering featuring thoughtful conversations, great people, and curated experiences. Reserve your spot early as space is limited!`
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (publishLive: boolean = true) => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Event title is required.');
      return;
    }
    if (eventType === 'in-person' && !venueName.trim()) {
      setErrorMsg('Please specify a venue or neighborhood name.');
      return;
    }
    if (ticketingMode === 'external' && !externalUrl.trim()) {
      setErrorMsg('Please enter the external ticketing URL.');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
      const endDateTime = endTime
        ? new Date(`${date}T${endTime}:00`).toISOString()
        : new Date(new Date(startDateTime).getTime() + 3 * 3600000).toISOString();

      const slugBase = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 50);
      const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

      const newEvent: EventItem = {
        id: `evt-${Date.now()}`,
        organizer_id: profile?.id || 'org-user',
        organizer_name: profile?.name || 'Vibe Host',
        organizer_handle: profile?.handle || 'host',
        organizer_brand_color: '#E8621A',
        slug: uniqueSlug,
        title: title.trim(),
        tagline: tagline.trim() || `Experience ${title} in ${city}`,
        description: description.trim() || `Join us for ${title}. Reserve your spot to receive venue updates and community access.`,
        cover_image_url: coverUrl,
        template: 'grove',
        theme: {
          palette: 'forest',
          font: 'Inter',
          bg_style: 'solid',
          button_style: 'solid',
        },
        sections: { speakers: false, agenda: false, gallery: false, faq: false },
        event_type: eventType,
        location_name: eventType === 'in-person' ? venueName.trim() : 'Online Event',
        location_address: eventType === 'in-person' ? `${venueName.trim()}, ${city}, India` : 'Virtual',
        city: city,
        start_at: startDateTime,
        end_at: endDateTime,
        timezone: 'Asia/Kolkata',
        capacity: ticketingMode === 'native' ? (parseInt(capacity) || 100) : undefined,
        is_public: true,
        status: publishLive ? 'live' : 'draft',
        ai_generated: false,
        source_type: ticketingMode === 'external' ? 'external' : 'native',
        source_platform: ticketingMode === 'external' ? 'District' : undefined,
        external_ticket_url: ticketingMode === 'external' ? externalUrl.trim() : undefined,
        external_price_text: ticketingMode === 'external' ? externalPrice.trim() : 'Free Entry',
        faq: [],
        rsvp_form_config: {
          ask_plus_one: true,
          ask_dietary: false,
          ask_tshirt: false,
          waitlist_enabled: true,
          confirmation_message: ticketingMode === 'external'
            ? 'Redirecting to ticketing partner'
            : 'Your spot is confirmed! Present your pass at the entrance.',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await saveEvent(newEvent);
      router.push(`/${uniqueSlug}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish event.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="w-9 h-9 rounded-xl border border-border bg-surface hover:bg-surface-3 flex items-center justify-center text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand tracking-tight font-sans">
              Create New Experience
            </h1>
            <p className="text-xs text-ink-muted">
              Fast, minimalist setup inspired by District. Published in seconds.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-ink hover:bg-surface-3 transition"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-accent transition shadow-sm flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Publish Event Live</span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Title & Category */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Event Title <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pune Rooftop Indie Music & Sunset Mixer"
                className="w-full text-base font-bold px-3.5 py-2.5 rounded-xl border border-border bg-surface-2 focus:border-brand focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Short Tagline / Pitch
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="One punchy sentence that hooks your audience..."
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-border bg-surface-2 focus:border-brand focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      if (CATEGORY_PRESETS[cat]?.[0]) {
                        setCoverUrl(CATEGORY_PRESETS[cat][0]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      category === cat
                        ? 'bg-brand text-white shadow-xs'
                        : 'bg-surface-2 border border-border text-ink-secondary hover:text-ink'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Date & Time */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>Schedule & Timing</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                  Date <span className="text-accent">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                  Start Time <span className="text-accent">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location & Format */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>Venue & Location</span>
              </h3>

              {/* In-Person vs Online Toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-2 border border-border text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setEventType('in-person')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    eventType === 'in-person' ? 'bg-brand text-white shadow-xs' : 'text-ink-secondary'
                  }`}
                >
                  In-Person
                </button>
                <button
                  type="button"
                  onClick={() => setEventType('online')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    eventType === 'online' ? 'bg-brand text-white shadow-xs' : 'text-ink-secondary'
                  }`}
                >
                  Online
                </button>
              </div>
            </div>

            {eventType === 'in-person' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                      City <span className="text-accent">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                    >
                      {POPULAR_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                      Venue Name / Neighborhood <span className="text-accent">*</span>
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="e.g. Subko Bandra or WeWork Galaxy"
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                  Virtual Meeting / Stream Link
                </label>
                <input
                  type="url"
                  value={onlineUrl}
                  onChange={(e) => setOnlineUrl(e.target.value)}
                  placeholder="https://meet.google.com/... or Zoom URL"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 4: Description */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Event Description
              </label>
              <button
                type="button"
                onClick={handleEnhanceWithAI}
                disabled={isEnhancing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-bold hover:bg-accent hover:text-white transition"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Writing...' : '✨ Polish with AI'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What can attendees expect? Mention activities, who should join, and any entry details..."
              className="w-full text-xs font-medium p-3.5 rounded-xl border border-border bg-surface-2 focus:border-brand focus:outline-none transition leading-relaxed"
            />
          </div>

          {/* Section 5: Admission & Ticketing */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-accent" />
                <span>Admission & Ticketing</span>
              </h3>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-2 border border-border text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTicketingMode('native')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    ticketingMode === 'native' ? 'bg-brand text-white shadow-xs' : 'text-ink-secondary'
                  }`}
                >
                  Free RSVP (Vibe)
                </button>
                <button
                  type="button"
                  onClick={() => setTicketingMode('external')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    ticketingMode === 'external' ? 'bg-brand text-white shadow-xs' : 'text-ink-secondary'
                  }`}
                >
                  External Tickets
                </button>
              </div>
            </div>

            {ticketingMode === 'native' ? (
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                  Capacity / Spot Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-32 text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                  />
                  <span className="text-xs text-ink-muted">spots available for guest registration</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                    Ticketing Link (BookMyShow, District, etc.) <span className="text-accent">*</span>
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://in.bookmyshow.com/... or https://district.in/..."
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                    Price Display Tag
                  </label>
                  <input
                    type="text"
                    value={externalPrice}
                    onChange={(e) => setExternalPrice(e.target.value)}
                    placeholder="e.g. ₹499 or Free on District"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Poster Preview & Quick Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-4 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-accent" />
              <span>Event Poster & Cover</span>
            </h3>

            {/* Poster Preview */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-surface-3 border border-border">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={title || 'Event cover preview'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-ink-muted">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                  <span className="text-xs">No cover selected</span>
                </div>
              )}

              {/* Overlay preview tag */}
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                  {category}
                </span>
              </div>
            </div>

            {/* Cover URL Input */}
            <div>
              <label className="block text-[11px] font-bold text-ink-secondary mb-1">
                Custom Image URL
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Paste high-res image URL..."
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface-2 focus:outline-none"
              />
            </div>

            {/* Curated Presets for Current Category */}
            {CATEGORY_PRESETS[category] && (
              <div>
                <label className="block text-[11px] font-bold text-ink-muted mb-2">
                  Or pick a curated aesthetic preset:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_PRESETS[category].map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverUrl(presetUrl)}
                      className={`relative aspect-[16/9] rounded-lg overflow-hidden border transition ${
                        coverUrl === presetUrl
                          ? 'ring-2 ring-brand border-transparent'
                          : 'border-border hover:opacity-90'
                      }`}
                    >
                      <Image
                        src={presetUrl}
                        alt="Preset cover"
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Submit Actions */}
            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-brand hover:bg-accent text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Event...</span>
                  </>
                ) : (
                  <span>Publish Event Live 🚀</span>
                )}
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-3 text-xs font-semibold text-ink transition text-center"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
