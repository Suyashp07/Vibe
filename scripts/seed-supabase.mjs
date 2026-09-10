import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jqnwlafvsfnqwdkmquwt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const events = [
  {
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
    sections: { speakers: true, agenda: true, gallery: true, faq: true },
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
      { q: 'Is there an entry fee?', a: 'No, this edition is completely free courtesy of Swaniki Studio.' },
      { q: 'Can I bring a friend or colleague?', a: 'Yes! Make sure to mention their name in the +1 section when RSVPing.' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: true,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Your spot is confirmed! Check WhatsApp for venue entry passes.'
    },
    whatsapp_caption: '☕ Mumbai Design & Chai is back on Sep 19 at Subko Bandra! Free entry, rooftop vibes, and unfiltered conversations with top designers. RSVP now before spots fill up!',
    instagram_caption: 'Nights in Mumbai, conversations over pour-overs. Join us for Design & Chai at Subko Bandra on Saturday, Sep 19. Link in bio to RSVP. #MumbaiDesign #Subko #Swaniki #IndianDesigners #MumbaiEvents'
  },
  {
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
    sections: { speakers: false, agenda: true, gallery: true, faq: true },
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
      { q: 'Is this beginner friendly?', a: 'Yes! We have two distinct pace groups (fast and easy jog/walk combo).' }
    ],
    rsvp_form_config: {
      ask_plus_one: false,
      ask_dietary: true,
      ask_tshirt: true,
      waitlist_enabled: true,
      confirmation_message: 'Padel court slot reserved! Check your email for runner bib numbers.'
    },
    whatsapp_caption: '🏃 Sunrise 10K + Founder Padel is on this Sunday in Bengaluru! 6:00 AM at Cubbon Park. Only 8 slots left!',
    instagram_caption: 'Earn your Sunday breakfast. 10K sunrise loops through Cubbon Park + founder Padel matches. RSVP link in bio. #BengaluruRunners #CubbonPark #PadelIndia #BangaloreFitness'
  },
  {
    slug: 'noor-rooftop-soiree-delhi',
    title: 'Noor: Sunset Rooftop Soirée & Urdu Poetry',
    tagline: 'Warm amber glow, acoustic sitar, and contemporary Urdu nazms overlooking Delhi.',
    description: 'As twilight blankets the city, gather under fairy lights on a private haveli rooftop in Hauz Khas. Noor brings together classical acoustic instrumentalists and contemporary poets celebrating love, longing, and Indian monsoon aesthetics.',
    cover_image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
    template: 'bloom',
    theme: {
      palette: 'dusty-rose',
      font: 'Playfair + Inter',
      bg_style: 'gradient',
      button_style: 'pill',
      custom_accent: '#C9A84C'
    },
    sections: { speakers: true, agenda: true, gallery: false, faq: true },
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
      { q: 'Is there floor seating or chairs?', a: 'Traditional baithak style low seating with bolsters and cushions.' }
    ],
    rsvp_form_config: {
      ask_plus_one: true,
      ask_dietary: true,
      ask_tshirt: false,
      waitlist_enabled: true,
      confirmation_message: 'Your candlelit seat is confirmed. Directions sent to WhatsApp.'
    },
    whatsapp_caption: '✨ Noor: Candlelit Urdu Poetry & Sunset Sitar in Hauz Khas on Sep 26. Limited seats for an intimate evening.',
    instagram_caption: 'When words whisper to the twilight sky. Noor returns to Hauz Khas this September. Reserve your baithak seat via link in bio. #DelhiPoetry #HauzKhas #UrduNazms #DelhiCulture'
  }
];

async function seed() {
  console.log('Seeding events into Supabase...');
  for (const evt of events) {
    const { data, error } = await supabase
      .from('events')
      .upsert(evt, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error('Error inserting event', evt.slug, error);
    } else {
      console.log('Successfully inserted:', evt.title);
    }
  }
}

seed();
