'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventTemplateView from '@/components/templates/EventTemplateView';
import OrganizerProfileView from '@/components/organizer/OrganizerProfileView';
import { getEvents, getOrganizerByHandle, subscribeToStore } from '@/lib/store';
import { EventItem, Profile } from '@/types';
import { Compass } from 'lucide-react';

interface EventSlugClientProps {
  slug: string;
}

export default function EventSlugClient({ slug }: EventSlugClientProps) {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [organizer, setOrganizer] = useState<Profile | null>(null);
  const [organizerEvents, setOrganizerEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const resolveSlug = () => {
      const allEvents = getEvents();

      // 1. Check if it's an event slug
      const foundEvent = allEvents.find(
        (e) => e.slug.toLowerCase() === slug.toLowerCase()
      );
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
    const unsub = subscribeToStore(resolveSlug);
    return () => unsub();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render Event Page
  if (event) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />
        <EventTemplateView event={event} />
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
