import { EventItem, Profile, RSVPItem, CommentItem, DatePoll, TemplateType, FollowerItem, EventAnnouncement, EventDirectMessage } from '@/types';

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

export const SAMPLE_FLASH_VIBES: EventItem[] = [
  {
    id: 'flash-1',
    organizer_id: 'org-1',
    organizer_name: 'Kabir Verma (Turf Captain)',
    organizer_handle: 'kabir_cricket',
    organizer_logo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#F97316',
    slug: 'bandra-box-cricket-night',
    title: '🏏 Box Cricket: 6v6 Under Turf Lights',
    tagline: 'Need 4 players for a friendly 8-over tape-ball match tonight!',
    description: 'Friendly casual match tonight at Bandra Urban Turf! Pitch is booked for 2 full hours under stadium floodlights. Bowlers and all-rounders needed. Bring sneakers, bats and tape balls are provided. Post-match cutting chai on the house!',
    cover_image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
    template: 'ember',
    theme: {
      palette: 'sunset',
      font: 'Inter',
      bg_style: 'solid',
      button_style: 'pill',
      custom_accent: '#F97316',
    },
    sections: { speakers: false, agenda: false, gallery: false, faq: true },
    event_type: 'in-person',
    location_name: 'Urban Sports Turf, Bandra West',
    location_address: 'Opposite Hill Road, Bandra West, Mumbai 400050',
    city: 'Mumbai',
    start_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata',
    capacity: 12,
    is_public: true,
    status: 'live',
    ai_generated: true,
    is_flash: true,
    flash_activity: 'cricket',
    spots_limit: 12,
    spots_filled: 8,
    whatsapp_host_phone: '919820011223',
    vibe_cheers_count: 0,
    flash_tags: ['Cricket', 'Box Match', 'Bandra', 'Friendly', 'Under Lights'],
    faq: [
      { q: 'Do I need to bring cricket gear?', a: 'Just wear sneakers or trainers. Tape balls and bats will be provided at the turf.' },
      { q: 'What is the skill level?', a: 'Casual & friendly! Open to all skill levels.' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: false,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'You are in for Box Cricket tonight! Meet Kabir at Bandra Turf.'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'flash-2',
    organizer_id: 'org-2',
    organizer_name: 'Rhea Sen (Indie Hacker)',
    organizer_handle: 'rhea_codes',
    organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#06B6D4',
    slug: 'midnight-chai-and-code-mumbai',
    title: '☕ Midnight Chai & Indie Hackers Sprint',
    tagline: 'Late night co-working sprint, product teardowns & hot tea by the sea',
    description: 'Anyone shipping side projects or debugging on a Friday night? Bring your charged laptop and meet on the promenade benches opposite Pizza By The Bay. 2-hour sprint followed by cutting chai and honest feedback.',
    cover_image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    template: 'ember',
    theme: {
      palette: 'forest',
      font: 'Inter',
      bg_style: 'solid',
      button_style: 'pill',
      custom_accent: '#06B6D4',
    },
    sections: { speakers: false, agenda: false, gallery: false, faq: true },
    event_type: 'in-person',
    location_name: 'Marine Drive Promenade, Churchgate',
    location_address: 'Benches opposite Pizza By The Bay, Marine Drive, Mumbai 400020',
    city: 'Mumbai',
    start_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata',
    capacity: 15,
    is_public: true,
    status: 'live',
    ai_generated: true,
    is_flash: true,
    flash_activity: 'coffee',
    spots_limit: 15,
    spots_filled: 11,
    whatsapp_host_phone: '919820044556',
    vibe_cheers_count: 0,
    flash_tags: ['Chai', 'Co-Working', 'Indie Hackers', 'Marine Drive', 'Midnight'],
    faq: [
      { q: 'Are power outlets available?', a: 'We sit on the sea promenade, so please charge your laptop before arriving!' },
      { q: 'Can beginners join?', a: 'Yes! Anyone working on tech, design, or writing is welcome.' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: false,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'See you at Marine Drive! Bring your laptop and good vibes.'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'flash-3',
    organizer_id: 'org-3',
    organizer_name: 'Arjun Nambiar',
    organizer_handle: 'arjun_badminton',
    organizer_logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#10B981',
    slug: 'indiranagar-badminton-doubles',
    title: '🏸 Evening Badminton Doubles — 2 Spots Open!',
    tagline: 'Intermediate friendly rally, synthetic wooden court booked',
    description: 'Booked wooden court at Play Arena for 7:30 PM to 9:30 PM. We have 2 players ready, looking for 2 more for mixed doubles. Feather shuttles provided. Please wear non-marking court shoes!',
    cover_image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
    template: 'ember',
    theme: {
      palette: 'sunset',
      font: 'Inter',
      bg_style: 'solid',
      button_style: 'pill',
      custom_accent: '#10B981',
    },
    sections: { speakers: false, agenda: false, gallery: false, faq: true },
    event_type: 'in-person',
    location_name: 'Smash Court, 100ft Road',
    location_address: '100ft Road, Near Sony World Signal, Indiranagar, Bengaluru 560038',
    city: 'Bengaluru',
    start_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata',
    capacity: 4,
    is_public: true,
    status: 'live',
    ai_generated: true,
    is_flash: true,
    flash_activity: 'badminton',
    spots_limit: 4,
    spots_filled: 2,
    whatsapp_host_phone: '919845099881',
    vibe_cheers_count: 0,
    flash_tags: ['Badminton', 'Doubles', 'Indiranagar', 'Wooden Court'],
    faq: [
      { q: 'Do I need my own racket?', a: 'We have 1 spare racket, but please bring your own if you have one!' },
      { q: 'Shoe requirements?', a: 'Strictly non-marking court shoes only.' }
    ],
    rsvp_form_config: {
      ask_plus_one: false,
      ask_dietary: false,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Spot reserved for Badminton! See you on court 2.'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'flash-4',
    organizer_id: 'org-1',
    organizer_name: 'Tara Bhatia (Host)',
    organizer_handle: 'tara_boardgames',
    organizer_logo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    organizer_brand_color: '#8B5CF6',
    slug: 'catan-and-gelato-koramangala',
    title: '🎲 Catan, Codenames & Gelato Mixer',
    tagline: 'Cozy rooftop terrace games evening for new friends & casual gamers',
    description: 'Gathering for tabletop games! We have Settlers of Catan, Secret Hitler, Codenames, and Exploding Kittens. Beginners very welcome, we teach the rules in 5 mins. Artisanal gelato & iced teas available.',
    cover_image_url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
    template: 'ember',
    theme: {
      palette: 'forest',
      font: 'Inter',
      bg_style: 'solid',
      button_style: 'pill',
      custom_accent: '#8B5CF6',
    },
    sections: { speakers: false, agenda: false, gallery: false, faq: true },
    event_type: 'in-person',
    location_name: 'Milano Rooftop Cafe, Koramangala',
    location_address: '80 Feet Rd, 5th Block, Koramangala, Bengaluru 560095',
    city: 'Bengaluru',
    start_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata',
    capacity: 16,
    is_public: true,
    status: 'live',
    ai_generated: true,
    is_flash: true,
    flash_activity: 'games',
    spots_limit: 16,
    spots_filled: 12,
    whatsapp_host_phone: '919845012345',
    vibe_cheers_count: 0,
    flash_tags: ['Board Games', 'Catan', 'Gelato', 'Koramangala', 'Social'],
    faq: [
      { q: 'I have never played Catan, can I still join?', a: 'Absolutely! More than half the table are usually first-timers.' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: false,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Table booked! Meet us on the terrace floor.'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'flash-5',
    organizer_id: 'org-3',
    organizer_name: 'Dhruv Kapoor (Acoustic Club)',
    organizer_handle: 'dhruv_music',
    organizer_logo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    organizer_brand_color: '#EC4899',
    slug: 'sunset-acoustic-jam-delhi',
    title: '🎸 Sunset Acoustic Jam & Chords by the Lake',
    tagline: 'Bring your guitar, uke, or just your singing voice to the park',
    description: 'Unplugged sunset session on the grassy banks of Hauz Khas Deer Park. Indie folk, acoustic Bollywood, western classics. Bring an instrument if you play, or just come sit on a picnic mat and sing along!',
    cover_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    template: 'ember',
    theme: {
      palette: 'sunset',
      font: 'Inter',
      bg_style: 'solid',
      button_style: 'pill',
      custom_accent: '#EC4899',
    },
    sections: { speakers: false, agenda: false, gallery: false, faq: true },
    event_type: 'in-person',
    location_name: 'Deer Park Lake Side, Hauz Khas',
    location_address: 'Deer Park Gate 2, Hauz Khas Village, New Delhi 110016',
    city: 'Delhi',
    start_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata',
    capacity: 20,
    is_public: true,
    status: 'live',
    ai_generated: true,
    is_flash: true,
    flash_activity: 'music',
    spots_limit: 20,
    spots_filled: 14,
    whatsapp_host_phone: '919811055443',
    vibe_cheers_count: 0,
    flash_tags: ['Acoustic', 'Jam Session', 'Sunset', 'Hauz Khas', 'Singalong'],
    faq: [
      { q: 'Is it free?', a: 'Yes! Completely free community gathering.' },
      { q: 'What if I cannot sing?', a: 'Good vibes and claps are all that are required!' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: false,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Grab a mat and see you at Hauz Khas Deer Park!'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'flash-6',
    organizer_id: 'org-2',
    organizer_name: 'Sameer & Friends',
    organizer_handle: 'sameer_paddle',
    organizer_logo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    organizer_brand_color: '#3B82F6',
    slug: 'weekend-pickleball-novice-rally',
    title: '🏓 Weekend Pickleball Novice Rally & Match',
    tagline: 'Learn and play India\'s fastest growing paddle sport',
    description: 'Courts reserved at Juhu. Friendly, high-energy pickleball for beginners and casual players. Paddles and balls provided. Come sweat it out and make sporty friends!',
    cover_image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
    template: 'ember',
    theme: {
      palette: 'forest',
      font: 'Inter',
      bg_style: 'solid',
      button_style: 'pill',
      custom_accent: '#3B82F6',
    },
    sections: { speakers: false, agenda: false, gallery: false, faq: true },
    event_type: 'in-person',
    location_name: 'Juhu Club Courts, Juhu',
    location_address: '13th Road, JVPD Scheme, Juhu, Mumbai 400049',
    city: 'Mumbai',
    start_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    timezone: 'Asia/Kolkata',
    capacity: 8,
    is_public: true,
    status: 'live',
    ai_generated: true,
    is_flash: true,
    flash_activity: 'pickleball',
    spots_limit: 8,
    spots_filled: 5,
    whatsapp_host_phone: '919820077889',
    vibe_cheers_count: 0,
    flash_tags: ['Pickleball', 'Rally', 'Juhu', 'Paddle Sport', 'Beginner'],
    faq: [
      { q: 'Is coaching included?', a: 'Basic rules and serve technique will be taught during warm-up.' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: false,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Paddles ready! See you at Juhu Courts.'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  ANNOUNCEMENTS: 'vibe_announcements_v1',
  MESSAGES: 'vibe_messages_v1',
  USER: 'vibe_current_user_v1'
};

export const INITIAL_ANNOUNCEMENTS: EventAnnouncement[] = [
  {
    id: 'ann-1',
    event_id: 'evt-1',
    organizer_id: 'org-1',
    title: 'Terrace Rooftop Entry & Weather Update',
    message: 'Welcome everyone! The terrace has been covered with ambient fairy lights and rain-proof canopy. Please check in at the Subko ground counter for your guest wristband.',
    target_audience: 'all',
    is_urgent: true,
    send_email: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'ann-2',
    event_id: 'evt-1',
    organizer_id: 'org-1',
    title: 'Parking Advisory - Bandra West',
    message: 'Valet parking is currently limited. We recommend using the public parking lot near Perry Road or taking rideshares to the venue.',
    target_audience: 'confirmed',
    is_urgent: false,
    send_email: false,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const INITIAL_MESSAGES: EventDirectMessage[] = [
  {
    id: 'msg-1',
    event_id: 'evt-1',
    sender_role: 'guest',
    sender_name: 'Tanvi Shah',
    sender_email: 'tanvi@gmail.com',
    recipient_email: 'hello@swaniki.com',
    subject: 'Dietary preferences for Subko chai salon',
    message: 'Hi Swaniki team, does the beverage bar have oat milk or decaf options available during the salon?',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'msg-2',
    event_id: 'evt-1',
    sender_role: 'host',
    sender_name: 'Swaniki Studio',
    sender_email: 'hello@swaniki.com',
    recipient_email: 'tanvi@gmail.com',
    parent_id: 'msg-1',
    message: 'Hey Tanvi! Absolutely. Subko has fresh oat and almond milk on tap, as well as herbal tisanes if you prefer zero caffeine. Looking forward to hosting you!',
    is_read: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

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

// Strict Privacy Guard: Verifies if an event is legitimately public and live.
// Private gatherings (is_public: false, is_private: true, or visibility: 'private')
// are NEVER public and are strictly restricted to direct secret invite link access.
export const isPublicLiveEvent = (e: any): boolean => {
  if (!e) return false;
  const status = (e.status || '').toLowerCase();
  if (status !== 'live' && status !== 'published') return false;

  // Explicit privacy signals
  if (e.is_public === false || String(e.is_public) === 'false') return false;
  if (e.is_private === true || String(e.is_private) === 'true') return false;
  if (e.visibility === 'private') return false;

  const cfg = e.rsvp_form_config;
  if (cfg && (cfg.is_private === true || cfg.is_public === false || cfg.visibility === 'private')) {
    return false;
  }

  // Must be affirmatively public
  return e.is_public === true || String(e.is_public) === 'true';
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

/**
 * Strict check if an event is a spontaneous/flash event belonging to the Vibe Instant section.
 */
export const isFlashVibeEvent = (e: any): boolean => {
  if (!e) return false;
  return Boolean(
    e.is_flash === true ||
    String(e.is_flash) === 'true' ||
    e.category === 'Flash Vibe' ||
    e.theme?.is_flash === true ||
    e.rsvp_form_config?.is_flash === true ||
    e.source_platform === 'whatsapp' ||
    e.source_platform === 'telegram'
  );
};

/**
 * Returns strictly public, live events for public discovery feeds, hero slider, and category lists.
 * Flash events (specific to Vibe Instant) and private events are 100% excluded.
 */
export const getPublicEvents = (): EventItem[] => {
  return getEvents().filter(e => isPublicLiveEvent(e) && !isFlashVibeEvent(e));
};

/**
 * Returns strictly flash vibe events for the Vibe Instant stream.
 * Real events created via WhatsApp and Telegram bots appear FIRST, sorted newest to oldest.
 */
export const getFlashVibeEvents = (): EventItem[] => {
  const allEvents = getEvents();
  const flashFromStore = allEvents.filter(e => isFlashVibeEvent(e) && isPublicLiveEvent(e));
  
  // Real live events from WhatsApp, Telegram, and Supabase sorted newest first
  flashFromStore.sort((a, b) => {
    const timeA = new Date(a.created_at || a.start_at || 0).getTime();
    const timeB = new Date(b.created_at || b.start_at || 0).getTime();
    return timeB - timeA;
  });

  const existingIds = new Set(flashFromStore.map(e => e.id));
  const existingSlugs = new Set(flashFromStore.map(e => e.slug));
  
  const combined = [...flashFromStore];
  for (const sample of SAMPLE_FLASH_VIBES) {
    if (!existingIds.has(sample.id) && !existingSlugs.has(sample.slug)) {
      combined.push(sample);
    }
  }
  return combined;
};

export const isFlashVibeLiked = (eventId: string, slug?: string): boolean => {
  if (!isClient) return false;
  return (
    localStorage.getItem(`vibe_liked_${eventId}`) === 'true' ||
    Boolean(slug && localStorage.getItem(`vibe_liked_${slug}`) === 'true')
  );
};

export const toggleFlashVibeLike = async (
  eventId: string,
  slug?: string
): Promise<{ count: number; liked: boolean }> => {
  if (!isClient) return { count: 0, liked: false };

  const alreadyLiked = isFlashVibeLiked(eventId, slug);
  const isLiking = !alreadyLiked;

  // 1. Persist local user like state
  if (isLiking) {
    localStorage.setItem(`vibe_liked_${eventId}`, 'true');
    if (slug) localStorage.setItem(`vibe_liked_${slug}`, 'true');
  } else {
    localStorage.removeItem(`vibe_liked_${eventId}`);
    if (slug) localStorage.removeItem(`vibe_liked_${slug}`);
  }

  // 2. Optimistically update in local event store
  const events = getEvents();
  const target = events.find(e => e.id === eventId || (slug && e.slug === slug) || e.slug === eventId);
  let newCount = 1;
  if (target) {
    const current = Number(target.vibe_cheers_count || 0);
    newCount = isLiking ? current + 1 : Math.max(0, current - 1);
    target.vibe_cheers_count = newCount;
    if (typeof target.theme === 'object' && target.theme !== null) {
      target.theme.vibe_cheers_count = newCount;
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }
  notifyListeners();

  // 3. Asynchronously persist in Supabase PostgreSQL
  try {
    fetch('/api/events/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        slug: slug || target?.slug,
        action: isLiking ? 'like' : 'unlike',
      }),
    }).catch(err => console.warn('Supabase like sync background error:', err));
  } catch {}

  return { count: newCount, liked: isLiking };
};

export const cheerFlashVibe = (eventId: string): number => {
  if (!isClient) return 0;
  const events = getEvents();
  const target = events.find(e => e.id === eventId || e.slug === eventId);
  const current = Number(target?.vibe_cheers_count || 0);
  const newCount = current + 1;
  
  if (target) {
    target.vibe_cheers_count = newCount;
    if (typeof target.theme === 'object' && target.theme !== null) {
      target.theme.vibe_cheers_count = newCount;
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }
  
  localStorage.setItem(`vibe_liked_${eventId}`, 'true');
  if (target?.slug) localStorage.setItem(`vibe_liked_${target.slug}`, 'true');
  notifyListeners();

  try {
    fetch('/api/events/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, slug: target?.slug, action: 'like' }),
    }).catch(() => {});
  } catch {}

  return newCount;
};

export const getEventBySlug = (slug: string): EventItem | undefined => {
  const events = getEvents();
  const found = events.find(e => e.slug.toLowerCase() === slug.toLowerCase());
  if (found) return found;
  const sampleFound = SAMPLE_TEMPLATE_EVENTS.find(e => e.slug.toLowerCase() === slug.toLowerCase());
  if (sampleFound) return sampleFound;
  return SAMPLE_FLASH_VIBES.find(e => e.slug.toLowerCase() === slug.toLowerCase());
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
        id: event.id.startsWith('evt-') || event.id.startsWith('flash-') ? undefined : event.id,
        organizer_id: isUUID ? event.organizer_id : undefined,
        slug: event.slug,
        title: event.title,
        tagline: event.tagline,
        description: event.description,
        cover_image_url: event.cover_image_url,
        template: event.template,
        theme: {
          ...(typeof event.theme === 'object' ? event.theme : {}),
          is_flash: Boolean(event.is_flash),
          flash_activity: event.flash_activity,
          whatsapp_host_phone: event.whatsapp_host_phone,
          vibe_cheers_count: event.vibe_cheers_count,
          flash_tags: event.flash_tags,
          spots_limit: event.spots_limit,
          spots_filled: event.spots_filled,
        },
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
        source_type: event.source_type || 'native',
        source_platform: event.source_platform || undefined,
        external_ticket_url: event.external_ticket_url || undefined,
        external_price_text: event.external_price_text || undefined,
        confidence_score: event.confidence_score || undefined,
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
        is_public: row.is_public === true,
        is_private: row.is_public === false || row.rsvp_form_config?.is_private === true,
        visibility: (row.is_public === false || row.rsvp_form_config?.is_private === true) ? 'private' : 'public',
        status: row.status || 'live',
        ai_generated: row.ai_generated || false,
        faq: row.faq || [],
        speakers: row.speakers || [],
        agenda: row.agenda || [],
        gallery: row.gallery || [],
        rsvp_form_config: row.rsvp_form_config || { ask_plus_one: true, ask_dietary: true, waitlist_enabled: true },
        whatsapp_caption: row.whatsapp_caption,
        instagram_caption: row.instagram_caption,
        source_type: row.source_type || 'native',
        source_platform: row.source_platform || undefined,
        external_ticket_url: row.external_ticket_url || undefined,
        external_price_text: row.external_price_text || undefined,
        confidence_score: row.confidence_score || undefined,
        is_flash: Boolean(row.is_flash || row.category === 'Flash Vibe' || row.theme?.is_flash || row.rsvp_form_config?.is_flash),
        flash_activity: row.flash_activity || row.theme?.flash_activity || 'other',
        spots_limit: row.spots_limit || row.theme?.spots_limit || row.capacity || 10,
        spots_filled: row.spots_filled || row.theme?.spots_filled || 0,
        whatsapp_host_phone: row.whatsapp_host_phone || row.theme?.whatsapp_host_phone || orgProfile.phone || '',
        vibe_cheers_count: row.vibe_cheers_count || row.theme?.vibe_cheers_count || 0,
        flash_tags: row.flash_tags || row.theme?.flash_tags || [],
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    const deletedList: string[] = isClient ? JSON.parse(localStorage.getItem('vibe_deleted_events') || '[]') : [];
    const deletedSet = new Set(deletedList);

    // Strictly keep only public live remote events, excluding private gatherings, legacy static demo events or deleted events
    const merged = formattedRemote.filter(
      e => isPublicLiveEvent(e) && !STATIC_EVENT_IDS.has(e.id) && !STATIC_EVENT_IDS.has(e.slug) && !deletedSet.has(e.id) && !deletedSet.has(e.slug)
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

export const updateRSVPStatus = async (
  rsvpId: string,
  status: 'confirmed' | 'waitlisted' | 'cancelled',
  email?: string,
  eventId?: string
) => {
  if (isClient) {
    const all = getRSVPs();
    const updated = all.map(r => 
      (r.id === rsvpId || (email && r.email?.toLowerCase() === email.toLowerCase() && (!eventId || r.event_id === eventId)))
        ? { ...r, status }
        : r
    );
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(updated));
    notifyListeners();
  }

  // Persist status change to Supabase database
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/rsvps/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rsvpId,
          status,
          email,
          event_id: eventId
        })
      });
    } catch (err) {
      console.warn('Failed to persist RSVP status to Supabase:', err);
    }
  }
};

export const approveWaitlistGuest = (rsvpId: string, email?: string, eventId?: string) => {
  return updateRSVPStatus(rsvpId, 'confirmed', email, eventId);
};

export const rejectWaitlistGuest = (rsvpId: string, email?: string, eventId?: string) => {
  return updateRSVPStatus(rsvpId, 'cancelled', email, eventId);
};

export const approveAllWaitlist = async (eventId?: string) => {
  let waitlistIds: string[] = [];
  if (isClient) {
    const all = getRSVPs();
    const updated = all.map(r => {
      if (r.status === 'waitlisted' && (!eventId || r.event_id === eventId)) {
        waitlistIds.push(r.id);
        return { ...r, status: 'confirmed' as const };
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEYS.RSVPS, JSON.stringify(updated));
    notifyListeners();
  }

  if (typeof window !== 'undefined' && waitlistIds.length > 0) {
    try {
      await fetch('/api/rsvps/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: waitlistIds,
          status: 'confirmed',
          event_id: eventId
        })
      });
    } catch (err) {
      console.warn('Failed to batch approve waitlist in Supabase:', err);
    }
  }
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

// ==========================================
// HOST <-> GUEST COMMUNICATION GATEWAY STORE
// ==========================================

export const getAnnouncements = (eventId?: string): EventAnnouncement[] => {
  if (!isClient) return eventId ? INITIAL_ANNOUNCEMENTS.filter(a => a.event_id === eventId) : INITIAL_ANNOUNCEMENTS;
  const stored = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
  let all: EventAnnouncement[] = [];
  if (!stored) {
    all = INITIAL_ANNOUNCEMENTS;
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(all));
  } else {
    try {
      all = JSON.parse(stored);
    } catch {
      all = INITIAL_ANNOUNCEMENTS;
    }
  }

  // Also trigger async Supabase sync in background if client configured
  const client = getSupabaseClient();
  if (client) {
    let query = client.from('event_announcements').select('*').order('created_at', { ascending: false });
    if (eventId) query = query.eq('event_id', eventId);
    Promise.resolve(query)
      .then(({ data, error }: any) => {
        if (!error && data && data.length > 0) {
          const currentStored = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
          const currentList: EventAnnouncement[] = currentStored ? JSON.parse(currentStored) : [];
          const mergedMap = new Map<string, EventAnnouncement>();
          currentList.forEach(a => mergedMap.set(a.id, a));
          data.forEach((a: any) => mergedMap.set(a.id, a));
          localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(Array.from(mergedMap.values())));
          notifyListeners();
        }
      })
      .catch(() => {});
  }

  if (eventId) {
    return all.filter(a => a.event_id === eventId);
  }
  return all;
};

export const saveAnnouncement = (
  announcement: Omit<EventAnnouncement, 'id' | 'created_at'> & { id?: string }
): EventAnnouncement => {
  const newAnnouncement: EventAnnouncement = {
    ...announcement,
    id: announcement.id || `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString()
  };

  if (isClient) {
    const stored = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    const all: EventAnnouncement[] = stored ? JSON.parse(stored) : [...INITIAL_ANNOUNCEMENTS];
    all.unshift(newAnnouncement);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(all));
    notifyListeners();

    // Sync to Supabase in background
    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(
        client.from('event_announcements').insert([{
          id: newAnnouncement.id.startsWith('ann-') ? undefined : newAnnouncement.id,
          event_id: newAnnouncement.event_id,
          organizer_id: newAnnouncement.organizer_id || null,
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          target_audience: newAnnouncement.target_audience,
          is_urgent: !!newAnnouncement.is_urgent,
          send_email: !!newAnnouncement.send_email
        }])
      )
        .then(({ error }: any) => {
          if (error) console.warn('Supabase announcement sync note:', error.message);
        })
        .catch(err => console.warn('Supabase announcement sync error:', err));
    }
  }

  return newAnnouncement;
};

export const deleteAnnouncement = (announcementId: string): boolean => {
  if (!isClient) return false;
  const stored = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
  if (!stored) return false;
  try {
    const all: EventAnnouncement[] = JSON.parse(stored);
    const filtered = all.filter(a => a.id !== announcementId);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered));
    notifyListeners();

    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(client.from('event_announcements').delete().eq('id', announcementId))
        .catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
};

export const getEventMessages = (filter?: { eventId?: string; email?: string }): EventDirectMessage[] => {
  if (!isClient) return INITIAL_MESSAGES;
  const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  let all: EventDirectMessage[] = [];
  if (!stored) {
    all = INITIAL_MESSAGES;
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
  } else {
    try {
      all = JSON.parse(stored);
    } catch {
      all = INITIAL_MESSAGES;
    }
  }

  // Supabase background sync
  const client = getSupabaseClient();
  if (client) {
    let query = client.from('event_messages').select('*').order('created_at', { ascending: true });
    if (filter?.eventId) query = query.eq('event_id', filter.eventId);
    Promise.resolve(query)
      .then(({ data, error }: any) => {
        if (!error && data && data.length > 0) {
          const currentStored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
          const currentList: EventDirectMessage[] = currentStored ? JSON.parse(currentStored) : [];
          const mergedMap = new Map<string, EventDirectMessage>();
          currentList.forEach(m => mergedMap.set(m.id, m));
          data.forEach((m: any) => mergedMap.set(m.id, m));
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(Array.from(mergedMap.values())));
          notifyListeners();
        }
      })
      .catch(() => {});
  }

  return all.filter(m => {
    if (filter?.eventId && m.event_id !== filter.eventId) return false;
    if (filter?.email) {
      const q = filter.email.toLowerCase();
      return m.sender_email.toLowerCase() === q || m.recipient_email.toLowerCase() === q;
    }
    return true;
  });
};

export const sendEventMessage = (
  message: Omit<EventDirectMessage, 'id' | 'created_at'> & { id?: string }
): EventDirectMessage => {
  const newMsg: EventDirectMessage = {
    ...message,
    id: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    is_read: message.is_read ?? false
  };

  if (isClient) {
    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const all: EventDirectMessage[] = stored ? JSON.parse(stored) : [...INITIAL_MESSAGES];
    all.push(newMsg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    notifyListeners();

    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(
        client.from('event_messages').insert([{
          id: newMsg.id.startsWith('msg-') ? undefined : newMsg.id,
          event_id: newMsg.event_id,
          sender_role: newMsg.sender_role,
          sender_name: newMsg.sender_name,
          sender_email: newMsg.sender_email,
          recipient_email: newMsg.recipient_email,
          rsvp_id: newMsg.rsvp_id || null,
          subject: newMsg.subject || null,
          message: newMsg.message,
          is_read: newMsg.is_read,
          parent_id: newMsg.parent_id || null
        }])
      )
        .then(({ error }: any) => {
          if (error) console.warn('Supabase message sync note:', error.message);
        })
        .catch(err => console.warn('Supabase message sync error:', err));
    }
  }

  return newMsg;
};

export const markEventMessageRead = (messageId: string): boolean => {
  if (!isClient) return false;
  const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
  if (!stored) return false;
  try {
    const all: EventDirectMessage[] = JSON.parse(stored);
    const found = all.find(m => m.id === messageId);
    if (found) {
      found.is_read = true;
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
      notifyListeners();

      const client = getSupabaseClient();
      if (client) {
        Promise.resolve(
          client.from('event_messages').update({ is_read: true }).eq('id', messageId)
        ).catch(() => {});
      }
      return true;
    }
  } catch {}
  return false;
};
