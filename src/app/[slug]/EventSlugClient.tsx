'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import UnifiedEventDetailView from '@/components/events/UnifiedEventDetailView';
import OrganizerProfileView from '@/components/organizer/OrganizerProfileView';
import { getEvents, getOrganizerByHandle, subscribeToStore, syncEventsWithSupabase } from '@/lib/store';
import { EventItem, Profile } from '@/types';
import { Compass, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/adminConstants';

interface EventSlugClientProps {
  slug: string;
}

export default function EventSlugClient({ slug }: EventSlugClientProps) {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [organizer, setOrganizer] = useState<Profile | null>(null);
  const [organizerEvents, setOrganizerEvents] = useState<EventItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    // Check if current user is an administrator
    try {
      const match = document.cookie.match(/vibe_auth_email=([^;]+)/);
      if (match) {
        const email = decodeURIComponent(match[1]).toLowerCase();
        if (ADMIN_EMAILS.includes(email)) {
          setIsAdmin(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const resolveSlug = async () => {
      const allEvents = getEvents();

      // 1. Check if it's an event slug in local store
      let foundEvent = allEvents.find(
        (e) => e.slug.toLowerCase() === slug.toLowerCase()
      );

      // If not found in live events list (e.g. it's a draft), try fetching directly from Supabase for admins
      if (!foundEvent) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (supabaseUrl && anonKey) {
            const res = await fetch(
              `${supabaseUrl}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=*`,
              {
                headers: {
                  apikey: anonKey,
                  Authorization: `Bearer ${anonKey}`,
                },
              }
            );
            if (res.ok) {
              const rows = await res.json();
              if (rows && rows[0]) {
                const r = rows[0];
                foundEvent = {
                  id: r.id,
                  organizer_id: r.organizer_id || 'org-1',
                  organizer_name: 'Organizer',
                  organizer_handle: 'organizer',
                  organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  organizer_brand_color: '#E8621A',
                  slug: r.slug,
                  title: r.title,
                  tagline: r.tagline || '',
                  description: r.description || '',
                  cover_image_url: r.cover_image_url,
                  template: r.template || 'grove',
                  theme: r.theme || { palette: 'forest', font: 'Inter + Fraunces', bg_style: 'texture', button_style: 'solid' },
                  sections: r.sections || { speakers: true, agenda: true, gallery: true, faq: true },
                  event_type: r.event_type || 'in-person',
                  location_name: r.location_name,
                  location_address: r.location_address,
                  city: r.city || 'Mumbai',
                  start_at: r.start_at,
                  end_at: r.end_at,
                  timezone: r.timezone || 'Asia/Kolkata',
                  capacity: r.capacity || 50,
                  is_public: r.is_public ?? false,
                  status: r.status || 'draft',
                  ai_generated: r.ai_generated || false,
                  faq: r.faq || [],
                  speakers: r.speakers || [],
                  agenda: r.agenda || [],
                  gallery: r.gallery || [],
                  rsvp_form_config: r.rsvp_form_config || { ask_plus_one: true, ask_dietary: true, waitlist_enabled: true },
                  whatsapp_caption: r.whatsapp_caption,
                  instagram_caption: r.instagram_caption,
                  source_type: r.source_type || 'native',
                  source_platform: r.source_platform || undefined,
                  external_ticket_url: r.external_ticket_url || undefined,
                  external_price_text: r.external_price_text || undefined,
                  confidence_score: r.confidence_score || undefined,
                  created_at: r.created_at,
                  updated_at: r.updated_at,
                };
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (foundEvent) {
        setEvent(foundEvent);
        setOrganizer(null);
        setLoading(false);
        return;
      }

      // 2. Check if it's an organizer handle
      const foundOrg = getOrganizerByHandle(slug);
      if (foundOrg) {
        setOrganizer(foundOrg);
        setOrganizerEvents(allEvents.filter((e) => e.organizer_id === foundOrg.id));
        setEvent(null);
        setLoading(false);
        return;
      }

      // Neither
      setEvent(null);
      setOrganizer(null);
      setLoading(false);
    };

    resolveSlug();
    syncEventsWithSupabase().then(() => resolveSlug()).catch(() => {});
    const unsub = subscribeToStore(resolveSlug);
    return () => unsub();
  }, [slug]);

  const handleAdminPublish = async () => {
    if (!event) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          updates: { status: 'live' },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to publish');
      }
      setEvent({ ...event, status: 'live', is_public: true });
      alert('🚀 Event verified and published live on Vibe!');
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render Event Page
  if (event) {
    const isDraft = event.status === 'draft';

    // If event is unverified/draft and viewer is NOT an admin, block access
    if (isDraft && !isAdmin) {
      return (
        <div className="min-h-screen bg-surface-2 flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
              Pending Admin Verification
            </h2>
            <p className="text-sm text-ink-muted max-w-md">
              &ldquo;{event.title}&rdquo; has been submitted to Vibe and is currently awaiting administrator review. It will be open for RSVPs once verified.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand text-white text-xs font-bold hover:bg-brand-mid shadow-sm"
            >
              <Compass className="w-4 h-4 text-accent" />
              <span>Browse Live Events</span>
            </Link>
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        {isDraft && isAdmin && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold uppercase tracking-wide text-amber-300">Admin Draft Preview:</span>
              <span>This event is awaiting admin verification before going live.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdminPublish}
                disabled={isPublishing}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPublishing ? 'Publishing...' : 'Verify & Publish Live'}</span>
              </button>
              <Link
                href="/admin/events"
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs transition"
              >
                Command Center ↗
              </Link>
            </div>
          </div>
        )}
        <Navbar />
        <UnifiedEventDetailView event={event} />
        <Footer />
      </div>
    );
  }

  // Render Organizer Profile Page
  if (organizer) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />
        <OrganizerProfileView organizer={organizer} events={organizerEvents} />
        <Footer />
      </div>
    );
  }

  // 404 Not Found State
  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <h2 className="font-display font-black text-3xl text-ink">Page Not Found</h2>
        <p className="text-sm text-ink-muted max-w-sm">
          The event or organizer profile you are looking for may have been moved or unpublished.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand text-white text-xs font-bold hover:bg-brand-mid shadow-sm"
        >
          <Compass className="w-4 h-4 text-accent" />
          <span>Browse Discover Feed</span>
        </Link>
      </div>
      <Footer />
    </div>
  );
}
