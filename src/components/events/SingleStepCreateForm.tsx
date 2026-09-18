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

interface SingleStepCreateFormProps {
  mode?: 'ai' | 'manual';
}

export default function SingleStepCreateForm({ mode = 'manual' }: SingleStepCreateFormProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiPosterInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showAiAutofill, setShowAiAutofill] = useState(mode === 'ai');

  // AI Extraction Input State
  const [aiUrl, setAiUrl] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiPosterBase64, setAiPosterBase64] = useState<string | null>(null);
  const [aiPosterName, setAiPosterName] = useState<string | null>(null);
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Section 1: Basic Details
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Tech & AI');
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [polishSuccess, setPolishSuccess] = useState(false);

  // Section 2: Date & Location
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [eventType, setEventType] = useState<'in-person' | 'online'>('in-person');
  const [city, setCity] = useState('Mumbai');
  const [venueName, setVenueName] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');

  // Section 3: Cover & Media
  const [coverUrl, setCoverUrl] = useState(CATEGORY_PRESETS['Tech & AI'][0]);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Section 4: Tickets & Passes
  const [ticketingMode, setTicketingMode] = useState<'free' | 'paid' | 'external'>('free');
  const [priceInr, setPriceInr] = useState('499');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalPrice, setExternalPrice] = useState('₹499');
  const [capacity, setCapacity] = useState('50');
  const [approvalMode, setApprovalMode] = useState<'instant' | 'inspection'>('instant');

  // Attendee questions & confirmations
  const [askPhone, setAskPhone] = useState(true);
  const [askPlusOne, setAskPlusOne] = useState(false);
  const [askDietary, setAskDietary] = useState(false);
  const [askTshirt, setAskTshirt] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Custom question builder
  const [customQuestions, setCustomQuestions] = useState<
    Array<{ id: string; question: string; type: 'text' | 'choice'; options?: string[]; required: boolean }>
  >([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionRequired, setNewQuestionRequired] = useState(false);

  // Form submission & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update cover when category changes if user hasn't uploaded a custom flyer
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (!uploadedFileName && !customCoverUrl) {
      const presets = CATEGORY_PRESETS[newCat] || CATEGORY_PRESETS['Tech & AI'];
      setCoverUrl(presets[0]);
    }
  };

  // Upload custom cover file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isAiPoster: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isAiPoster) {
        setAiPosterBase64(result);
        setAiPosterName(file.name);
      } else {
        setCoverUrl(result);
        setUploadedFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Click AI Auto-Fill Trigger
  const handleExtractWithAI = async () => {
    if (!aiUrl.trim() && !aiPosterBase64 && !aiText.trim()) {
      setErrorMsg('Please upload a poster flyer, enter an event link, or write a short description.');
      return;
    }

    setIsExtractingAi(true);
    setErrorMsg(null);
    setAiSuccessMsg(null);

    try {
      const res = await fetch('/api/events/ai-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: aiUrl.trim() || undefined,
          poster_image: aiPosterBase64 || undefined,
          prompt: aiText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Extraction failed');

      if (data.title) setTitle(data.title);
      if (data.tagline) setTagline(data.tagline);
      if (data.description) setDescription(data.description);
      if (data.category && CATEGORIES.includes(data.category)) {
        setCategory(data.category);
      }
      if (data.city) setCity(data.city);
      if (data.venue_name) setVenueName(data.venue_name);
      if (data.date) setDate(data.date);
      if (data.start_time) setStartTime(data.start_time);
      if (data.end_time) setEndTime(data.end_time);
      if (data.cover_image_url) setCoverUrl(data.cover_image_url);

      setAiSuccessMsg('✨ Event details auto-filled successfully! Review and customize below.');
      setShowAiAutofill(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not extract event info.');
    } finally {
      setIsExtractingAi(false);
    }
  };

  // AI Description Enhancement
  const handlePolishDescription = async () => {
    if (!title.trim() && !description.trim()) {
      setErrorMsg('Please enter an event title or basic draft first.');
      return;
    }

    setIsEnhancing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Enhance and polish this event description for an urban Indian audience on Vibe. Make it evocative, clear, stylish, and engaging.
Event Title: ${title}
Category: ${category}
City: ${city}
Current Draft: ${description || tagline}`,
          type: 'description',
        }),
      });

      const data = await res.json();
      if (data.text) {
        setDescription(data.text);
        setPolishSuccess(true);
        setTimeout(() => setPolishSuccess(false), 3000);
      }
    } catch {
      setErrorMsg('Failed to enhance description with AI.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Add Custom Question
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setCustomQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        question: newQuestionText.trim(),
        type: 'text',
        required: newQuestionRequired,
      },
    ]);
    setNewQuestionText('');
    setNewQuestionRequired(false);
  };

  // Remove Custom Question
  const handleRemoveQuestion = (index: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit Handler
  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter an event title.');
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
        capacity: Number(capacity) || 50,
        is_public: isPublic,
        status: 'live',
        ai_generated: false,
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
          custom_questions: customQuestions.map((q) => q.question),
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 md:pb-24">
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
              Configure your gathering details, location, schedule, ticketing, and guest pass settings all in one place.
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
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
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

      {/* Split Studio Grid: Left All-in-One Form (7 cols) + Right Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Comprehensive Single-Stage Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* ========================================================================= */}
          {/* SECTION 1: Details & Story                                                */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>General Information</span>
                </h3>
                <p className="text-xs text-[#64748B] ml-8">Core identity and discovery settings</p>
              </div>
              <span className="text-[11px] font-semibold text-[#E8621A]">Required</span>
            </div>

            {/* Event Visibility */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Event Visibility
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isPublic
                      ? 'border-[#0F172A] bg-[#F8FAFC] shadow-xs'
                      : 'border-[#E2E8F0] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isPublic ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">Public Event</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                      Listed on discovery feed. Visible to attendees in your city.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    !isPublic
                      ? 'border-[#0F172A] bg-[#F8FAFC] shadow-xs'
                      : 'border-[#E2E8F0] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      !isPublic ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">Private Event (Invite Only)</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                      Unlisted from public feeds. Accessible strictly via direct link.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Event Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai Design & Chai Mixer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors"
              />
            </div>

            {/* Category & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
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
                  Tagline / Pitch
                </label>
                <input
                  type="text"
                  placeholder="A sharp 8-12 word description of the vibe"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                />
              </div>
            </div>

            {/* About the Experience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#475569]">
                  About the Experience
                </label>
                <button
                  type="button"
                  onClick={handlePolishDescription}
                  disabled={isEnhancing}
                  className="text-[11px] font-bold text-[#E8621A] hover:text-[#FF8C42] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isEnhancing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Polish with AI</span>
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Share what guests can expect, the atmosphere, agenda, and why they should join..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white resize-none"
              />
              {polishSuccess && (
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Description enhanced with AI!</span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: Date, Schedule & Venue                                         */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span>Date, Schedule & Venue</span>
                </h3>
                <p className="text-xs text-[#64748B] ml-8">Timings and physical or virtual location</p>
              </div>
              <span className="text-[11px] text-[#64748B]">Indian Standard Time (IST)</span>
            </div>

            {/* Date, Start Time & End Time on a Single Compact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Event Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-2.5 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-9 pr-2.5 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full pl-9 pr-2.5 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Event Format Toggle: In-Person vs Online */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Gathering Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEventType('in-person')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    eventType === 'in-person'
                      ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>In-Person Gathering</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventType('online')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    eventType === 'online'
                      ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Virtual / Online Stream</span>
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

                {/* Google Maps Preview Embed */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>Google Maps Coordinates</span>
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-[#E8621A] hover:underline flex items-center gap-1"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="h-28 w-full rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-100">
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
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Virtual Meeting Link / Stream URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/... or Google Meet link"
                    value={onlineUrl}
                    onChange={(e) => setOnlineUrl(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Secure link will only be revealed to confirmed guests upon RSVP.
                </p>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: Poster & Media                                                 */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>Event Cover & Flyer</span>
                </h3>
                <p className="text-xs text-[#64748B] ml-8">Preset curated artwork or custom flyer</p>
              </div>
            </div>

            {/* Curated Preset Themes for Selected Category */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#475569]">
                  Instant Curated Presets ({category})
                </span>
                <span className="text-[11px] text-[#64748B]">1-tap select</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(CATEGORY_PRESETS[category] || CATEGORY_PRESETS['Tech & AI']).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCoverUrl(url);
                      setUploadedFileName(null);
                    }}
                    className={`relative h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      coverUrl === url
                        ? 'border-[#E8621A] ring-2 ring-[#E8621A]/30 scale-[1.02]'
                        : 'border-transparent hover:border-slate-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image src={url} alt={`Preset ${i + 1}`} fill className="object-cover" unoptimized />
                    {coverUrl === url && (
                      <div className="absolute inset-0 bg-[#E8621A]/20 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-[#E8621A] text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload Dropzone */}
            <div className="pt-2 border-t border-[#F1F5F9]">
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Or Upload Custom Poster / Flyer
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, false)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0F172A] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-[#F8FAFC]"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] mx-auto flex items-center justify-center text-[#64748B] mb-1.5 shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#0F172A]">
                  {uploadedFileName ? `Attached: ${uploadedFileName}` : 'Drop flyer image here or click to browse'}
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">
                  Supports PNG, JPG, WebP up to 5MB (16:9 recommended)
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: Tickets, Passes & Guest Controls                               */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">4</span>
                  <span>Passes, Pricing & RSVP Controls</span>
                </h3>
                <p className="text-xs text-[#64748B] ml-8">Capacity, ticket tiers, and guest questionnaire</p>
              </div>
            </div>

            {/* Ticketing Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Ticket Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTicketingMode('free')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    ticketingMode === 'free'
                      ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Free RSVP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketingMode('paid')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    ticketingMode === 'paid'
                      ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>₹ Paid Pass</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketingMode('external')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    ticketingMode === 'external'
                      ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>External Link</span>
                </button>
              </div>
            </div>

            {/* Conditional Ticket Config */}
            {ticketingMode === 'paid' && (
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <label className="block text-xs font-semibold text-[#475569]">
                  Ticket Price (INR ₹)
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#64748B]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="499"
                    value={priceInr}
                    onChange={(e) => setPriceInr(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white font-bold"
                  />
                </div>
                <p className="text-[11px] text-[#64748B]">
                  0% platform host fees. Attendees pay directly via UPI / Card.
                </p>
              </div>
            )}

            {ticketingMode === 'external' && (
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    External Ticket Link *
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="url"
                      placeholder="https://in.bookmyshow.com/... or https://insider.in/..."
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">
                    Display Price Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹499 onwards"
                    value={externalPrice}
                    onChange={(e) => setExternalPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
              </div>
            )}

            {/* Capacity Limit & Approval Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Capacity Limit (Spots)
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    placeholder="50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Guest Pass Approval
                </label>
                <select
                  value={approvalMode}
                  onChange={(e) => setApprovalMode(e.target.value as 'instant' | 'inspection')}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                >
                  <option value="instant">Instant Pass (Immediate Confirmed)</option>
                  <option value="inspection">Host Approval (Screen Requests)</option>
                </select>
              </div>
            </div>

            {/* Attendee Info Requirements */}
            <div className="pt-2 border-t border-[#F1F5F9]">
              <span className="block text-xs font-semibold text-[#475569] mb-2">
                Required Attendee Information
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={askPhone}
                    onChange={(e) => setAskPhone(e.target.checked)}
                    className="rounded text-[#0F172A]"
                  />
                  <span>Phone / WhatsApp</span>
                </label>

                <label className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={askPlusOne}
                    onChange={(e) => setAskPlusOne(e.target.checked)}
                    className="rounded text-[#0F172A]"
                  />
                  <span>Allow +1 Guest</span>
                </label>

                <label className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={askDietary}
                    onChange={(e) => setAskDietary(e.target.checked)}
                    className="rounded text-[#0F172A]"
                  />
                  <span>Dietary Prefs</span>
                </label>

                <label className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-100">
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

            {/* Custom Question Builder */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-2.5">
              <span className="block text-xs font-semibold text-[#475569]">
                Custom Screening Questions
              </span>

              {customQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-medium text-[#0F172A] truncate">
                    {idx + 1}. {q.question} {q.required && <span className="text-red-500">*</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. What is your LinkedIn or portfolio link?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-[#64748B] px-2">
                  <input
                    type="checkbox"
                    checked={newQuestionRequired}
                    onChange={(e) => setNewQuestionRequired(e.target.checked)}
                    className="rounded text-[#0F172A]"
                  />
                  <span>Required</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  disabled={!newQuestionText.trim()}
                  className="py-1.5 px-3 rounded-xl bg-[#0F172A] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Confirmation Pass Message */}
            <div className="pt-2 border-t border-[#F1F5F9]">
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Post-Registration Confirmation Note
              </label>
              <input
                type="text"
                placeholder="e.g. Your pass is confirmed! Check your WhatsApp for gate directions."
                value={confirmationMessage}
                onChange={(e) => setConfirmationMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
              />
            </div>
          </div>

          {/* Primary Submit Area at bottom of form */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Ready to go live?</h4>
              <p className="text-xs text-[#64748B]">Publish your event to get a shareable pass link instantly.</p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E8621A]/30 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
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
          </div>
        </div>

        {/* Right Column: Persistent Sticky Live Preview (Desktop) */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E2E8F0] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <span className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Card Preview</span>
              </span>
              <span className="text-[11px] text-[#94A3B8]">Updates as you type</span>
            </div>

            {/* Event Card Attendee Preview */}
            <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow">
              {/* Cover Image */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                <Image
                  src={coverUrl}
                  alt={title || 'Event Cover'}
                  fill
                  className="object-cover transition-all duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badges on Card */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-black/60 backdrop-blur-md text-white border border-white/20">
                    {category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase backdrop-blur-md border ${
                      isPublic
                        ? 'bg-emerald-500/80 text-white border-emerald-400/40'
                        : 'bg-slate-900/80 text-amber-300 border-amber-400/30'
                    }`}
                  >
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                </div>

                {/* Bottom title info over photo */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {date} · {startTime} IST
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white leading-snug line-clamp-2 drop-shadow-md">
                    {title.trim() || 'Your Event Title'}
                  </h3>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[#64748B] truncate max-w-[190px]">
                    <MapPin className="w-3.5 h-3.5 text-[#E8621A] shrink-0" />
                    <span className="truncate">
                      {eventType === 'online' ? 'Online Gathering' : venueName || city}
                    </span>
                  </div>
                  <span className="font-extrabold text-[#0F172A]">
                    {ticketingMode === 'free'
                      ? 'Free RSVP'
                      : ticketingMode === 'paid'
                      ? `₹${priceInr}`
                      : externalPrice || 'Tickets'}
                  </span>
                </div>

                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {tagline || description || 'Add a compelling tagline or description to excite your guests.'}
                </p>

                {/* Host Profile Strip */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-[10px]">
                      {profile?.name ? profile.name[0]?.toUpperCase() : 'H'}
                    </div>
                    <span className="font-semibold text-[#0F172A] text-xs">
                      {profile?.name || 'Your Profile'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#E8621A]">
                    {capacity ? `${capacity} spots` : 'Open'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-Up Live Preview Drawer (Mobile Only) */}
      {showMobilePreview && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 pb-4">
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">Attendee Preview</span>
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
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
                      {ticketingMode === 'free' ? 'Free' : `₹${priceInr}`}
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
                className="w-full py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar for Mobile & Desktop (Direct Publish Action) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] p-3 sm:p-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Dashboard link & Mobile Preview */}
          <div className="flex items-center gap-2">
            <Link
              href="/create"
              className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#64748B] flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>

            {/* Mobile Preview Trigger Button */}
            <button
              type="button"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="lg:hidden px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#E8621A]" />
              <span>Preview</span>
            </button>
          </div>

          {/* Right: Direct Publish Action */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-[#E8621A]/30 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Publish Event Live ⚡</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
