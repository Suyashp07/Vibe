'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Image as ImageIcon,
  Lock,
  Unlock,
  RotateCcw,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  Eye,
  Share2,
  Users,
  Download,
  Flame,
  Smartphone,
  Monitor,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  Navigation,
  Video,
  Copy,
  Crosshair,
  Compass,
  BookOpen,
  Zap,
  Terminal,
  Disc3,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { EventItem, TemplateType, ThemeConfig, RSVPFormConfig, CustomFieldConfig } from '@/types';
import { saveEvent, INITIAL_ORGANIZERS, formatIST } from '@/lib/store';
import { uploadCoverImage } from '@/lib/supabase';
import SocialBannerModal, { BannerStyle } from '@/components/banner/SocialBannerModal';
import { useAuth, getLocalAuthSession } from '@/lib/auth';

// Standardized Indian Geographic Mapping for Precision Geocoding & Direct Maps
const INDIAN_DISTRICT_STATE_MAP: Record<string, { district: string; state: string }> = {
  bhopal: { district: 'Bhopal', state: 'Madhya Pradesh' },
  indore: { district: 'Indore', state: 'Madhya Pradesh' },
  jabalpur: { district: 'Jabalpur', state: 'Madhya Pradesh' },
  gwalior: { district: 'Gwalior', state: 'Madhya Pradesh' },
  ujjain: { district: 'Ujjain', state: 'Madhya Pradesh' },
  sagar: { district: 'Sagar', state: 'Madhya Pradesh' },
  rewa: { district: 'Rewa', state: 'Madhya Pradesh' },
  satna: { district: 'Satna', state: 'Madhya Pradesh' },
  bengaluru: { district: 'Bengaluru Urban', state: 'Karnataka' },
  bangalore: { district: 'Bengaluru Urban', state: 'Karnataka' },
  mysuru: { district: 'Mysuru', state: 'Karnataka' },
  mumbai: { district: 'Mumbai City', state: 'Maharashtra' },
  pune: { district: 'Pune', state: 'Maharashtra' },
  nagpur: { district: 'Nagpur', state: 'Maharashtra' },
  nashik: { district: 'Nashik', state: 'Maharashtra' },
  thane: { district: 'Thane', state: 'Maharashtra' },
  delhi: { district: 'New Delhi', state: 'Delhi NCR' },
  'new delhi': { district: 'New Delhi', state: 'Delhi NCR' },
  gurgaon: { district: 'Gurugram', state: 'Haryana' },
  gurugram: { district: 'Gurugram', state: 'Haryana' },
  faridabad: { district: 'Faridabad', state: 'Haryana' },
  noida: { district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  'greater noida': { district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' },
  lucknow: { district: 'Lucknow', state: 'Uttar Pradesh' },
  kanpur: { district: 'Kanpur Nagar', state: 'Uttar Pradesh' },
  varanasi: { district: 'Varanasi', state: 'Uttar Pradesh' },
  agra: { district: 'Agra', state: 'Uttar Pradesh' },
  prayagraj: { district: 'Prayagraj', state: 'Uttar Pradesh' },
  hyderabad: { district: 'Hyderabad', state: 'Telangana' },
  jaipur: { district: 'Jaipur', state: 'Rajasthan' },
  jodhpur: { district: 'Jodhpur', state: 'Rajasthan' },
  udaipur: { district: 'Udaipur', state: 'Rajasthan' },
  kota: { district: 'Kota', state: 'Rajasthan' },
  ahmedabad: { district: 'Ahmedabad', state: 'Gujarat' },
  surat: { district: 'Surat', state: 'Gujarat' },
  vadodara: { district: 'Vadodara', state: 'Gujarat' },
  rajkot: { district: 'Rajkot', state: 'Gujarat' },
  kolkata: { district: 'Kolkata', state: 'West Bengal' },
  chennai: { district: 'Chennai', state: 'Tamil Nadu' },
  coimbatore: { district: 'Coimbatore', state: 'Tamil Nadu' },
  madurai: { district: 'Madurai', state: 'Tamil Nadu' },
  kochi: { district: 'Ernakulam', state: 'Kerala' },
  thiruvananthapuram: { district: 'Thiruvananthapuram', state: 'Kerala' },
  chandigarh: { district: 'Chandigarh', state: 'Chandigarh' },
  dehradun: { district: 'Dehradun', state: 'Uttarakhand' },
  patna: { district: 'Patna', state: 'Bihar' },
  bhubaneswar: { district: 'Khordha', state: 'Odisha' },
  ranchi: { district: 'Ranchi', state: 'Jharkhand' },
  guwahati: { district: 'Kamrup Metropolitan', state: 'Assam' },
  goa: { district: 'North Goa', state: 'Goa' },
  panaji: { district: 'North Goa', state: 'Goa' }
};

const COMMON_DISTRICTS = [
  'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain',
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru',
  'Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Nashik', 'Thane',
  'New Delhi', 'South Delhi', 'Gurugram', 'Faridabad',
  'Gautam Buddha Nagar (Noida)', 'Lucknow', 'Kanpur Nagar', 'Varanasi', 'Agra',
  'Hyderabad', 'Rangareddy',
  'Jaipur', 'Jodhpur', 'Udaipur', 'Kota',
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot',
  'Kolkata', 'North 24 Parganas',
  'Chennai', 'Coimbatore', 'Madurai',
  'Ernakulam (Kochi)', 'Thiruvananthapuram',
  'Chandigarh', 'Dehradun', 'Patna', 'Khordha (Bhubaneswar)', 'Ranchi',
  'North Goa', 'South Goa'
];

const COMMON_CITIES = [
  'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain',
  'Bengaluru', 'Mysuru', 'Mangalore',
  'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane',
  'New Delhi', 'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad',
  'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj',
  'Hyderabad', 'Secunderabad',
  'Jaipur', 'Jodhpur', 'Udaipur', 'Kota',
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot',
  'Kolkata', 'Howrah',
  'Chennai', 'Coimbatore', 'Madurai',
  'Kochi', 'Thiruvananthapuram', 'Kozhikode',
  'Chandigarh', 'Dehradun', 'Patna', 'Bhubaneswar', 'Ranchi', 'Guwahati',
  'Panaji', 'Vasco da Gama', 'Margao'
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi NCR', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Chandigarh', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'
];

export default function EventWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollTitleParam = searchParams?.get('title') || '';
  const pollDateParam = searchParams?.get('date') || '';

  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [publishedEvent, setPublishedEvent] = useState<EventItem | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [brandPresetToast, setBrandPresetToast] = useState<string | null>(() => {
    return pollDateParam
      ? `🏆 Converting Date Poll winner: "${pollDateParam}"`
      : null;
  });

  // Template State
  const [template, setTemplate] = useState<TemplateType>('grove');
  const [theme, setTheme] = useState<ThemeConfig>({
    palette: 'forest',
    font: 'Inter + Fraunces',
    bg_style: 'texture',
    button_style: 'solid',
    custom_accent: '#2D5A27'
  });

  // Dynamic default dates (e.g. upcoming weekend in IST)
  const defaultDate = typeof window !== 'undefined'
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
        return d.toISOString().split('T')[0];
      })()
    : '2026-10-15';

  const handleApplyBrandPreset = () => {
    const activeOrg = profile || {
      name: 'My Brand',
      brand_color: '#E8621A',
      brand_font: 'Playfair Display'
    };
    setTheme(prev => ({
      ...prev,
      custom_accent: activeOrg.brand_color || '#E8621A',
      font: activeOrg.brand_font ? `${activeOrg.brand_font} + Inter` : 'Playfair Display + Inter',
      palette: 'amber'
    }));
    setBrandPresetToast(`✨ Applied "${activeOrg.name}" preset: ${activeOrg.brand_color || '#E8621A'}, ${activeOrg.brand_font || 'Playfair Display'}`);
    setTimeout(() => setBrandPresetToast(null), 3500);
  };

  // Basic Details State - Clean & fresh for organizer input
  const [title, setTitle] = useState(() => {
    if (pollTitleParam) {
      return pollTitleParam.replace(/^Next\s+/i, '').replace(/:\s*Which.*$/i, '');
    }
    return '';
  });
  const [eventType, setEventType] = useState<'in-person' | 'online' | 'hybrid'>('in-person');
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('18:00');
  const [endDate, setEndDate] = useState(defaultDate);
  const [endTime, setEndTime] = useState('21:00');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(true);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsToast, setGpsToast] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Smart auto-pairing of Indian City -> District & State
  const handleCitySelect = (val: string) => {
    setCity(val);
    const key = val.trim().toLowerCase();
    if (INDIAN_DISTRICT_STATE_MAP[key]) {
      if (!district || district === city) setDistrict(INDIAN_DISTRICT_STATE_MAP[key].district);
      if (!state) setState(INDIAN_DISTRICT_STATE_MAP[key].state);
    }
  };

  // Smart auto-pairing of Indian District -> State
  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    const key = val.trim().toLowerCase();
    if (INDIAN_DISTRICT_STATE_MAP[key] && !state) {
      setState(INDIAN_DISTRICT_STATE_MAP[key].state);
    }
  };

  // 1-Click GPS Auto-Detect with OpenStreetMap Reverse Geocoding
  const handleGpsAutoLocate = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsToast('GPS geolocation not supported by this browser');
      setTimeout(() => setGpsToast(null), 3000);
      return;
    }
    setIsLocatingGps(true);
    setGpsToast('📍 Detecting live GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.address) {
            const a = data.address;
            const detCity = a.city || a.town || a.village || a.suburb || '';
            const detDistrict = a.state_district || a.county || detCity || '';
            const detState = a.state || '';
            const detPincode = a.postcode || '';
            const detRoad = [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(', ');

            if (detCity) setCity(detCity);
            if (detDistrict) setDistrict(detDistrict);
            if (detState) setState(detState);
            if (detPincode) setPincode(detPincode);
            if (detRoad && !locationAddress) setLocationAddress(detRoad);
            setGpsToast(`✅ Found: ${detCity || detDistrict}, ${detState}`);
          } else {
            setGpsToast('✅ GPS coordinates captured');
          }
        } catch (e) {
          setGpsToast('Location captured via device coordinates');
        } finally {
          setIsLocatingGps(false);
          setTimeout(() => setGpsToast(null), 4000);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsToast('Location access denied. Please enter manually.');
        setTimeout(() => setGpsToast(null), 3500);
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Cover Image State
  const [coverImageUrl, setCoverImageUrl] = useState(
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80'
  );

  // Curated Unsplash suggestions
  const suggestedImages = [
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80'
  ];

  // AI Content State (Step 4) - Clean & fresh
  const [aiBrief, setAiBrief] = useState('');
  const [aiTone, setAiTone] = useState<'Professional' | 'Casual' | 'Exciting' | 'Warm'>('Warm');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // AI Generated fields - Clean & fresh
  const [description, setDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [whatsappCaption, setWhatsappCaption] = useState('');
  const [instagramCaption, setInstagramCaption] = useState('');
  const [faq, setFaq] = useState<Array<{ q: string; a: string }>>([]);
  const [rsvpConfirmation, setRsvpConfirmation] = useState('');

  // Field Locks (prevents overwrite on regenerate)
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({
    description: false,
    tagline: false,
    whatsappCaption: false,
    instagramCaption: false,
    faq: false,
    rsvpConfirmation: false
  });

  const [previewBannerFormat, setPreviewBannerFormat] = useState<'whatsapp' | 'story'>('whatsapp');
  const [previewBannerStyle, setPreviewBannerStyle] = useState<BannerStyle>('poster');

  const toggleLock = (field: string) => {
    setLockedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Step 5: RSVP Form Config
  const [rsvpConfig, setRsvpConfig] = useState<RSVPFormConfig>({
    ask_plus_one: true,
    ask_dietary: true,
    ask_tshirt: false,
    waitlist_enabled: true,
    confirmation_message: rsvpConfirmation,
    custom_fields: []
  });

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // AI Streaming Generator Handler
  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: title,
          eventType,
          location: `${locationName}, ${city}`,
          brief: aiBrief,
          tone: aiTone
        })
      });

      const data = await res.json();

      const cap = (str: string): string => {
        if (!str) return '';
        const trimmed = str.trim();
        if (!trimmed) return '';
        let res = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        res = res.replace(/([.?!]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
        res = res.replace(/(\n+\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
        return res;
      };

      // Word-by-word streaming effect for description
      if (!lockedFields.description && data.description) {
        streamText(cap(data.description), setDescription);
      }
      if (!lockedFields.tagline && data.tagline) {
        setTagline(cap(data.tagline));
      }
      if (!lockedFields.whatsappCaption && data.whatsapp_caption) {
        setWhatsappCaption(cap(data.whatsapp_caption));
      }
      if (!lockedFields.instagramCaption && data.instagram_caption) {
        setInstagramCaption(cap(data.instagram_caption));
      }
      if (!lockedFields.faq && data.faq) {
        setFaq(
          data.faq.map((item: { q: string; a: string }) => ({
            q: cap(item.q),
            a: cap(item.a)
          }))
        );
      }
      if (!lockedFields.rsvpConfirmation && data.rsvp_confirmation) {
        const conf = cap(data.rsvp_confirmation);
        setRsvpConfirmation(conf);
        setRsvpConfig(prev => ({ ...prev, confirmation_message: conf }));
      }
    } catch (err) {
      console.error('AI generation failed', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const streamText = (
    fullText: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const words = fullText.split(' ');
    setter('');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < words.length) {
        setter(prev => (prev ? prev + ' ' + words[idx] : words[idx]));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 35);
  };

  // Add Custom Question
  const handleAddCustomQuestion = () => {
    if (rsvpConfig.custom_fields && rsvpConfig.custom_fields.length >= 3) return;
    const newField: CustomFieldConfig = {
      id: `cf-${Date.now()}`,
      label: 'LinkedIn or Twitter / X Profile',
      type: 'text',
      required: false
    };
    setRsvpConfig(prev => ({
      ...prev,
      custom_fields: [...(prev.custom_fields || []), newField]
    }));
  };

  const handleRemoveCustomQuestion = (id: string) => {
    setRsvpConfig(prev => ({
      ...prev,
      custom_fields: prev.custom_fields?.filter(f => f.id !== id)
    }));
  };

  // Final Publish Handler
  const handlePublish = () => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newEvent: EventItem = {
      id: `evt-${Date.now()}`,
      organizer_id: profile?.id || 'org-user',
      organizer_name: profile?.name || 'Organizer',
      organizer_handle: profile?.handle || 'organizer',
      organizer_logo: profile?.avatar_url || '',
      organizer_brand_color: profile?.brand_color || '#E8621A',
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      title,
      tagline,
      description,
      cover_image_url: coverImageUrl,
      template,
      theme,
      sections: {
        speakers: false,
        agenda: true,
        gallery: true,
        faq: true
      },
      event_type: eventType,
      location_name: locationName,
      location_address: locationAddress,
      city: city.trim() || district.trim() || 'India',
      district: district.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      maps_url: mapsUrl.trim() || undefined,
      online_link: onlineLink,
      start_at: `${startDate}T${startTime}:00+05:30`,
      end_at: `${endDate}T${endTime}:00+05:30`,
      timezone: 'Asia/Kolkata',
      capacity: capacity || undefined,
      is_public: isPublic,
      status: 'live',
      ai_generated: true,
      faq,
      rsvp_form_config: rsvpConfig,
      whatsapp_caption: whatsappCaption,
      instagram_caption: instagramCaption,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveEvent(newEvent);
    setPublishedEvent(newEvent);
    setIsPublished(true);
    setShowShareModal(true);

    // Dispatch automated confirmation email to organizer's registered email address
    const targetOrganizerEmail = profile?.email || getLocalAuthSession()?.email;
    if (targetOrganizerEmail) {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event_created',
          to: targetOrganizerEmail,
          organizerName: profile?.name || newEvent.organizer_name || 'Organizer',
          event: newEvent,
          organizer: {
            name: newEvent.organizer_name,
            brand_color: newEvent.organizer_brand_color,
            logo_url: newEvent.organizer_logo,
            handle: newEvent.organizer_handle
          }
        })
      }).catch(err => console.warn('Failed to send event creation confirmation email:', err));
    }
  };

  // Template gallery specifications
  const templatesList: Array<{
    id: TemplateType;
    name: string;
    cat: string;
    palette: string;
    font: string;
    vibe: string;
    color: string;
    heroGradient: string;
    badgeText: string;
    icon: any;
    cardStyleLabel: string;
    sampleButtonText: string;
    sampleButtonStyle: string;
    highlights: string[];
  }> = [
    {
      id: 'grove',
      name: 'Grove',
      cat: 'Community & Salons',
      palette: 'Forest Green + Off-White',
      font: 'Fraunces Serif + Inter',
      vibe: 'Warm, tactile, organic editorial',
      color: '#2D5A27',
      heroGradient: 'from-[#122818] via-[#0E2013] to-[#08130B]',
      badgeText: '✦ COMMUNITY SALON · N° 2026',
      icon: BookOpen,
      cardStyleLabel: 'Organic 3xl curves · Natural parchment finish',
      sampleButtonText: 'RSVP to Salon →',
      sampleButtonStyle: 'bg-[#2D5A27] text-white rounded-full',
      highlights: ['Warm Fraunces literary serif headers', 'Botanical badge motifs', 'Earthy off-white paper canvas']
    },
    {
      id: 'sprint',
      name: 'Sprint',
      cat: 'Athletic & High Voltage',
      palette: 'Electric Orange + Dark Carbon',
      font: 'Cal Sans + Inter (Italic Heavy)',
      vibe: 'Bold, energetic, high-voltage movement',
      color: '#E8621A',
      heroGradient: 'from-[#1A0C05] via-[#100702] to-[#070301]',
      badgeText: '⚡ HIGH VOLTAGE RUN & SPRINT',
      icon: Zap,
      cardStyleLabel: 'Sharp-edge carbon slate · Orange neon borders',
      sampleButtonText: 'JOIN THE SPRINT ⚡',
      sampleButtonStyle: 'bg-gradient-to-r from-[#E8621A] to-[#FF7700] text-white font-black uppercase rounded-lg shadow-lg',
      highlights: ['Slanted athletic condensed headlines', 'Speed telemetry & live pace counters', 'Full dark mode carbon canvas']
    },
    {
      id: 'bloom',
      name: 'Bloom',
      cat: 'Celebrations & Social',
      palette: 'Dusty Rose + Champagne Gold',
      font: 'Playfair Display + Inter',
      vibe: 'Soft, celebratory, candlelight glamour',
      color: '#C47B89',
      heroGradient: 'from-[#301124] via-[#1F0A17] to-[#12050D]',
      badgeText: '✦ SOIRÉE & SUPPER CLUB ✦',
      icon: Sparkles,
      cardStyleLabel: 'Glassmorphic frosted cards · Gold foil trim',
      sampleButtonText: 'Reserve Guest Invitation',
      sampleButtonStyle: 'bg-gradient-to-r from-[#C47B89] to-[#D98A99] text-white font-bold rounded-full shadow-md',
      highlights: ['Floating rose-gold ambient light leaks', 'Romantic high-fashion serif italics', 'Candlelight champagne aesthetic']
    },
    {
      id: 'vertex',
      name: 'Vertex',
      cat: 'Corporate & Tech Summits',
      palette: 'Deep Space Navy + Electric Cyan',
      font: 'Inter Geometric + Monospace',
      vibe: 'Sharp, clean, modern tech summit',
      color: '#00F0FF',
      heroGradient: 'from-[#0B1528] via-[#070D1A] to-[#03060C]',
      badgeText: '[ DEV // SUMMIT // 2026 ]',
      icon: Terminal,
      cardStyleLabel: 'Blueprint tech grid · Cyan laser borders',
      sampleButtonText: '[ CLAIM ACCESS PASS ]',
      sampleButtonStyle: 'bg-cyan-500 text-black font-mono font-bold uppercase rounded-md shadow-[0_0_20px_rgba(0,240,255,0.4)]',
      highlights: ['Terminal cursor prompts & code telemetry', 'Circuit dot-matrix blueprint background', 'Monospace coordinates & status tags']
    },
    {
      id: 'ember',
      name: 'Ember',
      cat: 'Culture & Acoustic Lounge',
      palette: 'Terracotta + Warm Flame Amber',
      font: 'Fraunces Serif + Vintage Grotesque',
      vibe: 'Rich, intimate, acoustic ambient',
      color: '#C85A32',
      heroGradient: 'from-[#2D140B] via-[#1C0B05] to-[#0F0502]',
      badgeText: 'SIDE A · LIVE ACOUSTIC & WORDS',
      icon: Disc3,
      cardStyleLabel: 'Warm kraft deckle cards · Campfire ambient glow',
      sampleButtonText: 'Join the Hearth ✦',
      sampleButtonStyle: 'bg-[#C85A32] text-white font-bold rounded-xl shadow-md',
      highlights: ['Spinning vinyl record badge motif', 'Warm fireside amber radiant lighting', 'Letterpress vintage literary cards']
    }
  ];

  return (
    <div className="min-h-screen py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Wizard Header Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-accent">
              Step {currentStep} of 6
            </span>
            <h1 className="font-display font-black text-2xl text-ink">
              {currentStep === 1 && 'Pick Your Event Template'}
              {currentStep === 2 && 'Basic Details & Schedule'}
              {currentStep === 3 && 'Choose Cover Image'}
              {currentStep === 4 && 'AI Content Studio (Gemini 1.5 Flash)'}
              {currentStep === 5 && 'RSVP Form Builder'}
              {currentStep === 6 && 'Preview & Publish Event'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn bg-surface border border-border text-xs font-semibold hover:bg-surface-3 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-brand hover:bg-brand-mid text-white text-xs font-bold shadow-sm hover-lift transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-btn bg-accent hover:bg-accent-dark text-white text-xs font-bold shadow-md hover-lift transition-all"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span>Publish Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full bg-surface-3 h-2 rounded-full overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: PICK A TEMPLATE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {templatesList.map(item => {
              const isSelected = template === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setTemplate(item.id);
                    setTheme(prev => ({
                      ...prev,
                      custom_accent: item.color,
                      palette: item.id === 'grove' ? 'forest' : item.id === 'sprint' ? 'sprint' : item.id === 'bloom' ? 'bloom' : item.id === 'vertex' ? 'vertex' : 'ember'
                    }));
                  }}
                  className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/40 shadow-elevated scale-[1.02]'
                      : 'border-border hover:border-ink-muted hover-lift bg-surface'
                  }`}
                >
                  {/* Live Bespoke Visual Header */}
                  <div className={`relative h-44 w-full p-3.5 bg-gradient-to-br ${item.heroGradient} text-white flex flex-col justify-between overflow-hidden`}>
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-md">
                        {item.cat}
                      </span>
                      <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/20">
                        {item.name.toUpperCase()}
                      </span>
                    </div>

                    <div className="z-10 space-y-1 my-auto">
                      <h3 className={`text-xl font-black ${
                        item.id === 'grove' ? 'font-tagline text-emerald-100' :
                        item.id === 'sprint' ? 'font-sans uppercase italic text-orange-400 tracking-tighter' :
                        item.id === 'bloom' ? 'font-display italic text-rose-200' :
                        item.id === 'vertex' ? 'font-sans text-cyan-300 font-black' :
                        'font-tagline text-amber-200 font-bold'
                      }`}>
                        {item.name}
                      </h3>
                      <p className="text-[10px] opacity-80 line-clamp-1 italic">
                        {item.vibe}
                      </p>
                    </div>

                    <div className="z-10">
                      <span className={`px-2.5 py-0.5 text-[9.5px] font-bold inline-block ${item.sampleButtonStyle}`}>
                        {item.sampleButtonText}
                      </span>
                    </div>
                  </div>

                  {/* Card Metadata */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between bg-surface">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">{item.palette}</span>
                        <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: item.color }} />
                      </div>
                      <p className="text-[11px] font-mono text-accent">{item.font}</p>
                      <p className="text-[10.5px] text-ink-muted leading-tight">{item.cardStyleLabel}</p>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-accent' : 'text-ink-muted'}`}>
                        {isSelected ? '✓ Active Template' : 'Click to Select'}
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted">Bespoke DNA</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Template Deep-Dive Breakdown Box */}
          {(() => {
            const activeTpl = templatesList.find(t => t.id === template) || templatesList[0];
            const TplIcon = activeTpl.icon;
            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-2 border border-border shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-brand text-white shadow-sm shrink-0">
                    <TplIcon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-base text-ink">
                        Active Template: {activeTpl.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-accent-light text-accent border border-accent/20">
                        {activeTpl.cat}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      {activeTpl.vibe} · {activeTpl.cardStyleLabel}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {activeTpl.highlights.map((hl, idx) => (
                        <span key={idx} className="text-[11px] font-medium bg-surface px-2.5 py-0.5 rounded-md border border-border text-ink">
                          ✓ {hl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-brand hover:bg-brand-mid text-white text-xs font-bold shadow-sm hover-lift transition-all"
                  >
                    <span>Proceed with {activeTpl.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Properties Customizer Panel */}
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Template Style & Brand Presets
                </h3>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  5 tailored palettes, 4 editorial typography pairings, and 1-click organizer branding
                </p>
              </div>

              {/* 1-Click Brand Preset Button */}
              <button
                type="button"
                onClick={handleApplyBrandPreset}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold/15 hover:bg-gold/25 text-amber-900 border border-gold/40 text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span>✨ Apply My Brand Preset</span>
              </button>
            </div>

            {brandPresetToast && (
              <div className="p-2.5 rounded-xl bg-accent-light border border-accent/30 text-accent text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>{brandPresetToast}</span>
              </div>
            )}

            {/* 5 Color Palette Presets */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Color Palette Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'forest', name: 'Forest & Moss', color: '#2D5A27' },
                  { id: 'sprint', name: 'Sprint Orange', color: '#E8621A' },
                  { id: 'bloom', name: 'Dusty Rose', color: '#C47B89' },
                  { id: 'vertex', name: 'Vertex Navy', color: '#0F3460' },
                  { id: 'ember', name: 'Ember Terracotta', color: '#C85A32' }
                ].map(p => {
                  const isSelected = theme.custom_accent?.toLowerCase() === p.color.toLowerCase() || theme.palette === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTheme(prev => ({ ...prev, palette: p.id, custom_accent: p.color }))}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs border font-medium transition-all ${
                        isSelected
                          ? 'border-accent bg-accent-light/40 shadow-xs'
                          : 'border-border bg-surface-2 hover:bg-surface-3'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 Font Pairings */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Editorial Font Pairing</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'Inter + Fraunces', label: 'Inter + Fraunces (Warm & Earthy)' },
                  { id: 'Playfair Display + Inter', label: 'Playfair + Inter (Editorial Luxury)' },
                  { id: 'Cal Sans + Inter', label: 'Cal Sans + Inter (Bold Energy)' },
                  { id: 'Inter + Inter', label: 'Inter + Inter (Sharp Tech)' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTheme(prev => ({ ...prev, font: f.id }))}
                    className={`p-2 rounded-lg text-xs text-left border font-medium transition-all ${
                      theme.font === f.id
                        ? 'border-brand bg-brand text-white shadow-xs'
                        : 'border-border bg-surface-2 text-ink hover:bg-surface-3'
                    }`}
                  >
                    <span className="block font-bold">{f.id}</span>
                    <span className={`text-[10px] block mt-0.5 ${theme.font === f.id ? 'text-white/70' : 'text-ink-muted'}`}>
                      {f.label.split('(')[1]?.replace(')', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background & Button Styles & Custom Hex */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Background Style</label>
                <div className="flex gap-2">
                  {(['solid', 'gradient', 'texture'] as const).map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setTheme(prev => ({ ...prev, bg_style: bg }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs capitalize border font-medium ${
                        theme.bg_style === bg
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface-2 text-ink border-border hover:bg-surface-3'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Button Style</label>
                <div className="flex gap-2">
                  {(['solid', 'pill', 'outline'] as const).map(btn => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => setTheme(prev => ({ ...prev, button_style: btn }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs capitalize border font-medium ${
                        theme.button_style === btn
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface-2 text-ink border-border hover:bg-surface-3'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Custom Hex Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.custom_accent || '#E8621A'}
                    onChange={e => setTheme(prev => ({ ...prev, custom_accent: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                  />
                  <span className="text-xs font-mono text-ink-muted">{theme.custom_accent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BASIC DETAILS */}
      {currentStep === 2 && (
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-6 max-w-3xl mx-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-base font-semibold px-4 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
              placeholder="e.g. Bangalore Founder Run & Filter Coffee"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
              Event Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['in-person', 'online', 'hybrid'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEventType(t)}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    eventType === t
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'bg-surface-2 text-ink border-border hover:bg-surface-3'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Start Date & Time (IST) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="text-xs px-3 py-2 rounded-input bg-surface-2 border border-border"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="text-xs px-3 py-2 rounded-input bg-surface-2 border border-border"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                End Date & Time (IST)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="text-xs px-3 py-2 rounded-input bg-surface-2 border border-border"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="text-xs px-3 py-2 rounded-input bg-surface-2 border border-border"
                />
              </div>
            </div>
          </div>

          {/* VENUE NAME & GPS AUTO-LOCATE ROW */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Venue / Landmark Name *
              </label>
              <button
                type="button"
                onClick={handleGpsAutoLocate}
                disabled={isLocatingGps}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:text-accent-dark transition-colors px-2.5 py-1 rounded-md bg-accent/10 hover:bg-accent/15 border border-accent/20 cursor-pointer"
              >
                <Crosshair className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
                {isLocatingGps ? 'Detecting Location...' : '🎯 Auto-Detect via GPS'}
              </button>
            </div>
            {gpsToast && (
              <div className="mb-2 p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                {gpsToast}
              </div>
            )}
            <input
              type="text"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="e.g. Rgpv Auditorium, Subko Bandra, or Cubbon Park"
              className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none font-medium"
            />
          </div>

          {/* DISTRICT, CITY & STATE GRID (Standardized for India) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* DISTRICT */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                District *
              </label>
              <input
                type="text"
                list="district-suggestions-list"
                value={district}
                onChange={e => handleDistrictChange(e.target.value)}
                placeholder="e.g. Bhopal, Indore, Pune"
                className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none font-medium"
              />
              <datalist id="district-suggestions-list">
                {COMMON_DISTRICTS.map(d => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            {/* CITY / TOWN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                City / Town *
              </label>
              <input
                type="text"
                list="city-suggestions-list"
                value={city}
                onChange={e => handleCitySelect(e.target.value)}
                placeholder="e.g. Bhopal, Mumbai, Bengaluru"
                className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none font-medium"
              />
              <datalist id="city-suggestions-list">
                {COMMON_CITIES.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* STATE / UT */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                State / UT *
              </label>
              <input
                type="text"
                list="state-suggestions-list"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g. Madhya Pradesh"
                className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none font-medium"
              />
              <datalist id="state-suggestions-list">
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          {/* QUICK POPULAR DISTRICT / CITY CHIPS */}
          <div className="flex flex-wrap items-center gap-1.5 -mt-2">
            <span className="text-[11px] text-ink-muted mr-1 font-medium">Quick Pick:</span>
            {['Bhopal', 'Indore', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Jaipur', 'Goa', 'Ahmedabad'].map(pop => (
              <button
                key={pop}
                type="button"
                onClick={() => handleCitySelect(pop)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                  city.toLowerCase() === pop.toLowerCase() || district.toLowerCase() === pop.toLowerCase()
                    ? 'bg-accent text-white border-accent font-bold shadow-xs'
                    : 'bg-surface-2 text-ink-secondary border-border hover:bg-surface-3 hover:text-ink'
                }`}
              >
                {pop}
              </button>
            ))}
          </div>

          {/* STREET ADDRESS & PINCODE */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Full Street Address / Locality
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={e => setLocationAddress(e.target.value)}
                placeholder="e.g. Airport Road, Abbas Nagar, Gandhi Nagar"
                className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                PIN Code
              </label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="e.g. 462033"
                className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* DIRECT GOOGLE MAPS SHARE URL (OPTIONAL FOR WHATSAPP PIN OR EXACT URL) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Direct Google Maps Share Link (Optional)
              </label>
              <span className="text-[11px] text-ink-muted">WhatsApp location or maps.app.goo.gl</span>
            </div>
            <input
              type="url"
              value={mapsUrl}
              onChange={e => setMapsUrl(e.target.value)}
              placeholder="e.g. https://maps.app.goo.gl/... or https://goo.gl/maps/..."
              className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
            />
            <p className="text-[11px] text-ink-muted mt-1">
              💡 Pasting a WhatsApp location or Google Maps shortlink redirects guests directly to your exact pin without any geocoding ambiguity.
            </p>
          </div>

          {/* VIRTUAL LINK IF ONLINE OR HYBRID */}
          {(eventType === 'online' || eventType === 'hybrid') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-accent" />
                Virtual Meeting / Stream URL
              </label>
              <input
                type="url"
                value={onlineLink}
                onChange={e => setOnlineLink(e.target.value)}
                placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
              />
              <p className="text-[11px] text-ink-muted mt-1">
                Virtual links are securely sent to registered guests upon RSVP confirmation.
              </p>
            </div>
          )}

          {/* LIVE MAP ADDRESS & DIRECT REDIRECT PREVIEW */}
          {eventType !== 'online' && (() => {
            const mapSearchParts = [
              locationName,
              locationAddress,
              district ? `${district} District` : '',
              city,
              state,
              pincode,
              'India'
            ].filter(Boolean).map(s => s.trim()).filter(Boolean);

            const mapQuery = Array.from(new Set(mapSearchParts)).join(', ');
            const directMapsUrl = mapsUrl?.trim() || (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : '');
            const directNavUrl = mapsUrl?.trim() || (mapQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}` : '');

            return (
              <div className="rounded-xl border border-border bg-surface-2 overflow-hidden shadow-xs space-y-0">
                <div className="p-3.5 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                        Live Map Pin & Direct Navigation
                        {mapQuery && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-success-bg text-success border border-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                            Live Geocoded
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-muted max-w-md truncate">
                        {mapQuery ? mapQuery : 'Enter venue, district, address or PIN to preview exact map pin'}
                      </div>
                    </div>
                  </div>

                  {/* DIRECT MAP REDIRECT BUTTONS */}
                  {directMapsUrl && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={directMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-bold shadow-xs hover:bg-accent-dark transition-all hover-lift"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Redirect to Google Maps ↗
                      </a>

                      <a
                        href={directNavUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface border border-border text-ink text-xs font-medium hover:text-accent hover:border-accent transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-accent" />
                        Directions
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(directMapsUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2500);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-surface border border-border text-ink text-xs font-medium hover:text-accent hover:border-accent transition-colors cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  )}
                </div>

                {mapQuery ? (
                  <div className="relative w-full h-60 sm:h-72 bg-surface-3">
                    <iframe
                      key={mapQuery}
                      title="Live Location Map Preview"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center text-ink-muted text-xs flex flex-col items-center justify-center gap-2">
                    <Compass className="w-7 h-7 opacity-30 text-ink" />
                    <span>Type venue name, district (e.g. Bhopal), state or address above to preview the interactive pin and direct Google Maps redirect.</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Max Capacity (Optional)
              </label>
              <input
                type="number"
                value={capacity || ''}
                onChange={e => setCapacity(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave blank for unlimited"
                className="w-full text-xs px-3.5 py-2 rounded-input bg-surface-2 border border-border"
              />
            </div>

            <div className="flex items-center justify-between pt-6">
              <div>
                <span className="text-xs font-bold text-ink block">Public Event</span>
                <span className="text-[11px] text-ink-muted">Shown in Discover Feed</span>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded text-accent focus:ring-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: COVER IMAGE */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Upload Dropzone */}
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">Upload Custom Cover</h3>
                <p className="text-xs text-ink-muted mt-1">
                  16:9 ratio recommended (at least 1200x675px)
                </p>

                <div className="mt-4 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent transition-colors flex flex-col items-center justify-center bg-surface-2">
                  <Upload className="w-8 h-8 text-ink-muted mb-2" />
                  <p className="text-xs font-semibold text-ink">Drag and drop your image here</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">PNG, JPG, WebP up to 5MB</p>
                  <label className="mt-3 inline-block px-3.5 py-1.5 rounded-btn bg-brand text-white text-xs font-semibold cursor-pointer hover:bg-brand-mid">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            if (ev.target?.result) setCoverImageUrl(ev.target.result as string);
                          };
                          reader.readAsDataURL(file);

                          // Upload to Supabase Storage CDN if configured
                          const cdnUrl = await uploadCoverImage(file);
                          if (cdnUrl) {
                            setCoverImageUrl(cdnUrl);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-ink-secondary block mb-1">Or paste image URL:</span>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={e => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs px-3 py-2 rounded-input bg-surface-2 border border-border"
                />
              </div>
            </div>

            {/* Right: Curated Unsplash Suggestions */}
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-ink">Curated Unsplash Covers</h3>
                <span className="text-xs text-accent font-semibold">1-Click Apply</span>
              </div>
              <p className="text-xs text-ink-muted">
                High-resolution royalty-free imagery curated for {city} & {eventType} vibes:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {suggestedImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCoverImageUrl(img)}
                    className={`relative h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      coverImageUrl === img ? 'border-accent ring-2 ring-accent/30' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt="suggested" fill className="object-cover" />
                    {coverImageUrl === img && (
                      <div className="absolute inset-0 bg-accent/40 flex items-center justify-center text-white">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Previews: Header Cover + Live Satori Social Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl p-5 border border-border shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Event Header Cover
                </span>
                <span className="text-[11px] text-ink-muted">Page Hero Display</span>
              </div>
              <div className="relative h-52 w-full rounded-xl overflow-hidden bg-surface-3 border border-border">
                <Image src={coverImageUrl} alt="Preview" fill unoptimized className="object-cover" />
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-5 border border-border shadow-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Dynamic Social Banner
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Satori Engine" />
                </div>
                <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreviewBannerFormat('whatsapp')}
                    className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                      previewBannerFormat === 'whatsapp'
                        ? 'bg-brand text-white font-bold shadow-xs'
                        : 'text-ink-secondary hover:text-ink'
                    }`}
                  >
                    16:9 WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBannerFormat('story')}
                    className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                      previewBannerFormat === 'story'
                        ? 'bg-brand text-white font-bold shadow-xs'
                        : 'text-ink-secondary hover:text-ink'
                    }`}
                  >
                    9:16 Story
                  </button>
                </div>
              </div>

              {/* Style Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] uppercase font-bold text-ink-muted mr-1">Style:</span>
                {[
                  { id: 'poster', label: 'Vibrant Poster' },
                  { id: 'cyber', label: 'Neo-Cyber' },
                  { id: 'editorial', label: 'Minimal Editorial' },
                  { id: 'ticket', label: 'VIP Pass' },
                  { id: 'classic', label: 'Atmospheric' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPreviewBannerStyle(st.id as BannerStyle)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all shrink-0 ${
                      previewBannerStyle === st.id
                        ? 'bg-accent/15 border-accent text-accent font-bold'
                        : 'bg-surface-2 border-border text-ink-muted hover:text-ink'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="relative h-56 w-full rounded-xl overflow-hidden bg-brand/5 border border-border flex items-center justify-center p-2">
                <img
                  key={`${previewBannerFormat}-${previewBannerStyle}-${template}`}
                  src={`/api/og/preview?title=${encodeURIComponent(title || 'Community Gathering')}&tagline=${encodeURIComponent(tagline || '')}&city=${encodeURIComponent(city || 'Mumbai')}&location=${encodeURIComponent(locationName || 'Main Venue')}&organizer=${encodeURIComponent(profile?.name || 'Organizer')}&template=${template}&cover=${encodeURIComponent(coverImageUrl)}&format=${previewBannerFormat}&style=${previewBannerStyle}&accent=${encodeURIComponent(profile?.brand_color || '')}`}
                  alt="Dynamic Live Social Share Banner"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-md transition-all duration-300"
                />
              </div>
              <p className="text-[11px] text-ink-muted text-center">
                Updates dynamically in real time from Satori as you customize title, style, template & cover photo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: AI CONTENT STUDIO (GEMINI 1.5 FLASH) */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-5 bg-surface rounded-2xl p-6 border border-border shadow-card space-y-5">
            <div>
              <div className="flex items-center gap-2 text-accent mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Magic Moment</span>
              </div>
              <h2 className="font-display font-black text-xl text-ink">
                Gemini 1.5 Flash Studio
              </h2>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Describe your event in a sentence. Gemini generates high-converting description, punchy taglines, WhatsApp captions, and FAQs in seconds.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Describe your event in a sentence *
              </label>
              <textarea
                rows={4}
                value={aiBrief}
                onChange={e => setAiBrief(e.target.value)}
                placeholder="e.g. Fitness bootcamp for beginners in Bangalore, outdoor, 6am, focused on weight loss..."
                className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Tone Selector
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Professional', 'Casual', 'Exciting', 'Warm'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAiTone(t)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      aiTone === t
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-surface-2 text-ink border-border hover:bg-surface-3'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAi}
              disabled={isGeneratingAi || !aiBrief.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-md hover-lift disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>{isGeneratingAi ? 'Streaming AI Copy...' : '✨ Generate Content with AI'}</span>
            </button>
          </div>

          {/* Right Panel: Output Cards with Locks & Regens */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tagline Card */}
            <div className="bg-surface rounded-xl p-4 border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  Event Tagline (8-12 Words)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleLock('tagline')}
                    className={`p-1 rounded hover:bg-surface-3 ${lockedFields.tagline ? 'text-accent' : 'text-ink-muted'}`}
                    title={lockedFields.tagline ? 'Locked' : 'Unlocked'}
                  >
                    {lockedFields.tagline ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full text-sm font-semibold italic text-ink px-3 py-1.5 rounded-input bg-surface-2 border border-border"
              />
            </div>

            {/* Description Card */}
            <div className="bg-surface rounded-xl p-4 border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  Event Description (150-200 Words)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleLock('description')}
                    className={`p-1 rounded hover:bg-surface-3 ${lockedFields.description ? 'text-accent' : 'text-ink-muted'}`}
                  >
                    {lockedFields.description ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs text-ink-secondary px-3.5 py-2 rounded-input bg-surface-2 border border-border resize-none leading-relaxed"
              />
            </div>

            {/* Social Captions: WhatsApp & IG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface rounded-xl p-4 border border-border shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#25D366]">WhatsApp Broadcast</span>
                  <button onClick={() => toggleLock('whatsappCaption')}>
                    {lockedFields.whatsappCaption ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Unlock className="w-3.5 h-3.5 text-ink-muted" />}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={whatsappCaption}
                  onChange={e => setWhatsappCaption(e.target.value)}
                  className="w-full text-[11px] text-ink-secondary px-2.5 py-1.5 rounded-input bg-surface-2 border border-border resize-none leading-relaxed"
                />
              </div>

              <div className="bg-surface rounded-xl p-4 border border-border shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-600">Instagram Caption</span>
                  <button onClick={() => toggleLock('instagramCaption')}>
                    {lockedFields.instagramCaption ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Unlock className="w-3.5 h-3.5 text-ink-muted" />}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={instagramCaption}
                  onChange={e => setInstagramCaption(e.target.value)}
                  className="w-full text-[11px] text-ink-secondary px-2.5 py-1.5 rounded-input bg-surface-2 border border-border resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* AI Generated FAQs with Lock & Editing */}
            <div className="bg-surface rounded-xl p-4 border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">
                    AI-Generated FAQs
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                    {faq.length} Questions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFaq(prev => [
                        ...prev,
                        { q: 'Is there parking available at the venue?', a: 'Yes, designated parking is available on-site for registered guests.' }
                      ])
                    }
                    className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add FAQ
                  </button>
                  <button onClick={() => toggleLock('faq')}>
                    {lockedFields.faq ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Unlock className="w-3.5 h-3.5 text-ink-muted" />}
                  </button>
                </div>
              </div>

              {faq.length === 0 ? (
                <div className="text-center py-4 text-ink-muted text-xs">
                  Generate with Gemini above to automatically create curated event FAQs.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {faq.map((item, idx) => {
                    const capWord = (s: string) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1) : '';
                    return (
                      <div key={idx} className="p-3 rounded-lg bg-surface-2 border border-border space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={item.q}
                            onChange={e => {
                              const newFaq = [...faq];
                              newFaq[idx].q = capWord(e.target.value);
                              setFaq(newFaq);
                            }}
                            placeholder="Question (Starts with a capital letter)"
                            className="w-full text-xs font-bold text-ink bg-surface px-2.5 py-1 rounded border border-border focus:border-accent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setFaq(prev => prev.filter((_, i) => i !== idx))}
                            className="text-ink-muted hover:text-red-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={item.a}
                          onChange={e => {
                            const newFaq = [...faq];
                            newFaq[idx].a = capWord(e.target.value);
                            setFaq(newFaq);
                          }}
                          placeholder="Answer (Starts with a capital letter)"
                          className="w-full text-xs text-ink-secondary bg-surface px-2.5 py-1.5 rounded border border-border focus:border-accent focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RSVP Confirmation Message */}
            <div className="bg-surface rounded-xl p-4 border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  RSVP Confirmation Pass Message
                </span>
                <button onClick={() => toggleLock('rsvpConfirmation')}>
                  {lockedFields.rsvpConfirmation ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Unlock className="w-3.5 h-3.5 text-ink-muted" />}
                </button>
              </div>
              <textarea
                rows={2}
                value={rsvpConfirmation}
                onChange={e => {
                  const val = e.target.value ? e.target.value.trim().charAt(0).toUpperCase() + e.target.value.trim().slice(1) : '';
                  setRsvpConfirmation(val);
                  setRsvpConfig(prev => ({ ...prev, confirmation_message: val }));
                }}
                className="w-full text-xs text-ink-secondary px-3.5 py-2 rounded-input bg-surface-2 border border-border resize-none leading-relaxed"
                placeholder="Confirmation message displayed on guest pass (Starts with a capital letter)..."
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: RSVP FORM BUILDER */}
      {currentStep === 5 && (
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-6 max-w-3xl mx-auto">
          <div>
            <h2 className="font-display font-bold text-xl text-ink">Guest RSVP Form Builder</h2>
            <p className="text-xs text-ink-muted mt-1">
              Configure what details guests provide upon registering. Default fields (Name, Email, WhatsApp Phone) are always enabled.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary block">
              Optional Standard Questions
            </span>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2 cursor-pointer hover:bg-surface-3 transition-colors">
              <div>
                <span className="text-xs font-bold text-ink block">Ask for +1 Guest Name</span>
                <span className="text-[11px] text-ink-muted">Allows guests to bring a friend</span>
              </div>
              <input
                type="checkbox"
                checked={rsvpConfig.ask_plus_one}
                onChange={e => setRsvpConfig(prev => ({ ...prev, ask_plus_one: e.target.checked }))}
                className="w-5 h-5 rounded text-accent focus:ring-accent"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2 cursor-pointer hover:bg-surface-3 transition-colors">
              <div>
                <span className="text-xs font-bold text-ink block">Ask Dietary Preferences</span>
                <span className="text-[11px] text-ink-muted">Vegetarian / Vegan / Jain options</span>
              </div>
              <input
                type="checkbox"
                checked={rsvpConfig.ask_dietary}
                onChange={e => setRsvpConfig(prev => ({ ...prev, ask_dietary: e.target.checked }))}
                className="w-5 h-5 rounded text-accent focus:ring-accent"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2 cursor-pointer hover:bg-surface-3 transition-colors">
              <div>
                <span className="text-xs font-bold text-ink block">Ask T-Shirt / Merch Size</span>
                <span className="text-[11px] text-ink-muted">For runs, hackathons, and retreats</span>
              </div>
              <input
                type="checkbox"
                checked={rsvpConfig.ask_tshirt}
                onChange={e => setRsvpConfig(prev => ({ ...prev, ask_tshirt: e.target.checked }))}
                className="w-5 h-5 rounded text-accent focus:ring-accent"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-2 cursor-pointer hover:bg-surface-3 transition-colors">
              <div>
                <span className="text-xs font-bold text-ink block">Enable Waitlist when Capacity is Reached</span>
                <span className="text-[11px] text-ink-muted">Automatically starts queueing guests once capacity fills up</span>
              </div>
              <input
                type="checkbox"
                checked={rsvpConfig.waitlist_enabled}
                onChange={e => setRsvpConfig(prev => ({ ...prev, waitlist_enabled: e.target.checked }))}
                className="w-5 h-5 rounded text-accent focus:ring-accent"
              />
            </label>
          </div>

          {/* Custom Questions */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Custom Questions (Max 3)
              </span>
              <button
                type="button"
                onClick={handleAddCustomQuestion}
                className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            {rsvpConfig.custom_fields?.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
                <input
                  type="text"
                  value={f.label}
                  onChange={e => {
                    const updated = [...(rsvpConfig.custom_fields || [])];
                    updated[i].label = e.target.value;
                    setRsvpConfig(prev => ({ ...prev, custom_fields: updated }));
                  }}
                  className="flex-1 text-xs px-3 py-1.5 rounded-input bg-surface border border-border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomQuestion(f.id)}
                  className="p-1.5 rounded text-ink-muted hover:text-red-600 hover:bg-surface transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Confirmation Message */}
          <div className="pt-4 border-t border-border">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
              Guest Confirmation Message
            </label>
            <textarea
              rows={2}
              value={rsvpConfig.confirmation_message}
              onChange={e => setRsvpConfig(prev => ({ ...prev, confirmation_message: e.target.value }))}
              className="w-full text-xs px-3.5 py-2 rounded-input bg-surface-2 border border-border resize-none"
            />
          </div>
        </div>
      )}

      {/* STEP 6: PREVIEW & PUBLISH */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-surface rounded-2xl p-4 border border-border shadow-card">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">Preview Mode:</span>
              <div className="flex rounded-lg border border-border bg-surface-2 p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold ${
                    previewDevice === 'desktop' ? 'bg-surface text-brand shadow-sm' : 'text-ink-muted'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold ${
                    previewDevice === 'mobile' ? 'bg-surface text-brand shadow-sm' : 'text-ink-muted'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>

            <button
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-md hover-lift transition-all"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Publish Event Now</span>
            </button>
          </div>

          {/* Interactive Bespoke Simulation Frame */}
          {(() => {
            const activeTpl = templatesList.find(t => t.id === template) || templatesList[0];
            const isDarkTpl = template === 'sprint' || template === 'vertex';
            return (
              <div className={`mx-auto transition-all ${previewDevice === 'mobile' ? 'max-w-md' : 'max-w-4xl'}`}>
                <div className={`rounded-3xl border shadow-elevated overflow-hidden transition-all ${
                  template === 'sprint' ? 'bg-[#0B0C10] border-orange-500/30' :
                  template === 'vertex' ? 'bg-[#060913] border-sky-500/30' :
                  template === 'bloom' ? 'bg-[#FAF4F7] border-rose-200/80' :
                  template === 'ember' ? 'bg-[#FAF5ED] border-amber-200/80' :
                  'bg-[#F9F7F2] border-stone-200'
                }`}>
                  {/* Template Hero Header */}
                  <div className={`relative h-64 sm:h-72 w-full overflow-hidden p-6 bg-gradient-to-br ${activeTpl.heroGradient} flex flex-col justify-end text-white`}>
                    <Image src={coverImageUrl} alt={title} fill unoptimized className="object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border backdrop-blur-md ${
                          template === 'sprint' ? 'bg-orange-500 text-black border-orange-400 font-black' :
                          template === 'vertex' ? 'bg-sky-950/80 text-cyan-300 border-cyan-500/50 font-mono' :
                          template === 'bloom' ? 'bg-rose-950/70 text-rose-200 border-rose-400/40' :
                          template === 'ember' ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' :
                          'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {activeTpl.badgeText}
                        </span>
                        <span className="text-[10.5px] text-white/80 font-medium">
                          📍 {city || 'India'}
                        </span>
                      </div>

                      <h2 className={`text-2xl sm:text-4xl font-black text-white leading-tight ${
                        template === 'grove' ? 'font-tagline' :
                        template === 'sprint' ? 'font-sans uppercase italic tracking-tighter text-white' :
                        template === 'bloom' ? 'font-display italic text-rose-100' :
                        template === 'vertex' ? 'font-sans text-cyan-300' :
                        'font-tagline text-amber-100'
                      }`}>
                        {title || 'Your Event Title'}
                      </h2>

                      <p className={`text-xs sm:text-sm ${
                        template === 'sprint' ? 'font-sans uppercase font-bold text-orange-400' :
                        template === 'vertex' ? 'font-mono text-cyan-300' :
                        template === 'bloom' ? 'font-display italic text-rose-200' :
                        'font-tagline italic text-amber-200'
                      }`}>
                        {tagline || 'Your poetic event tagline'}
                      </p>
                    </div>
                  </div>

                  {/* Template Body Section */}
                  <div className="p-5 sm:p-7 space-y-5">
                    <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                      isDarkTpl ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-stone-200 text-stone-700'
                    }`}>
                      <span className="font-semibold">📅 {startDate} at {startTime} IST</span>
                      <span className="font-semibold">📍 {locationName || 'Venue TBD'}</span>
                    </div>

                    <div className={`p-5 sm:p-6 rounded-2xl border ${
                      template === 'sprint' ? 'bg-[#13151F] border-orange-500/25 text-slate-200' :
                      template === 'vertex' ? 'bg-[#0C1322] border-sky-500/25 text-slate-200' :
                      template === 'bloom' ? 'bg-white/95 border-rose-200 text-stone-700' :
                      template === 'ember' ? 'bg-[#FFFDF9] border-amber-200 text-stone-700' :
                      'bg-white border-stone-200 text-stone-700'
                    }`}>
                      <h3 className={`font-bold text-base mb-2 ${
                        template === 'sprint' ? 'font-sans uppercase italic text-white' :
                        template === 'vertex' ? 'font-mono text-cyan-400' :
                        template === 'bloom' ? 'font-display italic text-[#301124]' :
                        'font-tagline text-ink'
                      }`}>
                        About This Experience
                      </h3>
                      <p className="text-xs leading-relaxed whitespace-pre-line opacity-90">
                        {description || 'Your event description and narrative will appear here.'}
                      </p>

                      <div className="pt-4 mt-4 border-t border-current/10 flex items-center justify-between">
                        <span className="text-xs font-semibold opacity-70">
                          Template: <strong className="capitalize">{template}</strong>
                        </span>
                        <div className={`px-4 py-2 text-xs font-bold inline-block ${activeTpl.sampleButtonStyle}`}>
                          {activeTpl.sampleButtonText}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Post-Publish Banner Share Modal */}
      {isPublished && (
        <SocialBannerModal
          event={publishedEvent || {
            id: 'temp-preview',
            organizer_id: profile?.id || 'org-user',
            organizer_name: profile?.name || 'Organizer',
            organizer_handle: profile?.handle || 'organizer',
            organizer_logo: profile?.avatar_url || '',
            organizer_brand_color: profile?.brand_color || '#E8621A',
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title,
            tagline,
            description,
            cover_image_url: coverImageUrl,
            template,
            theme,
            sections: { speakers: false, agenda: true, gallery: true, faq: true },
            event_type: eventType,
            location_name: locationName,
            location_address: locationAddress,
            city: city.trim() || district.trim() || 'India',
            district: district.trim() || undefined,
            state: state.trim() || undefined,
            pincode: pincode.trim() || undefined,
            maps_url: mapsUrl.trim() || undefined,
            start_at: `${startDate}T${startTime}:00+05:30`,
            end_at: `${endDate}T${endTime}:00+05:30`,
            timezone: 'Asia/Kolkata',
            capacity,
            is_public: isPublic,
            status: 'live',
            ai_generated: true,
            faq,
            rsvp_form_config: rsvpConfig,
            whatsapp_caption: whatsappCaption,
            instagram_caption: instagramCaption,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            router.push('/dashboard');
          }}
        />
      )}
    </div>
  );
}
