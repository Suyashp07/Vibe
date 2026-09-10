import { EventItem, Profile, RSVPItem, CommentItem, DatePoll, TemplateType, FollowerItem } from '@/types';

export const INITIAL_ORGANIZERS: Profile[] = [
  {
    id: 'org-1',
    role: 'organizer',
    name: 'Swaniki Studio',
    handle: 'swaniki',
    bio: 'Curating soulful gatherings, design salons, and thought-provoking cultural mixers across Mumbai and Bengaluru.',
    logo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    brand_color: '#E8621A',
    brand_font: 'Playfair Display',
    phone: '+919820011223',
    email: 'hello@swaniki.com',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'org-2',
    role: 'organizer',
    name: 'Bengaluru Pulse & Padel',
    handle: 'blr_pulse',
    bio: 'High energy sports, founder runs, sprint bootcamps and wellness meetups for makers.',
    logo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    brand_color: '#F97316',
    brand_font: 'Inter',
    phone: '+919845099881',
    email: 'crew@blrpulse.com',
    created_at: '2026-02-14T10:00:00Z',
  },
  {
    id: 'org-3',
    role: 'organizer',
    name: 'The Delhi Cultural Guild',
    handle: 'delhi_guild',
    bio: 'Intimate candlelight baithaks, poetry readings, and classical acoustic evenings.',
    logo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    brand_color: '#C9A84C',
    brand_font: 'Fraunces',
    phone: '+919811055443',
    email: 'contact@delhiguild.org',
    created_at: '2026-03-01T10:00:00Z',
  }
];

