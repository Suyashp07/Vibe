'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
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
  ShieldCheck,
  Lock,
  Eye,
  Wand2,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle,
  Check,
  Mail,
  Phone,
  Utensils,
  Shirt,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  PenLine,
  FileText,
  X,
  Zap
} from 'lucide-react';
import { EventItem } from '@/types';
import { saveEvent } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { POPULAR_CITIES, INDIAN_CITIES } from '@/lib/location';

// Curated high-res dynamic themes for instant cover selection
const CATEGORY_PRESETS: Record<string, string[]> = {
  'Tech & AI': [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  ],
  Music: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  ],
  Comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  ],
  'Food & Drinks': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  ],
  'Wellness & Fitness': [
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
  ],
  'Culture & Baithak': [
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80',
  ],
  'Gaming & Esports': [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
  ],
  'Art & Exhibitions': [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
  ],
  'Workshops & Masterclasses': [
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80',
  ],
  'Private Salons & Dinners': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80',
  ],
  'Sports & Outdoors': [
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
  ],
  Other: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  ],
};

const CATEGORIES = [
  'Tech & AI',
  'Music',
  'Comedy',
  'Food & Drinks',
  'Wellness & Fitness',
  'Culture & Baithak',
  'Gaming & Esports',
  'Art & Exhibitions',
  'Workshops & Masterclasses',
  'Private Salons & Dinners',
  'Sports & Outdoors',
  'Other',
];

const STEPS = [
  { id: 1, name: 'Details & Story', shortName: 'Details', icon: FileText, desc: 'Title, category, visibility & description' },
  { id: 2, name: 'Date & Venue', shortName: 'Venue', icon: MapPin, desc: 'Schedule timings, city & Google Maps' },
  { id: 3, name: 'Poster & Media', shortName: 'Cover', icon: ImageIcon, desc: 'Curated presets or custom flyer' },
  { id: 4, name: 'Tickets & Passes', shortName: 'Tickets', icon: Ticket, desc: 'Capacity, pricing & RSVP form questions' },
] as const;

interface SingleStepCreateFormProps {
  mode?: 'ai' | 'manual';
}

