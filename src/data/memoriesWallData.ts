// Vibe Instant Memories Wall: Real flash meetups, spontaneous activities & attendee reviews

export interface MemoryPhotoCard {
  type: 'photo';
  isTall: boolean;
  image: string;
  avatar: string;
  userName: string;
  userTime: string;
  eventName: string;
  eventLocation: string;
}

export interface MemoryReviewCard {
  type: 'review';
  isTall: boolean;
  reviewText: string;
  stars: number;
  avatar: string;
  userName: string;
  userTime: string;
  eventName: string;
  eventLocation: string;
}

export type MemoryCardItem = MemoryPhotoCard | MemoryReviewCard;
export type MemoryColumn = MemoryCardItem[];

export const MEMORIES_COLUMNS: MemoryColumn[] = [
  // Column 1: Box Cricket & Coffee
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      userName: 'Kabir Verma',
      userTime: 'Tonight',
      eventName: '🏏 Box Cricket: 6v6 Under Turf Lights',
      eventLocation: 'Urban Sports Turf, Bandra West',
    },
    {
      type: 'photo',
      isTall: true,
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      userName: 'Swaniki Social',
      userTime: 'Today',
      eventName: '☕ Good coffee. Great connections.',
      eventLocation: 'The Studio, Mumbai',
    },
  ],

  // Column 2: Review + Acoustic Live
  [
    {
      type: 'review',
      isTall: true,
      reviewText: 'Joined the box cricket match solo and ended up playing 3 games back to back with an amazing squad!',
      stars: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      userName: 'Harsh Vardhan',
      userTime: 'Today',
      eventName: '🏏 Box Cricket: 6v6 Under Turf Lights',
      eventLocation: 'Urban Sports Turf, Bandra West',
    },
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      userName: 'Sameera Bharadwaj',
      userTime: 'Today',
      eventName: '🎤 Sameera Bharadwaj, Live Sunset Session',
      eventLocation: 'Live Rooftop Venue, Mumbai',
    },
  ],

  // Column 3: Tech Founders & Midnight Chai
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      userName: 'Vibe Tech Guild',
      userTime: 'Today',
      eventName: '💻 AI Founders & Indie Hackers Meetup',
      eventLocation: 'Subko Specialty Coffee, Bandra',
    },
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      userName: 'Rhea Sen',
      userTime: 'Tonight',
      eventName: '☕ Midnight Chai & Indie Hackers Sprint',
      eventLocation: 'Marine Drive Promenade, Churchgate',
    },
  ],

  // Column 4: Badminton Doubles & Badminton Review
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      userName: 'Arjun Nambiar',
      userTime: 'Today',
      eventName: '🏸 Evening Badminton Doubles — 2 Spots Open!',
      eventLocation: 'Smash Court, 100ft Road, Indiranagar',
    },
    {
      type: 'review',
      isTall: true,
      reviewText: 'Found 2 badminton doubles partners in literally 10 minutes on Vibe Instant. Synthetic court was pure class!',
      stars: 5,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      userName: 'Siddharth Nair',
      userTime: 'Today',
      eventName: '🏸 Evening Badminton Doubles',
      eventLocation: 'Smash Court, Bengaluru',
    },
  ],

  // Column 5: Board Games & Gelato
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      userName: 'Tara Bhatia',
      userTime: 'Today',
      eventName: '🎲 Catan, Codenames & Gelato Mixer',
      eventLocation: 'Milano Rooftop Cafe, Koramangala',
    },
  ],

  // Column 6: Lake Acoustic Jam & Pickleball Rally
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      userName: 'Dhruv Kapoor',
      userTime: 'Today',
      eventName: '🎸 Sunset Acoustic Jam & Chords by the Lake',
      eventLocation: 'Deer Park Lake Side, Hauz Khas',
    },
    {
      type: 'photo',
      isTall: true,
      image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      userName: 'Sameer & Friends',
      userTime: '1 day ago',
      eventName: '🏓 Weekend Pickleball Novice Rally & Match',
      eventLocation: 'Juhu Club Courts, Mumbai',
    },
  ],

  // Column 7: Late-Night Chai Sprint Review & Indore Sarafa Trail
  [
    {
      type: 'review',
      isTall: true,
      reviewText: 'The late-night chai and code sprint was unreal. Shipped my Next.js MVP right on the Marine Drive promenade!',
      stars: 5,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      userName: 'Aditi Rao',
      userTime: 'Today',
      eventName: '☕ Midnight Chai & Indie Hackers Sprint',
      eventLocation: 'Marine Drive Promenade, Mumbai',
    },
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      userName: 'Rohit Chouhan',
      userTime: 'Tonight',
      eventName: '🍲 Midnight Street Food Trail: Sarafa Bazaar',
      eventLocation: 'Sarafa Night Bazaar, Indore',
    },
  ],

  // Column 8: Night Football & Sunrise Yoga
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      userName: 'Yashraj Patil',
      userTime: 'Tonight',
      eventName: '⚽ Night Football 5v5 Turf Scrimmage',
      eventLocation: 'Urban Football Arena, Indore',
    },
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      userName: 'Ananya Dave',
      userTime: 'Tomorrow 6:30 AM',
      eventName: '🧘 Sunrise Yoga & Sound Bath in the Park',
      eventLocation: 'Nehru Park Green Lawn, Indore',
    },
  ],

  // Column 9: Pottery Jam & Acoustic Jam Review
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      userName: 'Malvika Joshi',
      userTime: 'Today',
      eventName: '🎨 Pottery Wheel & Terracotta Clay Jam',
      eventLocation: 'Clay Co Studio, Old Palasia, Indore',
    },
    {
      type: 'review',
      isTall: true,
      reviewText: 'The sunset acoustic jam was pure magic. 20 strangers sat on picnic mats and sang Prateek Kuhad along the lake!',
      stars: 5,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      userName: 'Meera Pillai',
      userTime: 'Today',
      eventName: '🎸 Sunset Acoustic Jam & Chords',
      eventLocation: 'Deer Park, New Delhi',
    },
  ],

  // Column 10: Heritage Photo Walk & Tech Builders
  [
    {
      type: 'photo',
      isTall: true,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      userName: 'Devang Sharma',
      userTime: '1 day ago',
      eventName: '📸 Rajwada Golden Hour Heritage Photo Walk',
      eventLocation: 'Rajwada Palace Chowk, Indore',
    },
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      userName: 'Aman Agrawal',
      userTime: '2 days ago',
      eventName: '⚡ Indore Tech Builders: AI Open Demos',
      eventLocation: 'Brilliant Convention Centre, Indore',
    },
  ],

  // Column 11: Board Game Review & Comedy Open Mic
  [
    {
      type: 'review',
      isTall: true,
      reviewText: 'First time playing Catan and the table host made me feel right at home. Best Friday night spontaneous hangout!',
      stars: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      userName: 'Tanmay Kulkarni',
      userTime: 'Today',
      eventName: '🎲 Catan, Codenames & Gelato Mixer',
      eventLocation: 'Milano Rooftop Cafe, Bengaluru',
    },
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      userName: 'Kunal Vyas',
      userTime: 'Tonight',
      eventName: '🎭 Open Mic Comedy: Fresh Jokes Night',
      eventLocation: 'The Stage Cafe, Vijay Nagar, Indore',
    },
  ],

  // Column 12: Board Games Chai & Padel Smash
  [
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      userName: 'Shreya Singhal',
      userTime: 'Today',
      eventName: '☕ Board Games & Kadak Chai Evening',
      eventLocation: 'Chai Kaapi, Vijay Nagar, Indore',
    },
    {
      type: 'photo',
      isTall: false,
      image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1200&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      userName: 'Varun Mehta',
      userTime: 'Tomorrow 8:00 AM',
      eventName: '🎾 Sunday Padel Smash & Breakfast Meetup',
      eventLocation: 'Padel Arena, AB Road, Indore',
    },
  ],
];