export const SAMPLE_TEMPLATE_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    organizer_id: 'org-1',
    organizer_name: 'Swaniki Studio',
    organizer_handle: 'swaniki',
    organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#E8621A',
    slug: 'design-and-chai-mumbai',
    title: 'Design & Chai: Mumbai Creatives Salon',
    tagline: 'An evening of typography, craft beers, cutting-edge UI, and honest conversation.',
    description: 'Join us atop the breezy terrace of Subko Bandra for an unfiltered conversation on shaping modern consumer interfaces in India. We will dive deep into design craft, font pairing, visceral micro-interactions, and building brands that resonate globally while staying rooted in Indian culture.\n\nWhether you are an engineer passionate about visual polish, a product designer, or an indie founder, grab a cup of pour-over coffee or spiced masala chai and join Mumbai’s sharpest creators.',
    cover_image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    template: 'grove',
    theme: {
      palette: 'forest',
      font: 'Inter + Fraunces',
      bg_style: 'texture',
      button_style: 'solid',
      custom_accent: '#2D5A27'
    },
    sections: {
      speakers: true,
      agenda: true,
      gallery: true,
      faq: true
    },
    event_type: 'in-person',
    location_name: 'Subko Specialty Coffee & Craftery',
    location_address: '2-B, Perry Cross Rd, Bandra West, Mumbai, Maharashtra 400050',
    city: 'Mumbai',
    start_at: '2026-09-19T18:30:00+05:30',
    end_at: '2026-09-19T21:30:00+05:30',
    timezone: 'Asia/Kolkata',
    capacity: 45,
    is_public: true,
    status: 'live',
    ai_generated: true,
    faq: [
      { q: 'Is there an entry fee?', a: 'No, this edition is completely free courtesy of Swaniki Studio. Beverage vouchers will be provided upon arrival.' },
      { q: 'Can I bring a friend or colleague?', a: 'Yes! Make sure to mention their name in the +1 section when RSVPing.' },
      { q: 'Is parking available at the venue?', a: 'Valet parking is limited. We strongly recommend taking an auto or cab.' }
    ],
    speakers: [
      { id: 'sp-1', name: 'Aarav Singhania', role: 'Head of Design', company: 'Prism Labs', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80' },
      { id: 'sp-2', name: 'Priya Narang', role: 'Staff Product Designer', company: 'Kite Studio', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80' }
    ],
    agenda: [
      { id: 'ag-1', time: '6:30 PM', title: 'Arrival & Welcome Chai', description: 'Check-in, grab coffee/chai, and casual mixer.' },
      { id: 'ag-2', time: '7:15 PM', title: 'Fireside: Editorial Warmth in Indian Apps', description: 'Tactical walkthrough of micro-interactions and typographic hierarchy.' },
      { id: 'ag-3', time: '8:15 PM', title: 'Open Portfolio Teardowns & Terrace Networking', description: 'Peer critiques and open terrace discussions.' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80'
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: true,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Your spot is confirmed! Check WhatsApp for venue entry passes.',
      custom_fields: [
        { id: 'cf-portfolio', label: 'Portfolio or Twitter / X link', type: 'text', required: false }
      ]
    },
    whatsapp_caption: '☕ Mumbai Design & Chai is back on Sep 19 at Subko Bandra! Free entry, rooftop vibes, and unfiltered conversations with top designers. RSVP now before spots fill up!',
    instagram_caption: 'Nights in Mumbai, conversations over pour-overs. Join us for Design & Chai at Subko Bandra on Saturday, Sep 19. Link in bio to RSVP. #MumbaiDesign #Subko #Swaniki #IndianDesigners #MumbaiEvents',
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-08T12:00:00Z'
  },
  {
    id: 'evt-2',
    organizer_id: 'org-2',
    organizer_name: 'Bengaluru Pulse & Padel',
    organizer_handle: 'blr_pulse',
    organizer_logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#E8621A',
    slug: 'bangalore-sunrise-10k-padel',
    title: 'Sunrise 10K Run & Founder Padel Tournament',
    tagline: 'Lace up at dawn, crush 10K through Cubbon Park, then hit the glass courts.',
    description: 'Break out of your desk rut. We start with a scenic 10K pace run through the tranquil green tunnels of Cubbon Park, led by certified pacers (5:30 min/km and 6:30 min/km groups).\n\nPost-run, we head directly to Play Arena for an adrenaline-fueled round-robin Padel tournament, high-protein breakfast bowls, and electrolyte hydration bars.',
    cover_image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
    template: 'sprint',
    theme: {
      palette: 'volt',
      font: 'Cal Sans + Inter',
      bg_style: 'solid',
      button_style: 'pill',
      custom_accent: '#E8621A'
    },
    sections: {
      speakers: false,
      agenda: true,
      gallery: true,
      faq: true
    },
    event_type: 'in-person',
    location_name: 'Cubbon Park (Queen Victoria Statue)',
    location_address: 'Kasturba Road, Sampangi Rama Nagara, Bengaluru, Karnataka 560001',
    city: 'Bengaluru',
    start_at: '2026-09-20T06:00:00+05:30',
    end_at: '2026-09-20T10:30:00+05:30',
    timezone: 'Asia/Kolkata',
    capacity: 35,
    is_public: true,
    status: 'live',
    ai_generated: true,
    faq: [
      { q: 'Is this beginner friendly?', a: 'Yes! We have two distinct pace groups (fast and easy jog/walk combo).' },
      { q: 'Do I need my own Padel racket?', a: 'Rackets and tournament balls are provided on-site.' },
      { q: 'Where do we keep bags?', a: 'A secure gear vehicle will accompany us from Cubbon Park to the courts.' }
    ],
    agenda: [
      { id: 'ag-b1', time: '6:00 AM', title: 'Warm-up & Dynamic Stretches', description: 'Meet at Queen Victoria statue, Cubbon Park.' },
      { id: 'ag-b2', time: '6:15 AM', title: '10K Pace Run', description: 'Shaded loops through Cubbon Park.' },
      { id: 'ag-b3', time: '7:45 AM', title: 'Padel Tournament & Breakfast Bowls', description: 'Round-robin doubles followed by acai & fruit bowls.' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80'
    ],
    rsvp_form_config: {
      ask_plus_one: false,
      ask_dietary: true,
      ask_tshirt: true,
      waitlist_enabled: true,
      confirmation_message: 'Padel court slot reserved! Check your email for runner bib numbers.',
      custom_fields: [
        { id: 'cf-pace', label: 'Expected 10K finish time', type: 'dropdown', options: ['Under 50 mins', '50-60 mins', '60+ mins / First timer'], required: true }
      ]
    },
    whatsapp_caption: '🏃 Sunrise 10K + Founder Padel is on this Sunday in Bengaluru! 6:00 AM at Cubbon Park. Only 8 slots left!',
    instagram_caption: 'Earn your Sunday breakfast. 10K sunrise loops through Cubbon Park + founder Padel matches. RSVP link in bio. #BengaluruRunners #CubbonPark #PadelIndia #BangaloreFitness',
    created_at: '2026-09-02T10:00:00Z',
    updated_at: '2026-09-08T14:00:00Z'
  },
  {
    id: 'evt-3',
    organizer_id: 'org-3',
    organizer_name: 'The Delhi Cultural Guild',
    organizer_handle: 'delhi_guild',
    organizer_logo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#C9A84C',
    slug: 'noor-rooftop-soiree-delhi',
    title: 'Noor: Sunset Rooftop Soirée & Urdu Poetry',
    tagline: 'Warm amber glow, acoustic sitar, and contemporary Urdu nazms overlooking Delhi.',
    description: 'As twilight blankets the city, gather under fairy lights on a private haveli rooftop in Hauz Khas. Noor brings together classical acoustic instrumentalists and contemporary poets celebrating love, longing, and Indian monsoon aesthetics.\n\nSip on chilled rose-infused sherbets and bespoke botanical mocktails while losing yourself in raw, soulful verses.',
    cover_image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
    template: 'bloom',
    theme: {
      palette: 'dusty-rose',
      font: 'Playfair + Inter',
      bg_style: 'gradient',
      button_style: 'pill',
      custom_accent: '#C9A84C'
    },
    sections: {
      speakers: true,
      agenda: true,
      gallery: false,
      faq: true
    },
    event_type: 'in-person',
    location_name: 'The Haveli Terrace, Hauz Khas Village',
    location_address: 'Hauz Khas Village, New Delhi, Delhi 110016',
    city: 'New Delhi',
    start_at: '2026-09-26T17:30:00+05:30',
    end_at: '2026-09-26T21:00:00+05:30',
    timezone: 'Asia/Kolkata',
    capacity: 50,
    is_public: true,
    status: 'live',
    ai_generated: true,
    faq: [
      { q: 'Is there floor seating or chairs?', a: 'Traditional baithak style low seating with bolsters and cushions, with limited chairs for elders.' },
      { q: 'Are refreshments included?', a: 'Yes, artisanal artisanal appetizers and chilled drinks will be served.' }
    ],
    speakers: [
      { id: 'sp-d1', name: 'Zoya Siddiqui', role: 'Contemporary Poet & Author', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80' },
      { id: 'sp-d2', name: 'Ustad Farhan Khan', role: 'Sitar Virtuoso', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80' }
    ],
    agenda: [
      { id: 'ag-d1', time: '5:30 PM', title: 'Sunset Welcome & Sitar Ragas', description: 'Golden hour viewing over the lake.' },
      { id: 'ag-d2', time: '6:45 PM', title: 'Urdu Nazms & Poetry Recital', description: 'Curated readings followed by audience open mic.' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: true,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Your candlelit seat is confirmed. Directions sent to WhatsApp.',
    },
    whatsapp_caption: '✨ Noor: Candlelit Urdu Poetry & Sunset Sitar in Hauz Khas on Sep 26. Limited seats for an intimate evening.',
    instagram_caption: 'When words whisper to the twilight sky. Noor returns to Hauz Khas this September. Reserve your baithak seat via link in bio. #DelhiPoetry #HauzKhas #UrduNazms #DelhiCulture',
    created_at: '2026-09-03T11:00:00Z',
    updated_at: '2026-09-08T15:00:00Z'
  },
  {
    id: 'evt-4',
    organizer_id: 'org-1',
    organizer_name: 'Swaniki Studio',
    organizer_handle: 'swaniki',
    organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#1A1A2E',
    slug: 'ai-and-scale-founders-summit',
    title: 'AI & Scale: NextGen Founders Summit',
    tagline: 'High-density insights on building profitable AI micro-SaaS and agentic workflows.',
    description: 'A no-BS summit for engineers and builders scaling beyond toy wrappers. We gather 80 top technical founders and AI researchers in Whitefield to share production lessons in multi-agent orchestration, local SLM inference, and zero-cac distribution.',
    cover_image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    template: 'vertex',
    theme: {
      palette: 'deep-navy',
      font: 'Inter + Inter',
      bg_style: 'solid',
      button_style: 'solid',
      custom_accent: '#1A1A2E'
    },
    sections: {
      speakers: true,
      agenda: true,
      gallery: false,
      faq: true
    },
    event_type: 'hybrid',
    location_name: 'The Hive Collaborative Workspace',
    location_address: 'VR Bengaluru, Whitefield Main Rd, Bengaluru, Karnataka 560048',
    city: 'Bengaluru',
    online_link: 'https://meet.google.com/xyz-swaniki-demo',
    start_at: '2026-10-03T10:00:00+05:30',
    end_at: '2026-10-03T17:00:00+05:30',
    timezone: 'Asia/Kolkata',
    capacity: 80,
    is_public: true,
    status: 'live',
    ai_generated: true,
    faq: [
      { q: 'Can I attend virtually?', a: 'Yes! Select the Hybrid/Virtual option when completing your RSVP to receive the secure livestream link.' },
      { q: 'Will session recordings be published?', a: 'Only confirmed attendees receive high-res recording links and speaker decks.' }
    ],
    speakers: [
      { id: 'sp-v1', name: 'Dr. Nikhil Kulkarni', role: 'Principal AI Scientist', company: 'Nexus AI', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
      { id: 'sp-v2', name: 'Tanvi Agarwal', role: 'Founder & CEO', company: 'Hyperflow', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80' }
    ],
    agenda: [
      { id: 'ag-v1', time: '10:00 AM', title: 'Opening Keynote: The Post-API Agent Economy', description: 'Deconstructing autonomous workflows and autonomous revenue models.' },
      { id: 'ag-v2', time: '12:00 PM', title: 'Live Architecture Teardown: Realtime Rag & Vector DBs', description: 'Zero-latency retrieval patterns.' }
    ],
    rsvp_form_config: {
      ask_plus_one: false,
      ask_dietary: true,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Pass issued! Check email for Google Calendar sync and venue badge code.',
      custom_fields: [
        { id: 'cf-gh', label: 'GitHub or LinkedIn profile', type: 'text', required: true }
      ]
    },
    whatsapp_caption: '⚡ NextGen AI Founders Summit in Bengaluru: Oct 3 at The Hive Whitefield. 80 builders, technical deep dives, zero sponsor fluff.',
    instagram_caption: 'Scaling AI beyond prototypes. Join 80 technical founders in Bengaluru on Oct 3. In-person and hybrid streaming passes now available. #AIFounders #BengaluruTech #Swaniki #NextGenSaaS',
    created_at: '2026-09-04T09:00:00Z',
    updated_at: '2026-09-08T11:00:00Z'
  },
  {
    id: 'evt-5',
    organizer_id: 'org-1',
    organizer_name: 'Swaniki Studio',
    organizer_handle: 'swaniki',
    organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#E8621A',
    slug: 'goa-sunset-ambient-mixer',
    title: 'Ember: Goa Sunset Ambient & Culinary Mixer',
    tagline: 'Clay oven flatbreads, ambient synthesizers, and coastal conversations.',
    description: 'An intimate gathering tucked away in the banyan groves of Anjuna. As the Arabian sea catches the golden light, experience ambient modular soundscapes accompanied by woodfired artisanal plates and local craft infusions.\n\nDesigned for artists, musicians, writers, and nomadic founders who value unhurried presence and meaningful fellowship.',
    cover_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    template: 'ember',
    theme: {
      palette: 'terracotta',
      font: 'Fraunces + Inter',
      bg_style: 'texture',
      button_style: 'solid',
      custom_accent: '#C85A32'
    },
    sections: {
      speakers: false,
      agenda: true,
      gallery: true,
      faq: true
    },
    event_type: 'in-person',
    location_name: 'The Banyan Haven',
    location_address: 'St. Michael Vaddo, Anjuna, Goa 403509',
    city: 'Goa',
    start_at: '2026-10-10T16:30:00+05:30',
    end_at: '2026-10-10T22:00:00+05:30',
    timezone: 'Asia/Kolkata',
    capacity: 40,
    is_public: true,
    status: 'live',
    ai_generated: true,
    faq: [
      { q: 'Is transportation arranged?', a: 'Shared airport shuttles from MOPA and Dabolim will be coordinated in the private WhatsApp group.' }
    ],
    agenda: [
      { id: 'ag-e1', time: '4:30 PM', title: 'Acoustic Soundcheck & Coconut Water Welcome', description: 'Relaxed garden arrivals.' },
      { id: 'ag-e2', time: '6:00 PM', title: 'Golden Hour Modular Ambient Set', description: 'Live synthesizer soundscapes under the banyan canopy.' }
    ],
    gallery: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80'
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: true,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Your Goa retreat pass is confirmed! Check WhatsApp for directions.',
    },
    whatsapp_caption: '🌴 Ember Goa Sunset Mixer: Oct 10 in Anjuna. Ambient soundscapes, clay ovens, coastal vibes. RSVP link inside!',
    instagram_caption: 'Under the Anjuna banyans. A slow evening of culinary craft and warm analog music. Reserve your Goa pass via link in bio. #GoaEvents #Swaniki #AmbientGoa #AnjunaVibes',
    created_at: '2026-09-05T12:00:00Z',
    updated_at: '2026-09-08T10:00:00Z'
  }
];

export const INITIAL_EVENTS: EventItem[] = [];

export const STATIC_EVENT_IDS = new Set([
  'evt-1',
  'evt-2',
  'evt-3',
  'evt-4',
  'evt-5',
  'design-and-chai-mumbai',
  'bangalore-sunrise-10k-padel',
  'noor-rooftop-soiree-delhi',
  'ai-and-scale-founders-summit',
  'goa-sunset-ambient-mixer'
]);

export const INITIAL_RSVPS: RSVPItem[] = [];

export const INITIAL_COMMENTS: CommentItem[] = [];

export const INITIAL_DATE_POLLS: DatePoll[] = [];

export const INITIAL_FOLLOWS: FollowerItem[] = [];

// Helper to check if running in browser
const isClient = typeof window !== 'undefined';

// Store keys for LocalStorage
const STORAGE_KEYS = {
  EVENTS: 'vibe_events_v1',
  RSVPS: 'vibe_rsvps_v1',
  COMMENTS: 'vibe_comments_v1',
  POLLS: 'vibe_polls_v1',
  ORGANIZERS: 'vibe_organizers_v1',
  FOLLOWS: 'vibe_follows_v1',
  USER: 'vibe_current_user_v1'
};

// Simple event-emitter for real-time live counter updates across components
type StoreListener = () => void;
const listeners: Set<StoreListener> = new Set();

export const subscribeToStore = (listener: StoreListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(fn => fn());
};

// Data access operations
export const getEvents = (): EventItem[] => {
  if (!isClient) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
  const deletedList: string[] = JSON.parse(localStorage.getItem('vibe_deleted_events') || '[]');
  const deletedSet = new Set(deletedList);

  if (!stored) {
    return [];
  }
  try {
    const parsed: EventItem[] = JSON.parse(stored);
    const cleaned = parsed.filter(
      e => !STATIC_EVENT_IDS.has(e.id) && !STATIC_EVENT_IDS.has(e.slug) && !deletedSet.has(e.id) && !deletedSet.has(e.slug)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
};


export const getEventBySlug = (slug: string): EventItem | undefined => {
  const events = getEvents();
  const found = events.find(e => e.slug.toLowerCase() === slug.toLowerCase());
  if (found) return found;
  return SAMPLE_TEMPLATE_EVENTS.find(e => e.slug.toLowerCase() === slug.toLowerCase());
};

import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export const saveEvent = async (event: EventItem) => {
  if (isClient) {
    const events = getEvents();
    const index = events.findIndex(e => e.id === event.id || e.slug === event.slug);
    if (index >= 0) {
      events[index] = { ...event, updated_at: new Date().toISOString() };
    } else {
      events.unshift(event);
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    notifyListeners();
  }

  // Supabase PostgreSQL sync
  const client = getSupabaseClient();
  if (client) {
    try {
      const isUUID = Boolean(event.organizer_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.organizer_id));
      await client.from('events').upsert({
        id: event.id.startsWith('evt-') ? undefined : event.id,
        organizer_id: isUUID ? event.organizer_id : undefined,
        slug: event.slug,
        title: event.title,
        tagline: event.tagline,
        description: event.description,
        cover_image_url: event.cover_image_url,
        template: event.template,
        theme: event.theme,
        sections: event.sections,
        event_type: event.event_type,
        location_name: event.location_name,
        location_address: event.location_address,
        city: event.city,
        start_at: event.start_at,
        end_at: event.end_at,
        timezone: event.timezone,
        capacity: event.capacity,
        is_public: event.is_public,
        status: event.status,
        ai_generated: event.ai_generated,
        faq: event.faq,
        rsvp_form_config: event.rsvp_form_config,
        whatsapp_caption: event.whatsapp_caption,
        instagram_caption: event.instagram_caption,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase sync skipped, stored locally:', e);
    }
  }
};

export const deleteEvent = async (id: string, slug?: string): Promise<boolean> => {
  if (isClient) {
    const deletedList: string[] = JSON.parse(localStorage.getItem('vibe_deleted_events') || '[]');
    if (id) deletedList.push(id);
    if (slug) deletedList.push(slug);
    localStorage.setItem('vibe_deleted_events', JSON.stringify(Array.from(new Set(deletedList))));

    const current = getEvents();
    const updated = current.filter(e => e.id !== id && (!slug || e.slug !== slug));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated));
    notifyListeners();
  }

  try {
    const res = await fetch('/api/events/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, slug })
    });
    const json = await res.json();
    if (json.success) {
      // Re-sync after successful remote delete
      syncEventsWithSupabase().catch(() => {});
      return true;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete event via API:', err);
    return true;
  }
};

export const syncEventsWithSupabase = async (): Promise<EventItem[]> => {
  try {
    const res = await fetch(`/api/events/list?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (!res.ok) return getEvents();
    const { events: remoteEvents } = await res.json();
    if (!Array.isArray(remoteEvents)) return getEvents();

    const remoteSlugs = new Set(remoteEvents.map((r: any) => r.slug));
    const remoteIds = new Set(remoteEvents.map((r: any) => r.id));

    // Convert remote events to EventItem
    const formattedRemote: EventItem[] = remoteEvents.map((row: any) => {
      const orgProfile = row.profiles || {};
      return {
        id: row.id,
        organizer_id: row.organizer_id || orgProfile.id || 'org-1',
        organizer_name: orgProfile.name || row.organizer_name || 'Organizer',
        organizer_handle: orgProfile.handle || row.organizer_handle || 'organizer',
        organizer_logo: orgProfile.logo_url || row.organizer_logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        organizer_brand_color: orgProfile.brand_color || row.organizer_brand_color || '#E8621A',
        slug: row.slug,
        title: row.title,
        tagline: row.tagline || '',
        description: row.description || '',
        cover_image_url: row.cover_image_url,
        template: row.template || 'grove',
        theme: row.theme || { palette: 'forest', font: 'Inter + Fraunces', bg_style: 'texture', button_style: 'solid' },
        sections: row.sections || { speakers: true, agenda: true, gallery: true, faq: true },
        event_type: row.event_type || 'in-person',
        location_name: row.location_name,
        location_address: row.location_address,
        city: row.city || 'Mumbai',
        start_at: row.start_at,
        end_at: row.end_at,
        timezone: row.timezone || 'Asia/Kolkata',
        capacity: row.capacity || 50,
        is_public: row.is_public ?? true,
        status: row.status || 'live',
        ai_generated: row.ai_generated || false,
        faq: row.faq || [],
        speakers: row.speakers || [],
        agenda: row.agenda || [],
        gallery: row.gallery || [],
        rsvp_form_config: row.rsvp_form_config || { ask_plus_one: true, ask_dietary: true, waitlist_enabled: true },
        whatsapp_caption: row.whatsapp_caption,
        instagram_caption: row.instagram_caption,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    const deletedList: string[] = isClient ? JSON.parse(localStorage.getItem('vibe_deleted_events') || '[]') : [];
    const deletedSet = new Set(deletedList);

    // Only keep live remote events, strictly excluding any legacy static demo events or deleted events
    const merged = formattedRemote.filter(
      e => !STATIC_EVENT_IDS.has(e.id) && !STATIC_EVENT_IDS.has(e.slug) && !deletedSet.has(e.id) && !deletedSet.has(e.slug)
    );

    if (isClient) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(merged));
      notifyListeners();
    }
    return merged;
  } catch (err) {
    console.warn('Failed to sync events with Supabase:', err);
    return getEvents();
  }
};


export const getRSVPs = (): RSVPItem[] => {
  if (!isClient) return INITIAL_RSVPS;
  const stored = localStorage.getItem(STORAGE_KEYS.RSVPS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(INITIAL_RSVPS));
    return INITIAL_RSVPS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_RSVPS;
  }
};

export const getEventRSVPs = (eventIdOrSlug: string): RSVPItem[] => {
  const all = getRSVPs();
  return all.filter(r => r.event_id === eventIdOrSlug || r.event_slug === eventIdOrSlug);
};
export const getRSVPsByEvent = getEventRSVPs;

export const addRSVP = (rsvp: Omit<RSVPItem, 'id' | 'created_at'>): RSVPItem => {
  const newRsvp: RSVPItem = {
    ...rsvp,
    id: `r-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  if (isClient) {
    const all = getRSVPs();
    all.unshift(newRsvp);
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(all));
    notifyListeners();
  }

  // Persist to Supabase via server API route
  if (typeof window !== 'undefined') {
    fetch('/api/rsvps/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvp)
    })
      .then(res => res.json())
      .then(data => {
        if (data?.rsvp?.id) {
          const current = getRSVPs();
          const mapped = current.map(r => r.id === newRsvp.id ? { ...r, id: data.rsvp.id, event_id: data.rsvp.event_id } : r);
          localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(mapped));
          notifyListeners();
        }
      })
      .catch(err => console.warn('Note on /api/rsvps/create:', err));
  }

  return newRsvp;
};

export const syncRSVPsWithSupabase = async (): Promise<RSVPItem[]> => {
  if (!isClient) return getRSVPs();
  try {
    const res = await fetch('/api/rsvps/list', { cache: 'no-store' });
    if (!res.ok) return getRSVPs();
    const data = await res.json();
    if (!data?.rsvps || !Array.isArray(data.rsvps)) return getRSVPs();

    const remoteRsvps: RSVPItem[] = data.rsvps.map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      event_slug: row.events?.slug || '',
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      status: row.status || 'confirmed',
      plus_one_name: row.plus_one_name || undefined,
      dietary: row.custom_responses?.dietary,
      tshirt_size: row.custom_responses?.tshirt,
      custom_responses: row.custom_responses || {},
      created_at: row.created_at || new Date().toISOString()
    }));

    // Merge remote RSVPs with any pending local RSVPs without duplicating
    const local = getRSVPs();
    const mergedMap = new Map<string, RSVPItem>();

    remoteRsvps.forEach(r => {
      mergedMap.set(r.id, r);
    });

    local.forEach(l => {
      const alreadyExists = remoteRsvps.some(
        r => r.id === l.id || (r.event_id === l.event_id && r.email?.toLowerCase() === l.email?.toLowerCase())
      );
      if (!alreadyExists) {
        mergedMap.set(l.id, l);
      }
    });

    const merged = Array.from(mergedMap.values());
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(merged));
    notifyListeners();
    return merged;
  } catch (err) {
    console.warn('syncRSVPsWithSupabase note:', err);
    return getRSVPs();
  }
};

export const updateRSVPStatus = (rsvpId: string, status: 'confirmed' | 'waitlisted' | 'cancelled') => {
  if (!isClient) return;
  const all = getRSVPs();
  const updated = all.map(r => r.id === rsvpId ? { ...r, status } : r);
  localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(updated));
  notifyListeners();
};

export const approveWaitlistGuest = (rsvpId: string) => {
  updateRSVPStatus(rsvpId, 'confirmed');
};

export const rejectWaitlistGuest = (rsvpId: string) => {
  updateRSVPStatus(rsvpId, 'cancelled');
};

export const approveAllWaitlist = (eventId?: string) => {
  if (!isClient) return;
  const all = getRSVPs();
  const updated = all.map(r => {
    if (r.status === 'waitlisted' && (!eventId || r.event_id === eventId)) {
      return { ...r, status: 'confirmed' as const };
    }
    return r;
  });
  localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(updated));
  notifyListeners();
};

export const cancelRSVP = (rsvpId: string) => {
  updateRSVPStatus(rsvpId, 'cancelled');
};

export const getComments = (eventId: string): CommentItem[] => {
  if (!isClient) return INITIAL_COMMENTS.filter(c => c.event_id === eventId);
  const stored = localStorage.getItem(STORAGE_KEYS.COMMENTS);
  const all: CommentItem[] = stored ? JSON.parse(stored) : INITIAL_COMMENTS;
  return all.filter(c => c.event_id === eventId);
};

export const addComment = (eventId: string, authorName: string, authorEmail: string, body: string): CommentItem => {
  const newComment: CommentItem = {
    id: `c-${Date.now()}`,
    event_id: eventId,
    author_name: authorName,
    author_email: authorEmail,
    author_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`,
    body,
    created_at: new Date().toISOString()
  };
  if (isClient) {
    const stored = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const all: CommentItem[] = stored ? JSON.parse(stored) : INITIAL_COMMENTS;
    all.unshift(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));
    notifyListeners();
  }
  return newComment;
};

export const getDatePolls = (): DatePoll[] => {
  if (!isClient) return INITIAL_DATE_POLLS;
  const stored = localStorage.getItem(STORAGE_KEYS.POLLS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(INITIAL_DATE_POLLS));
    return INITIAL_DATE_POLLS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_DATE_POLLS;
  }
};

export const getDatePollBySlug = (slug: string): DatePoll | undefined => {
  const polls = getDatePolls();
  return polls.find(p => p.slug.toLowerCase() === slug.toLowerCase());
};

export const getDatePollsByOrganizer = (organizerIdOrHandle: string): DatePoll[] => {
  const polls = getDatePolls();
  const target = organizerIdOrHandle.toLowerCase();
  return polls.filter(p =>
    (p.organizer_id && p.organizer_id.toLowerCase() === target) ||
    (p.organizer_handle && p.organizer_handle.toLowerCase() === target)
  );
};

export const syncDatePollsWithSupabase = async (): Promise<DatePoll[]> => {
  if (!isClient) return getDatePolls();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
      return getDatePolls();
    }
    const res = await fetch(`${supabaseUrl}/rest/v1/date_polls?select=*,profiles:organizer_id(id,name,handle,avatar_url)&order=created_at.desc`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        const local = getDatePolls();
        const synced: DatePoll[] = rows.map(r => ({
          id: r.id,
          organizer_id: r.organizer_id || '',
          organizer_name: r.profiles?.name || 'Community Organizer',
          organizer_handle: r.profiles?.handle || 'host',
          title: r.title,
          slug: r.slug,
          description: r.description || '',
          options: Array.isArray(r.options) ? r.options : [],
          created_at: r.created_at
        }));
        const merged = [...synced];
        local.forEach(lp => {
          if (!merged.some(mp => mp.slug.toLowerCase() === lp.slug.toLowerCase() || mp.id === lp.id)) {
            merged.push(lp);
          }
        });
        localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(merged));
        notifyListeners();
        return merged;
      }
    }
  } catch (e) {
    console.warn('Error syncing date polls with Supabase:', e);
  }
  return getDatePolls();
};

export const fetchDatePollBySlug = async (slug: string): Promise<DatePoll | undefined> => {
  const localPoll = getDatePollBySlug(slug);
  if (localPoll) return localPoll;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')) {
      const res = await fetch(`${supabaseUrl}/rest/v1/date_polls?slug=eq.${encodeURIComponent(slug)}&select=*,profiles:organizer_id(id,name,handle,avatar_url)&limit=1`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows?.[0]) {
          const r = rows[0];
          const poll: DatePoll = {
            id: r.id,
            organizer_id: r.organizer_id || '',
            organizer_name: r.profiles?.name || 'Community Organizer',
            organizer_handle: r.profiles?.handle || 'host',
            title: r.title,
            slug: r.slug,
            description: r.description || '',
            options: Array.isArray(r.options) ? r.options : [],
            created_at: r.created_at
          };
          if (isClient) {
            const current = getDatePolls();
            if (!current.some(p => p.slug.toLowerCase() === poll.slug.toLowerCase())) {
              current.unshift(poll);
              localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(current));
              notifyListeners();
            }
          }
          return poll;
        }
      }
    }
  } catch (e) {
    console.warn('Error fetching date poll by slug:', e);
  }
  return undefined;
};

export const voteDatePoll = async (slug: string, optionId: string, email: string) => {
  if (!isClient) return;
  const polls = getDatePolls();
  const poll = polls.find(p => p.slug.toLowerCase() === slug.toLowerCase());
  if (!poll) return;

  poll.options.forEach(opt => {
    if (opt.id === optionId) {
      if (!opt.votes.includes(email)) {
        opt.votes.push(email);
      }
    } else {
      // remove vote from other options if single vote preference
      opt.votes = opt.votes.filter(v => v !== email);
    }
  });

  localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(polls));
  notifyListeners();

  // Background sync to Supabase public.date_polls
  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    if (client) {
      await client.from('date_polls').update({ options: poll.options }).eq('slug', slug);
    }
  } catch (e) {
    console.warn('Could not sync vote to Supabase:', e);
  }
};

export const saveDatePoll = async (poll: DatePoll): Promise<DatePoll> => {
  if (!isClient) return poll;
  const polls = getDatePolls();
  const existingIndex = polls.findIndex(p => p.id === poll.id || p.slug.toLowerCase() === poll.slug.toLowerCase());
  if (existingIndex >= 0) {
    polls[existingIndex] = poll;
  } else {
    polls.unshift(poll);
  }
  localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(polls));
  notifyListeners();

  // Background sync to Supabase public.date_polls
  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    if (client) {
      await client.from('date_polls').upsert({
        organizer_id: poll.organizer_id || null,
        title: poll.title,
        slug: poll.slug,
        description: poll.description || '',
        options: poll.options,
        created_at: poll.created_at || new Date().toISOString()
      }, { onConflict: 'slug' });
    }
  } catch (e) {
    console.warn('Could not sync date poll to Supabase:', e);
  }

  return poll;
};

export const deleteDatePoll = async (pollId: string) => {
  if (!isClient) return;
  const polls = getDatePolls().filter(p => p.id !== pollId);
  localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(polls));
  notifyListeners();

  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    if (client) {
      await client.from('date_polls').delete().eq('id', pollId);
    }
  } catch (e) {
    console.warn('Could not delete poll from Supabase:', e);
  }
};

export const getOrganizers = (): Profile[] => {
  if (!isClient) return INITIAL_ORGANIZERS;
  const stored = localStorage.getItem(STORAGE_KEYS.ORGANIZERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.ORGANIZERS, JSON.stringify(INITIAL_ORGANIZERS));
    return INITIAL_ORGANIZERS;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ORGANIZERS;
  } catch {
    return INITIAL_ORGANIZERS;
  }
};

export const saveOrganizer = (organizer: Profile) => {
  if (!isClient) return;
  const list = getOrganizers();
  const existingIdx = list.findIndex(
    o => (organizer.id && o.id === organizer.id) ||
         (organizer.handle && o.handle.toLowerCase() === organizer.handle.toLowerCase())
  );
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...organizer };
  } else {
    list.unshift(organizer);
  }
  localStorage.setItem(STORAGE_KEYS.ORGANIZERS, JSON.stringify(list));
  notifyListeners();
};

export const getOrganizerByHandle = (handle: string): Profile | undefined => {
  const organizers = getOrganizers();
  return organizers.find(o => o.handle.toLowerCase() === handle.toLowerCase());
};

// Utilities for formatting & calendar
export const formatIST = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch {
    return dateStr;
  }
};

export const generateGoogleCalendarUrl = (event: EventItem): string => {
  const startDate = new Date(event.start_at || Date.now());
  const endDate = event.end_at ? new Date(event.end_at) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const startTime = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endTime = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Event',
    dates: `${startTime}/${endTime}`,
    details: `${event.tagline || ''}\n\n${event.description || ''}\n\nHosted on Vibe by Swaniki`,
    location: event.event_type === 'online' ? (event.online_link || 'Online') : (event.location_address || event.location_name || event.city || 'India'),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const generateICSFile = (event: EventItem): string => {
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const startDate = new Date(event.start_at || Date.now());
  const endDate = event.end_at ? new Date(event.end_at) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const location = event.event_type === 'online' ? (event.online_link || 'Online') : (event.location_address || event.location_name || event.city || 'India');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vibe by Swaniki//Event Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id || 'evt'}@vibe.swaniki.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title || 'Event'}`,
    `DESCRIPTION:${(event.tagline || '')}\\n\\n${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

export const downloadICS = (event: EventItem) => {
  const icsData = generateICSFile(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.slug}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// =========================================================
// DYNAMIC FOLLOWS & COMMUNITY SYSTEM
// =========================================================

export const getFollows = (): FollowerItem[] => {
  if (!isClient) return INITIAL_FOLLOWS;
  const stored = localStorage.getItem(STORAGE_KEYS.FOLLOWS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(INITIAL_FOLLOWS));
    return INITIAL_FOLLOWS;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : INITIAL_FOLLOWS;
  } catch {
    return INITIAL_FOLLOWS;
  }
};

export const getFollowers = (organizerIdOrHandle: string): FollowerItem[] => {
  if (!organizerIdOrHandle) return [];
  const all = getFollows();
  const query = organizerIdOrHandle.toLowerCase().trim();
  return all.filter(f =>
    (f.organizer_id && f.organizer_id.toLowerCase() === query) ||
    (f.organizer_handle && f.organizer_handle.toLowerCase() === query)
  );
};

export const getFollowerCount = (organizerIdOrHandle: string): number => {
  return getFollowers(organizerIdOrHandle).length;
};

export const isUserFollowing = (organizerIdOrHandle: string, emailOrId?: string): boolean => {
  if (!organizerIdOrHandle || !emailOrId) return false;
  const followers = getFollowers(organizerIdOrHandle);
  const q = emailOrId.toLowerCase().trim();
  return followers.some(f =>
    (f.follower_email && f.follower_email.toLowerCase() === q) ||
    (f.follower_id && f.follower_id.toLowerCase() === q)
  );
};

export const followOrganizer = (data: {
  organizer_id: string;
  organizer_handle?: string;
  follower_id?: string;
  follower_name: string;
  follower_email: string;
  follower_avatar?: string;
}): { success: boolean; isFollowing: boolean; count: number } => {
  if (!isClient) return { success: false, isFollowing: false, count: 0 };
  const all = getFollows();
  const emailClean = data.follower_email.toLowerCase().trim();
  const orgKey = (data.organizer_handle || data.organizer_id).toLowerCase().trim();

  // Check if already following
  const existingIdx = all.findIndex(f =>
    ((data.organizer_id && f.organizer_id.toLowerCase() === data.organizer_id.toLowerCase()) ||
     (data.organizer_handle && f.organizer_handle?.toLowerCase() === data.organizer_handle.toLowerCase())) &&
    ((f.follower_email && f.follower_email.toLowerCase() === emailClean) ||
     (data.follower_id && f.follower_id === data.follower_id))
  );

  if (existingIdx >= 0) {
    return {
      success: true,
      isFollowing: true,
      count: getFollowerCount(orgKey)
    };
  }

  const newFollow: FollowerItem = {
    id: `fol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organizer_id: data.organizer_id,
    organizer_handle: data.organizer_handle || '',
    follower_id: data.follower_id,
    follower_name: data.follower_name || emailClean.split('@')[0],
    follower_email: emailClean,
    follower_avatar: data.follower_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.follower_name || emailClean)}`,
    created_at: new Date().toISOString(),
  };

  all.unshift(newFollow);
  localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(all));
  notifyListeners();

  // Sync to Supabase if configured
  const client = getSupabaseClient();
  if (client) {
    try {
      client.from('follows').insert({
        organizer_id: data.organizer_id.startsWith('org-') ? null : data.organizer_id,
        organizer_handle: data.organizer_handle,
        follower_id: data.follower_id && !data.follower_id.startsWith('usr-') ? data.follower_id : null,
        follower_email: emailClean,
        follower_name: data.follower_name,
        follower_avatar: data.follower_avatar,
      }).then(({ error }) => {
        if (error) console.warn('Supabase follow sync note:', error.message);
      });
    } catch (e) {
      console.warn('Supabase follow sync note:', e);
    }
  }

  return {
    success: true,
    isFollowing: true,
    count: getFollowerCount(orgKey)
  };
};

export const unfollowOrganizer = (
  organizerIdOrHandle: string,
  emailOrId: string
): { success: boolean; isFollowing: boolean; count: number } => {
  if (!isClient) return { success: false, isFollowing: false, count: 0 };
  const all = getFollows();
  const qOrg = organizerIdOrHandle.toLowerCase().trim();
  const qFollower = emailOrId.toLowerCase().trim();

  const filtered = all.filter(f => {
    const matchesOrg = (f.organizer_id && f.organizer_id.toLowerCase() === qOrg) ||
                       (f.organizer_handle && f.organizer_handle.toLowerCase() === qOrg);
    const matchesFollower = (f.follower_email && f.follower_email.toLowerCase() === qFollower) ||
                            (f.follower_id && f.follower_id.toLowerCase() === qFollower);
    return !(matchesOrg && matchesFollower);
  });

  localStorage.setItem(STORAGE_KEYS.FOLLOWS, JSON.stringify(filtered));
  notifyListeners();

  const client = getSupabaseClient();
  if (client) {
    try {
      client.from('follows')
        .delete()
        .or(`follower_email.eq.${qFollower},follower_id.eq.${qFollower}`)
        .then(({ error }) => {
          if (error) console.warn('Supabase unfollow sync note:', error.message);
        });
    } catch (e) {
      console.warn('Supabase unfollow sync note:', e);
    }
  }

  return {
    success: true,
    isFollowing: false,
    count: getFollowerCount(organizerIdOrHandle)
  };
};

export const toggleFollowOrganizer = (data: {
  organizer_id: string;
  organizer_handle?: string;
  follower_id?: string;
  follower_name: string;
  follower_email: string;
  follower_avatar?: string;
}): { isFollowing: boolean; count: number } => {
  const isFollowing = isUserFollowing(
    data.organizer_id || data.organizer_handle || '',
    data.follower_email || data.follower_id || ''
  );
  if (isFollowing) {
    return unfollowOrganizer(
      data.organizer_id || data.organizer_handle || '',
      data.follower_email || data.follower_id || ''
    );
  } else {
    return followOrganizer(data);
  }
};