export default function SingleStepCreateForm({ mode = 'manual' }: SingleStepCreateFormProps) {
  const router = useRouter();
  const { profile, isStaff } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiPosterInputRef = useRef<HTMLInputElement>(null);

  // Stepper & UI States
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showAiAutofill, setShowAiAutofill] = useState(mode === 'ai');

  // AI Extraction Input State
  const [aiUrl, setAiUrl] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiPosterBase64, setAiPosterBase64] = useState<string | null>(null);
  const [aiPosterName, setAiPosterName] = useState<string | null>(null);
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Step 1: Basic Details
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Tech & AI');
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [polishSuccess, setPolishSuccess] = useState(false);

  // Step 2: Date & Location
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [eventType, setEventType] = useState<'in-person' | 'online'>('in-person');
  const [city, setCity] = useState('Mumbai');
  const [venueName, setVenueName] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');

  // Step 3: Banner & Poster
  const [bannerOption, setBannerOption] = useState<'upload' | 'link' | 'ai'>('ai');
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
  );
  const [customLinkInput, setCustomLinkInput] = useState('');

  // Step 4: Ticketing & Registration
  const [ticketingMode, setTicketingMode] = useState<'native' | 'external'>('native');
  const [capacity, setCapacity] = useState('0'); // 0 = unlimited
  const [priceInr, setPriceInr] = useState('0');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalPrice, setExternalPrice] = useState('Free');
  const [approvalMode, setApprovalMode] = useState<'instant' | 'inspection'>('instant');
  const [askPhone, setAskPhone] = useState(true);
  const [askPlusOne, setAskPlusOne] = useState(false);
  const [askDietary, setAskDietary] = useState(false);
  const [askTshirt, setAskTshirt] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(
    'Your admission pass is confirmed! Check your email and WhatsApp for event check-in details.'
  );
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestionInput, setNewQuestionInput] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Extraction Handler
  const handleExtractWithAI = async () => {
    if (!aiUrl.trim() && !aiPosterBase64 && !aiText.trim()) {
      setErrorMsg('Please provide a poster image, an event URL, or notes to extract details.');
      return;
    }

    setIsExtractingAi(true);
    setErrorMsg(null);
    setAiSuccessMsg(null);

    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: aiUrl.trim() || undefined,
          imageBase64: aiPosterBase64 || undefined,
          text: aiText.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to extract event data.');
      }

      const { event } = await res.json();
      if (!event) throw new Error('No structured details found.');

      if (event.title) setTitle(event.title);
      if (event.tagline) setTagline(event.tagline);
      if (event.description) setDescription(event.description);
      if (event.date) setDate(event.date);
      if (event.time) setStartTime(event.time);
      if (event.city) setCity(event.city);
      if (event.venue_name) setVenueName(event.venue_name);
      if (event.category && CATEGORIES.includes(event.category)) setCategory(event.category);
      if (event.is_online) setEventType('online');
      if (event.external_ticket_url) {
        setTicketingMode('external');
        setExternalUrl(event.external_ticket_url);
        if (event.price_text) setExternalPrice(event.price_text);
      }

      if (aiPosterBase64) {
        setCoverUrl(aiPosterBase64);
        setBannerOption('upload');
      }

      setAiSuccessMsg('Event details extracted! Form has been automatically updated.');
      setShowAiAutofill(false);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg(err.message || 'AI extraction failed. Please enter details directly below.');
    } finally {
      setIsExtractingAi(false);
    }
  };

  // AI Description Polish
  const handleEnhanceWithAI = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter an event title before generating or polishing description.');
      return;
    }

    setIsEnhancing(true);
    setErrorMsg(null);
    setPolishSuccess(false);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: title,
          topic: `${title}. Tagline: ${tagline || 'Experience the vibe'}. Venue: ${venueName || city}. Category: ${category}`,
          text: description || `${title} in ${city}`,
          field: 'description',
          location: city,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.result || data.description;
        if (text) {
          setDescription(text);
          setPolishSuccess(true);
          setTimeout(() => setPolishSuccess(false), 3000);
        }
      } else {
        throw new Error('Could not polish description');
      }
    } catch {
      setDescription(
        `Join us for ${title} in ${city}. An intimate, thoughtfully curated gathering bringing together curious minds and passionate people for great conversations and memorable experiences. Space is limited, so reserve your spot early.`
      );
      setPolishSuccess(true);
      setTimeout(() => setPolishSuccess(false), 3000);
    } finally {
      setIsEnhancing(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, forAiExtract: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          if (forAiExtract) {
            setAiPosterBase64(result);
            setAiPosterName(file.name);
          } else {
            setCoverUrl(result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Curated preset cover pick
  const handleGenerateAiCover = () => {
    const pool = CATEGORY_PRESETS[category] || CATEGORY_PRESETS['Tech & AI'];
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    setCoverUrl(randomPick);
  };

  // Add Custom Question
  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    setCustomQuestions((prev) => [...prev, newQuestionInput.trim()]);
    setNewQuestionInput('');
    setIsAddingQuestion(false);
  };

  // Remove Custom Question
  const handleRemoveQuestion = (index: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        setErrorMsg('Please enter an event title before continuing.');
        return;
      }
    }
    setErrorMsg(null);
    setCurrentStep((prev) => Math.min(4, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form Submit Handler
  const handleSubmit = async (publishLive: boolean = true) => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter an event title.');
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') +
        '-' +
        Math.random().toString(36).substring(2, 7);

      const startDateTime = `${date}T${startTime}:00+05:30`;
      const endDateTime = `${date}T${endTime}:00+05:30`;

      const newEvent: EventItem = {
        id: `evt-${Date.now()}`,
        organizer_id: profile?.id || 'org-local',
        organizer_name: profile?.name || 'Event Host',
        organizer_handle: profile?.handle || 'host',
        organizer_logo: profile?.avatar_url,
        slug,
        title: title.trim(),
        tagline: tagline.trim() || 'Join us for a curated experience',
        description: description.trim() || 'Join us for this gathering.',
        cover_image_url: coverUrl,
        template: 'grove',
        theme: {
          palette: 'forest',
          font: 'Inter',
          bg_style: 'solid',
          button_style: 'pill',
        },
        sections: {
          speakers: false,
          agenda: false,
          gallery: false,
          faq: true,
        },
        event_type: eventType,
        location_name: eventType === 'online' ? 'Online Event' : (venueName.trim() || city),
        location_address:
          eventType === 'online'
            ? onlineUrl.trim() || 'Virtual Link Provided Upon RSVP'
            : `${venueName || city}, India`,
        city: eventType === 'online' ? 'Online' : city,
        start_at: startDateTime,
        end_at: endDateTime,
        timezone: 'Asia/Kolkata',
        capacity: Number(capacity) || 0,
        is_public: isStaff ? isPublic : false,
        is_private: !isPublic,
        visibility: isPublic ? 'public' : 'private',
        status: isStaff && publishLive ? 'live' : 'draft',
        ai_generated: mode === 'ai',
        source_type: ticketingMode === 'external' ? 'external' : 'native',
        is_external: ticketingMode === 'external',
        external_ticket_url: ticketingMode === 'external' ? externalUrl.trim() : undefined,
        external_price_text:
          ticketingMode === 'external'
            ? externalPrice.trim()
            : Number(priceInr) > 0
            ? `₹${priceInr}`
            : 'Free Entry',
        faq: [
          {
            q: 'What is the entry policy?',
            a: isPublic
              ? 'Open registration via Vibe.'
              : 'This is a private, personal invite gathering.',
          },
          {
            q: 'Is registration required?',
            a: 'Yes, please RSVP in advance to secure your entry pass.',
          },
        ],
        rsvp_form_config: {
          ask_plus_one: askPlusOne,
          ask_dietary: askDietary,
          ask_tshirt: askTshirt,
          ask_phone: askPhone,
          waitlist_enabled: approvalMode === 'inspection',
          approval_required: approvalMode === 'inspection',
          confirmation_message:
            approvalMode === 'inspection'
              ? 'Your RSVP request has been received. The host will review and confirm your invite pass shortly.'
              : confirmationMessage.trim() || 'Your pass is confirmed. See you there.',
          custom_questions: customQuestions,
          is_private: !isPublic,
          visibility: isPublic ? 'public' : 'private',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      saveEvent(newEvent);
      router.push(`/${newEvent.slug}`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setErrorMsg(err.message || 'Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapSearchQuery =
    (venueName ? `${venueName}, ` : '') + (eventType === 'online' ? 'Online' : city);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 md:pb-20">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] mb-3 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Creation Options</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              Custom Event Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Configure your gathering details, location, schedule, ticketing, and guest pass settings.
            </p>
          </div>

          {/* Quick AI Auto-fill trigger */}
          <button
            type="button"
            onClick={() => setShowAiAutofill(!showAiAutofill)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border shrink-0 ${
              showAiAutofill
                ? 'bg-[#E8621A] text-white border-[#E8621A]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#0F172A] border-[#E2E8F0] hover:border-[#E8621A]/50'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${showAiAutofill ? 'fill-white' : 'text-[#E8621A]'}`} />
            <span>{showAiAutofill ? 'Close AI Auto-Fill' : '⚡ Auto-Fill with AI'}</span>
          </button>
        </div>
      </div>

      {/* AI Extraction Workstation (Collapsible drawer) */}
      {showAiAutofill && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8621A]/40 shadow-lg shadow-[#E8621A]/5 mb-6 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E8621A]/10 text-[#E8621A] flex items-center justify-center">
                <Wand2 className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">AI Instant Autofill</h2>
                <p className="text-[11px] text-[#64748B]">Drop a flyer or paste a link to populate all fields</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAiAutofill(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Option A: Event Webpage Link
              </label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="url"
                  placeholder="https://in.bookmyshow.com/... or https://lu.ma/..."
                  value={aiUrl}
                  onChange={(e) => setAiUrl(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Option B: Event Poster Flyer (Vision OCR)
              </label>
              <input
                ref={aiPosterInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, true)}
              />
              <button
                type="button"
                onClick={() => aiPosterInputRef.current?.click()}
                className="w-full py-2 px-3.5 border border-dashed border-[#CBD5E1] hover:border-[#0F172A] rounded-xl bg-[#F8FAFC] text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors flex items-center justify-center gap-2 cursor-pointer h-[38px]"
              >
                <Upload className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="truncate">
                  {aiPosterName ? `Attached: ${aiPosterName}` : 'Upload Poster Image'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#94A3B8]">Supports BookMyShow, Luma, District, Instagram flyers</span>
            <button
              type="button"
              onClick={handleExtractWithAI}
              disabled={isExtractingAi || (!aiUrl.trim() && !aiPosterBase64 && !aiText.trim())}
              className="py-2 px-4 rounded-xl bg-[#E8621A] hover:bg-[#FF8C42] text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-sm"
            >
              {isExtractingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>Extract Details</span>
                </>
              )}
            </button>
          </div>

          {aiSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{aiSuccessMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="flex-1">{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stepper Progress Bar (Desktop Grid) */}
      <div className="hidden lg:grid grid-cols-4 gap-2 mb-6 bg-white p-2 rounded-2xl border border-[#E2E8F0] shadow-2xs">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isCompleted = currentStep > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id > 1 && !title.trim()) {
                  setErrorMsg('Please enter an event title first.');
                  return;
                }
                setErrorMsg(null);
                setCurrentStep(s.id);
              }}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : isCompleted
                  ? 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">Step {s.id}</div>
                <div className="text-xs font-bold truncate">{s.name}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stepper Progress Bar (Mobile Optimized Bar) */}
      <div className="lg:hidden mb-5 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold">
              {currentStep}
            </span>
            <span>{STEPS[currentStep - 1].name}</span>
          </span>
          <span className="text-[#64748B] text-[11px] font-semibold">Step {currentStep} of 4</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E8621A] to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id > 1 && !title.trim()) {
                  setErrorMsg('Please enter an event title first.');
                  return;
                }
                setErrorMsg(null);
                setCurrentStep(s.id);
              }}
              className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                currentStep === s.id
                  ? 'bg-[#0F172A] text-white'
                  : currentStep > s.id
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-[#F8FAFC] text-[#64748B]'
              }`}
            >
              {s.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Split Studio Grid: Left Form (7 cols) + Right Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Active Step Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* ========================================================================= */}
          {/* STEP 1: Details & Story                                                   */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Event Details & Story</h3>
                  <p className="text-xs text-[#64748B]">Core identity and discovery settings</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#F1F5F9] text-[#64748B]">
                  Step 1 / 4
                </span>
              </div>

              {/* Event Visibility */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Discovery & Privacy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isPublic
                        ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-[#0F172A] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">Public Event</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
                        Listed on city explore feeds & public search.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      !isPublic
                        ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-[#0F172A] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">Private Event (Invite Only)</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
                        Unlisted. Only accessible via secret direct link.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bandra Tech Founders Mixer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors"
                />
              </div>

              {/* Category & Tagline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Tagline / One-Liner
                  </label>
                  <input
                    type="text"
                    placeholder="Short 6-12 words vibe summary"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Description & AI Polish */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#475569]">
                    About the Experience
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing || !title.trim()}
                    className="text-[11px] font-bold text-[#E8621A] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isEnhancing ? 'Polishing with AI...' : '✨ Polish with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Share what guests can expect, the atmosphere, agenda, and why they should join..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors resize-none placeholder:text-[#94A3B8]"
                />
                {polishSuccess && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Description enhanced with AI!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Date & Venue                                                      */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Date & Venue Location</h3>
                  <p className="text-xs text-[#64748B]">When and where the event takes place</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#F1F5F9] text-[#64748B]">
                  Step 2 / 4
                </span>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Start Time (IST)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    End Time (IST)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
              </div>

              {/* Venue Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Location Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEventType('in-person')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      eventType === 'in-person'
                        ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>In-Person Venue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEventType('online')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      eventType === 'online'
                        ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Virtual / Online Event</span>
                  </button>
                </div>
              </div>

              {/* In-Person Details */}
              {eventType === 'in-person' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        City
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                      >
                        {POPULAR_CITIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#475569] mb-1">
                        Venue Name & Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Subko Coffee Roasters, Bandra West"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                      />
                    </div>
                  </div>

                  {/* Google Map Preview */}
                  <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden bg-slate-100 h-40 relative">
                    <iframe
                      title="Google Maps Location Preview"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Virtual Meeting Link (Zoom, Meet, or YouTube)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz or Zoom link (sent to confirmed guests)"
                    value={onlineUrl}
                    onChange={(e) => setOnlineUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Poster & Visual Identity                                          */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Cover Poster & Visuals</h3>
                  <p className="text-xs text-[#64748B]">Choose a theme photo or upload custom flyer</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#F1F5F9] text-[#64748B]">
                  Step 3 / 4
                </span>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#F1F5F9] text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setBannerOption('ai')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                    bannerOption === 'ai' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Curated Presets
                </button>
                <button
                  type="button"
                  onClick={() => setBannerOption('upload')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                    bannerOption === 'upload' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Upload Flyer
                </button>
                <button
                  type="button"
                  onClick={() => setBannerOption('link')}
                  className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                    bannerOption === 'link' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Image Link
                </button>
              </div>

              {/* Preset Gallery */}
              {bannerOption === 'ai' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#475569]">
                      Curated {category} Posters
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateAiCover}
                      className="text-[11px] font-bold text-[#E8621A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Shuffle</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(CATEGORY_PRESETS[category] || CATEGORY_PRESETS['Tech & AI']).map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverUrl(url)}
                        className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          coverUrl === url ? 'border-[#E8621A] ring-2 ring-[#E8621A]/30 scale-[1.02]' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <Image src={url} alt="Cover option" fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              {bannerOption === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, false)}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="py-8 px-4 border-2 border-dashed border-[#CBD5E1] hover:border-[#0F172A] rounded-2xl bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] text-xs font-medium text-[#475569] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Upload className="w-5 h-5 text-[#E8621A]" />
                    <div>
                      <span className="font-bold text-[#0F172A]">Click to upload event flyer</span>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">JPEG, PNG, or WebP</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Direct URL */}
              {bannerOption === 'link' && (
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://example.com/poster.jpg"
                    value={customLinkInput}
                    onChange={(e) => setCustomLinkInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                  {customLinkInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setCoverUrl(customLinkInput.trim())}
                      className="px-4 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-bold"
                    >
                      Apply Image URL
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: Tickets & Passes                                                  */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Admission, Tickets & Questions</h3>
                  <p className="text-xs text-[#64748B]">RSVP policy, capacity limit, and attendee questions</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#F1F5F9] text-[#64748B]">
                  Step 4 / 4
                </span>
              </div>

              {/* Ticketing Mode */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Admission Mechanism
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTicketingMode('native')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      ticketingMode === 'native'
                        ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B]'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Free or Paid on Vibe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTicketingMode('external')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      ticketingMode === 'external'
                        ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B]'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>External Partner Link</span>
                  </button>
                </div>
              </div>

              {/* Native Settings */}
              {ticketingMode === 'native' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Ticket Price (INR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={priceInr}
                      onChange={(e) => setPriceInr(e.target.value)}
                      placeholder="0 for Free Entry"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white font-mono"
                    />
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">Enter 0 for free community RSVP</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Attendee Limit / Capacity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="0 for Unlimited"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white font-mono"
                    />
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">Enter 0 for unlimited admission</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Partner Ticket Page URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://in.bookmyshow.com/... or https://district.in"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#475569] mb-1">
                      Price Display Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ₹499 Onwards"
                      value={externalPrice}
                      onChange={(e) => setExternalPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Approval Mode */}
              <div className="pt-2 border-t border-[#F1F5F9]">
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Pass Approval Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setApprovalMode('instant')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      approvalMode === 'instant'
                        ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white text-[#64748B]'
                    }`}
                  >
                    <div className="font-bold text-[#0F172A]">Instant Confirmation</div>
                    <div className="text-[10px] text-[#64748B] font-normal">Pass issued immediately</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApprovalMode('inspection')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      approvalMode === 'inspection'
                        ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                        : 'border-[#E2E8F0] bg-white text-[#64748B]'
                    }`}
                  >
                    <div className="font-bold text-[#0F172A]">Host Inspection</div>
                    <div className="text-[10px] text-[#64748B] font-normal">Host reviews before pass</div>
                  </button>
                </div>
              </div>

              {/* Attendee Question Checkboxes */}
              <div className="pt-2 border-t border-[#F1F5F9]">
                <label className="block text-xs font-semibold text-[#475569] mb-2">
                  Collect from Attendee
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
                    <input
                      type="checkbox"
                      checked={askPhone}
                      onChange={(e) => setAskPhone(e.target.checked)}
                      className="rounded text-[#0F172A]"
                    />
                    <span>WhatsApp</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
                    <input
                      type="checkbox"
                      checked={askPlusOne}
                      onChange={(e) => setAskPlusOne(e.target.checked)}
                      className="rounded text-[#0F172A]"
                    />
                    <span>+1 Guest</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
                    <input
                      type="checkbox"
                      checked={askDietary}
                      onChange={(e) => setAskDietary(e.target.checked)}
                      className="rounded text-[#0F172A]"
                    />
                    <span>Dietary</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
                    <input
                      type="checkbox"
                      checked={askTshirt}
                      onChange={(e) => setAskTshirt(e.target.checked)}
                      className="rounded text-[#0F172A]"
                    />
                    <span>T-Shirt Size</span>
                  </label>
                </div>
              </div>

              {/* Custom Questions Proliferator */}
              <div className="pt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#475569]">
                    Custom Registration Questions
                  </label>
                  {!isAddingQuestion && (
                    <button
                      type="button"
                      onClick={() => setIsAddingQuestion(true)}
                      className="text-[11px] font-bold text-[#E8621A] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Question</span>
                    </button>
                  )}
                </div>

                {customQuestions.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {customQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate">{q}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isAddingQuestion && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. LinkedIn Profile or What's your project?"
                      value={newQuestionInput}
                      onChange={(e) => setNewQuestionInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A]"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-xl"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingQuestion(false)}
                      className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Event Card & Pass Preview (Sticky Studio on Desktop) */}
        <div className="hidden lg:block lg:col-span-5 sticky top-20 space-y-4">
          <div className="rounded-3xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xl shadow-slate-900/[0.04]">
            {/* Preview Header */}
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Live Preview</span>
              </div>
              <span className="text-[11px] font-semibold text-[#64748B]">Real-time attendee view</span>
            </div>

            {/* Poster Mockup */}
            <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
              <Image
                src={coverUrl}
                alt="Cover Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                  {category}
                </span>
                {isPublic ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                    <Globe className="w-2.5 h-2.5" /> Public
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white flex items-center gap-1 border border-white/20">
                    <Lock className="w-2.5 h-2.5" /> Private
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {date
                      ? new Date(date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Tomorrow'}{' '}
                    · {startTime} IST
                  </span>
                </div>
                <h4 className="text-base font-black truncate leading-tight drop-shadow-sm">
                  {title.trim() || 'Your Event Title'}
                </h4>
              </div>
            </div>

            {/* Event Details snippet */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[#64748B] font-medium truncate max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 text-[#E8621A] shrink-0" />
                  <span className="truncate">
                    {eventType === 'online' ? 'Online Virtual Event' : venueName || city}
                  </span>
                </span>
                <span className="font-black text-[#0F172A] px-2.5 py-0.5 bg-[#F1F5F9] rounded-full text-[11px]">
                  {ticketingMode === 'external'
                    ? externalPrice || 'Partner'
                    : Number(priceInr) > 0
                    ? `₹${priceInr}`
                    : 'Free RSVP'}
                </span>
              </div>

              <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                {tagline.trim() ||
                  description.trim() ||
                  'Add a compelling tagline or description to excite your guests.'}
              </p>

              {/* Host & Spots Row */}
              <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold">
                    {(profile?.name || 'H')[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[140px]">
                    {profile?.name || 'Event Host'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#E8621A]">
                  {Number(capacity) > 0 ? `${capacity} spots total` : 'Open Capacity'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Live Preview Modal / Drawer */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 pb-4">
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">Attendee Preview</span>
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4">
              <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <div className="relative h-40 w-full bg-slate-900">
                  <Image src={coverUrl} alt="Cover Preview" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <div className="text-[10px] font-bold text-amber-300">
                      {date} · {startTime} IST
                    </div>
                    <div className="text-sm font-black truncate">{title.trim() || 'Your Event Title'}</div>
                  </div>
                </div>
                <div className="p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">{eventType === 'online' ? 'Online' : venueName || city}</span>
                    <span className="font-bold text-[#0F172A]">
                      {Number(priceInr) > 0 ? `₹${priceInr}` : 'Free'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] line-clamp-2">{tagline || description}</p>
                </div>
              </div>
            </div>

            <div className="px-4">
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="w-full py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar for Mobile & Desktop Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] p-3 sm:p-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Previous / Back */}
          <div className="flex items-center gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs sm:text-sm font-bold text-[#0F172A] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#64748B] flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}

            {/* Mobile Preview Trigger Button */}
            <button
              type="button"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="lg:hidden px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#E8621A]" />
              <span>Preview</span>
            </button>
          </div>

          {/* Right: Next Step / Publish Live */}
          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Continue: {STEPS[currentStep].name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-[#E8621A]/30 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Publishing Event...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Publish Event Live ⚡</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
