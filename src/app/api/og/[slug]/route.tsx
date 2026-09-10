import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { SAMPLE_TEMPLATE_EVENTS } from '@/lib/store';

export const runtime = 'edge';

// Template-specific aesthetic color schemes and accents
const TEMPLATE_STYLES: Record<string, {
  name: string;
  bgGradient: string;
  accent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  taglineColor: string;
  borderAccent: string;
}> = {
  grove: {
    name: 'Grove',
    bgGradient: 'linear-gradient(145deg, #072318 0%, #03120C 50%, #010805 100%)',
    accent: '#2DD4BF',
    badgeBg: 'rgba(45, 212, 191, 0.18)',
    badgeBorder: 'rgba(45, 212, 191, 0.35)',
    badgeText: '#5EEAD4',
    taglineColor: '#A7F3D0',
    borderAccent: '#10B981',
  },
  sprint: {
    name: 'Sprint',
    bgGradient: 'linear-gradient(145deg, #091326 0%, #060B17 50%, #020409 100%)',
    accent: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    badgeText: '#7DD3FC',
    taglineColor: '#BAE6FD',
    borderAccent: '#0284C7',
  },
  bloom: {
    name: 'Bloom',
    bgGradient: 'linear-gradient(145deg, #2A110D 0%, #170805 50%, #0A0302 100%)',
    accent: '#FB923C',
    badgeBg: 'rgba(251, 146, 60, 0.18)',
    badgeBorder: 'rgba(251, 146, 60, 0.35)',
    badgeText: '#FDBA74',
    taglineColor: '#FED7AA',
    borderAccent: '#EA580C',
  },
  vertex: {
    name: 'Vertex',
    bgGradient: 'linear-gradient(145deg, #200E3B 0%, #110624 50%, #070211 100%)',
    accent: '#C084FC',
    badgeBg: 'rgba(192, 132, 252, 0.18)',
    badgeBorder: 'rgba(192, 132, 252, 0.35)',
    badgeText: '#E9D5FF',
    taglineColor: '#F3E8FF',
    borderAccent: '#9333EA',
  },
  ember: {
    name: 'Ember',
    bgGradient: 'linear-gradient(145deg, #2C1605 0%, #190B02 50%, #0B0400 100%)',
    accent: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.18)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    badgeText: '#FCD34D',
    taglineColor: '#FEF08A',
    borderAccent: '#D97706',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'whatsapp'; // 'whatsapp' | 'story' | 'post'
    const bannerStyle = (searchParams.get('style') || 'poster').toLowerCase(); // 'poster' | 'cyber' | 'editorial' | 'ticket' | 'classic'

    // Dimensions matching social standards
    let width = 1280;
    let height = 720;
    if (format === 'story') {
      width = 1080;
      height = 1920;
    } else if (format === 'post') {
      width = 1080;
      height = 1080;
    }

    let event: any = null;

    // 1. Dynamic Supabase query if not preview
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project') && params.slug !== 'preview') {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/events?slug=eq.${encodeURIComponent(params.slug)}&select=*`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows?.[0]) event = rows[0];
        }
      } catch (err) {
        console.warn('Supabase fetch in OG route:', err);
      }
    }

    // 2. Fallback to sample template events only if matched
    if (!event) {
      event = SAMPLE_TEMPLATE_EVENTS.find(e => e.slug.toLowerCase() === params.slug.toLowerCase());
    }

    // 3. Fallback: only if no event and no title param is passed
    if (!event && !searchParams.get('title')) {
      event = SAMPLE_TEMPLATE_EVENTS[0];
    }

    // 4. Resolve event fields with query parameter overrides
    const title = searchParams.get('title') || event?.title || 'Exclusive Experience';
    const tagline = searchParams.get('tagline') || event?.tagline || 'Join us for an unforgettable in-person gathering.';
    const city = searchParams.get('city') || event?.city || 'India';
    const locationName = searchParams.get('location') || event?.location_name || 'Main Venue';
    const organizerName = searchParams.get('organizer') || event?.organizer_name || 'Organizer';
    const templateName = (searchParams.get('template') || event?.template || 'grove').toLowerCase();
    const coverUrl = searchParams.get('cover') || event?.cover_image_url || '';
    const dateStr = searchParams.get('date') || event?.start_at || '';

    const style = TEMPLATE_STYLES[templateName] || TEMPLATE_STYLES.grove;
    const customAccent = searchParams.get('accent') || (event?.organizer_brand_color) || (event?.theme?.custom_accent) || style.borderAccent;

    // Format IST Date
    let displayDate = 'Upcoming Date';
    let monthShort = 'DATE';
    let dayNum = '01';
    try {
      if (dateStr) {
        const d = new Date(dateStr);
        displayDate = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        monthShort = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
        dayNum = d.getDate().toString().padStart(2, '0');
      }
    } catch {
      displayDate = 'Upcoming Gathering';
    }

    const isStory = format === 'story';
    const isPost = format === 'post';

    // RENDER STYLE 1: VIBRANT HERO POSTER
    if (bannerStyle === 'poster') {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: isStory ? '90px 70px' : isPost ? '64px 64px' : '52px 68px',
              backgroundColor: '#090B10',
              position: 'relative',
              fontFamily: 'sans-serif',
              overflow: 'hidden',
            }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.52,
                }}
              />
            ) : null}

            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(8,11,18,0.96) 0%, rgba(9,14,24,0.78) 45%, rgba(12,18,30,0.85) 100%)',
              }}
            />

            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: '-120px',
                right: '-100px',
                width: '550px',
                height: '550px',
                borderRadius: '999px',
                background: `radial-gradient(circle, ${customAccent} 0%, rgba(0,0,0,0) 70%)`,
                opacity: 0.35,
              }}
            />

            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  padding: isStory ? '14px 28px' : '10px 22px',
                  border: `1.5px solid ${customAccent}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: customAccent,
                    marginRight: '10px',
                  }}
                />
                <span style={{ color: '#FFFFFF', fontSize: isStory ? '24px' : '17px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Hosted by {organizerName}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: style.badgeBg,
                  borderRadius: '999px',
                  padding: isStory ? '12px 24px' : '8px 18px',
                  border: `1px solid ${style.badgeBorder}`,
                }}
              >
                <span style={{ color: style.badgeText, fontSize: isStory ? '22px' : '15px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {style.name} · {city}
                </span>
              </div>
            </div>

            {/* Center */}
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', margin: 'auto 0', maxWidth: '92%' }}>
              <div
                style={{
                  display: 'flex',
                  color: '#FFFFFF',
                  fontSize: isStory ? '72px' : isPost ? '60px' : '54px',
                  fontWeight: 900,
                  lineHeight: 1.12,
                  letterSpacing: '-1.5px',
                  marginBottom: '16px',
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: 'flex',
                  color: style.taglineColor,
                  fontSize: isStory ? '32px' : '23px',
                  lineHeight: 1.35,
                  fontWeight: 600,
                  opacity: 0.95,
                }}
              >
                {tagline}
              </div>
            </div>

            {/* Bottom */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.16)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    padding: isStory ? '14px 22px' : '8px 18px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    marginRight: '20px',
                  }}
                >
                  <span style={{ color: customAccent, fontSize: isStory ? '16px' : '12px', fontWeight: 800, letterSpacing: '1px' }}>
                    {monthShort}
                  </span>
                  <span style={{ color: '#FFFFFF', fontSize: isStory ? '32px' : '24px', fontWeight: 900, lineHeight: 1 }}>
                    {dayNum}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#FFFFFF', fontSize: isStory ? '26px' : '20px', fontWeight: 800 }}>
                    {displayDate}
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: isStory ? '20px' : '15px', marginTop: '4px' }}>
                    📍 {locationName} · {city}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: isStory ? '16px' : '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>
                  Guest Pass & RSVP
                </span>
                <span style={{ color: customAccent, fontSize: isStory ? '26px' : '20px', fontWeight: 900, letterSpacing: '0.5px' }}>
                  vibe.swaniki.app
                </span>
              </div>
            </div>
          </div>
        ),
        { width, height }
      );
    }

    // RENDER STYLE 2: NEO-CYBER
    if (bannerStyle === 'cyber') {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: isStory ? '90px 70px' : isPost ? '60px 60px' : '48px 60px',
              backgroundColor: '#05070B',
              position: 'relative',
              fontFamily: 'monospace',
              border: `10px solid ${customAccent}`,
            }}
          >
            {/* Cyber Header Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${customAccent}`, paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ backgroundColor: customAccent, color: '#000000', fontSize: isStory ? '20px' : '14px', fontWeight: 900, padding: '4px 12px', marginRight: '10px' }}>
                  // LIVE EVENT
                </span>
                <span style={{ color: '#FFFFFF', fontSize: isStory ? '20px' : '15px', fontWeight: 'bold' }}>
                  ORG: {organizerName.toUpperCase()}
                </span>
              </div>

              <span style={{ color: customAccent, fontSize: isStory ? '20px' : '14px', fontWeight: 'bold' }}>
                [ STATUS: PASSES OPEN ]
              </span>
            </div>

            {/* Cyber Center */}
            <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto 0' }}>
              <div
                style={{
                  display: 'flex',
                  color: '#FFFFFF',
                  fontSize: isStory ? '70px' : isPost ? '58px' : '52px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  letterSpacing: '-1px',
                  marginBottom: '18px',
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: 'flex',
                  color: customAccent,
                  fontSize: isStory ? '26px' : '20px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                }}
              >
                &gt; {tagline}
              </div>
            </div>

            {/* Cyber Footer Grid */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: `2px solid ${customAccent}`,
                paddingTop: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#FFFFFF', fontSize: isStory ? '24px' : '18px', fontWeight: 900 }}>
                  DATE: {displayDate.toUpperCase()}
                </span>
                <span style={{ color: '#94A3B8', fontSize: isStory ? '18px' : '14px', marginTop: '4px' }}>
                  LOC: {locationName.toUpperCase()} // {city.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ backgroundColor: '#FFFFFF', color: '#000000', padding: '6px 16px', fontSize: isStory ? '18px' : '14px', fontWeight: 900 }}>
                  CLAIM PASS
                </span>
              </div>
            </div>
          </div>
        ),
        { width, height }
      );
    }

    // RENDER STYLE 3: EDITORIAL
    if (bannerStyle === 'editorial') {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: isStory ? '100px 80px' : isPost ? '70px 70px' : '56px 72px',
              backgroundColor: '#111317',
              position: 'relative',
              fontFamily: 'serif',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Top */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: isStory ? '22px' : '15px', textTransform: 'uppercase', letterSpacing: '4px', fontStyle: 'italic' }}>
                A Gathering Curated By {organizerName}
              </span>
              <span style={{ color: customAccent, fontSize: isStory ? '20px' : '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                N° 2026 · {city}
              </span>
            </div>

            {/* Center */}
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', margin: 'auto 0' }}>
              <div
                style={{
                  display: 'flex',
                  color: '#F8FAFC',
                  fontSize: isStory ? '68px' : isPost ? '56px' : '50px',
                  lineHeight: 1.2,
                  marginBottom: '20px',
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: 'flex',
                  color: '#CBD5E1',
                  fontSize: isStory ? '30px' : '22px',
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  maxWidth: '85%',
                }}
              >
                &ldquo;{tagline}&rdquo;
              </div>
            </div>

            {/* Bottom */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                paddingTop: '20px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', marginRight: '32px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Date</span>
                  <span style={{ color: '#FFFFFF', fontSize: isStory ? '22px' : '17px', marginTop: '2px' }}>{displayDate}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Venue</span>
                  <span style={{ color: '#FFFFFF', fontSize: isStory ? '22px' : '17px', marginTop: '2px' }}>{locationName}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>RSVP</span>
                <span style={{ color: customAccent, fontSize: isStory ? '22px' : '17px', marginTop: '2px' }}>vibe.swaniki.app</span>
              </div>
            </div>
          </div>
        ),
        { width, height }
      );
    }

    // RENDER STYLE 4: VIP PASS / TICKET STUB
    if (bannerStyle === 'ticket') {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              padding: isStory ? '60px 40px' : '36px 44px',
              backgroundColor: '#0C0F17',
              fontFamily: 'sans-serif',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: '#151926',
                borderRadius: '24px',
                border: `2px solid ${customAccent}`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Left Body */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: isStory ? '60px 50px' : '44px 50px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: customAccent, fontSize: isStory ? '20px' : '15px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    • OFFICIAL ADMISSION PASS •
                  </span>
                  <span style={{ color: '#94A3B8', fontSize: isStory ? '18px' : '14px', fontWeight: 700 }}>
                    HOST: {organizerName}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto 0' }}>
                  <div
                    style={{
                      display: 'flex',
                      color: '#FFFFFF',
                      fontSize: isStory ? '64px' : isPost ? '52px' : '46px',
                      fontWeight: 900,
                      lineHeight: 1.15,
                      letterSpacing: '-1px',
                      marginBottom: '12px',
                    }}
                  >
                    {title}
                  </div>
                  <div style={{ display: 'flex', color: '#94A3B8', fontSize: isStory ? '24px' : '18px' }}>
                    {tagline}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: customAccent, fontSize: isStory ? '24px' : '18px', fontWeight: 900 }}>
                      📅 {displayDate}
                    </span>
                    <span style={{ color: '#CBD5E1', fontSize: isStory ? '18px' : '14px', marginTop: '2px' }}>
                      📍 {locationName} · {city}
                    </span>
                  </div>
                </div>
              </div>

              {/* Perforation Line */}
              <div
                style={{
                  display: 'flex',
                  width: '1px',
                  borderLeft: '3px dashed rgba(255, 255, 255, 0.25)',
                  position: 'relative',
                }}
              />

              {/* Right Stub */}
              <div
                style={{
                  width: isStory ? '220px' : '260px',
                  backgroundColor: '#0F121C',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '36px 20px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ color: customAccent, fontSize: '13px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    TIER: VIP GUEST
                  </span>
                  <span style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 900, marginTop: '8px' }}>
                    {dayNum} {monthShort}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', height: '60px', opacity: 0.8 }}>
                  <div style={{ display: 'flex', width: '4px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '2px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '6px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '3px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '1px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '5px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '2px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '7px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '3px', height: '50px', backgroundColor: '#FFFFFF', marginRight: '3px' }} />
                  <div style={{ display: 'flex', width: '5px', height: '50px', backgroundColor: '#FFFFFF' }} />
                </div>

                <span style={{ color: '#64748B', fontSize: '11px', fontWeight: 800, letterSpacing: '1px' }}>
                  vibe.swaniki.app
                </span>
              </div>
            </div>
          </div>
        ),
        { width, height }
      );
    }

    // DEFAULT STYLE 5: CLASSIC ATMOSPHERIC
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: isStory ? '120px 80px' : '56px 72px',
            background: style.bgGradient,
            position: 'relative',
            fontFamily: 'sans-serif',
          }}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.32,
              }}
            />
          ) : null}

          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '12px',
              backgroundColor: customAccent,
            }}
          />

          {/* Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: style.badgeBg,
                borderRadius: '999px',
                padding: '10px 24px',
                border: `1px solid ${style.badgeBorder}`,
              }}
            >
              <span style={{ color: '#FFFFFF', fontSize: isStory ? '28px' : '22px', fontWeight: 'bold' }}>
                Hosted by {organizerName}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                padding: '8px 20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <span style={{ color: style.accent, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {style.name} · {city}
              </span>
            </div>
          </div>

          {/* Center */}
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', margin: 'auto 0', maxWidth: '90%' }}>
            <div
              style={{
                display: 'flex',
                color: '#FFFFFF',
                fontSize: isStory ? '76px' : isPost ? '64px' : '58px',
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: '20px',
                letterSpacing: '-1px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: 'flex',
                color: style.taglineColor,
                fontSize: isStory ? '34px' : '26px',
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              {tagline}
            </div>
          </div>

          {/* Bottom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              paddingTop: '24px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#FFFFFF', fontSize: isStory ? '28px' : '24px', fontWeight: 'bold' }}>
                📅 {displayDate} · {city}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '18px', marginTop: '6px' }}>
                📍 {locationName}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                RSVP & Guest Passes
              </span>
              <span style={{ color: customAccent, fontSize: '22px', fontWeight: 'bold' }}>
                vibe.swaniki.app
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}
