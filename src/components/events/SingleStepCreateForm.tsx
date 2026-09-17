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
  Layers
} from 'lucide-react';
import { EventItem } from '@/types';
import { saveEvent } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { POPULAR_CITIES, INDIAN_CITIES } from '@/lib/location';

// Curated high-res dynamic themes for instant cover selection
const CATEGORY_PRESETS: Record<string, string[]> = {
  'Tech & AI': [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  ],
  'Founders & Startups': [
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  ],
  'Design & Creative': [
    'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  ],
  'Music & Concerts': [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
  ],
  'Comedy & Standup': [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  ],
  'Nightlife & Parties': [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
  ],
  'Social & Mixers': [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  ],
  'Food & Drinks': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  ],
  'Wellness & Fitness': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
  ],
  'Culture & Baithak': [
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
  ],
  'Gaming & Esports': [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
  ],
  'Art & Exhibitions': [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80',
  ],
  'Workshops & Masterclasses': [
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
  ],
  'Private Salons & Dinners': [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  ],
  'Sports & Outdoors': [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
  ],
  'Other': [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  ],
};

const CATEGORIES = [
  'Tech & AI',
  'Founders & Startups',
  'Design & Creative',
  'Music & Concerts',
  'Comedy & Standup',
  'Nightlife & Parties',
  'Social & Mixers',
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
  const { profile, isStaff } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiPosterInputRef = useRef<HTMLInputElement>(null);

  // AI Extraction Input State
  const [aiUrl, setAiUrl] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiPosterBase64, setAiPosterBase64] = useState<string | null>(null);
  const [aiPosterName, setAiPosterName] = useState<string | null>(null);
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Basic Details
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('Tech & AI');

  // Privacy: Public vs Private / Personal Invite Only
  const [isPublic, setIsPublic] = useState(true);

  // Date & Time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');

  // Location
  const [eventType, setEventType] = useState<'in-person' | 'online'>('in-person');
  const [city, setCity] = useState('Mumbai');
  const [venueName, setVenueName] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');

  // Description & AI Polishing
  const [description, setDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [polishSuccess, setPolishSuccess] = useState(false);

  // Banner / Poster Options: 'upload' | 'link' | 'ai'
  const [bannerOption, setBannerOption] = useState<'upload' | 'link' | 'ai'>('ai');
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
  );
  const [customLinkInput, setCustomLinkInput] = useState('');

  // Admission / Ticketing / Capacity (Initial capacity = 0)
  const [ticketingMode, setTicketingMode] = useState<'native' | 'external'>('native');
  const [capacity, setCapacity] = useState('0'); // Initial capacity initialized to 0
  const [priceInr, setPriceInr] = useState('0');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalPrice, setExternalPrice] = useState('Free');

  // RSVP Form & Pass Controls (The Restored Original Pass Builder)
  const [approvalMode, setApprovalMode] = useState<'instant' | 'inspection'>('instant');
  const [askPhone, setAskPhone] = useState(true);
  const [askPlusOne, setAskPlusOne] = useState(false);
  const [askDietary, setAskDietary] = useState(false);
  const [askTshirt, setAskTshirt] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(
    'Your admission pass is confirmed! Check your email and WhatsApp for event check-in details.'
  );

  // Custom Registration Questions Proliferator
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

      setAiSuccessMsg('Event details extracted successfully. Please review the details below.');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg(err.message || 'AI extraction failed. Please enter details manually.');
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

  // Add Custom Question (Proliferator)
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

  // Form Submit Handler
  const handleSubmit = async (publishLive: boolean = true) => {
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
        capacity: Number(capacity) || 0, // 0 denotes unlimited
        is_public: isStaff ? isPublic : false, // Gated: requires superadmin approval before public listing
        status: isStaff && publishLive ? 'live' : 'draft', // Gated: superadmin review required
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

  // Google Maps Location Query for embed
  const mapSearchQuery =
    (venueName ? `${venueName}, ` : '') + (eventType === 'online' ? 'Online' : city);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Navigation & Header */}
      <div className="mb-8">
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] mb-3 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Creation Options</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              {mode === 'ai' ? 'Auto-Create Event with AI' : 'Manual Event Setup'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              {mode === 'ai'
                ? 'Provide a flyer poster, event link, or notes to automatically extract and structure your gathering.'
                : 'Configure your gathering details, location, schedule, ticketing, and guest pass settings.'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Extraction Workstation (Shown only when mode is 'ai') */}
      {mode === 'ai' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-sm mb-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F1F5F9]">
            <Wand2 className="w-4 h-4 text-[#0F172A]" />
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              AI Event Extraction
            </h2>
          </div>

          <div className="space-y-4">
            {/* Event URL */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Event Link / URL (Optional)
              </label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="url"
                  placeholder="https://in.bookmyshow.com/... or https://lu.ma/..."
                  value={aiUrl}
                  onChange={(e) => setAiUrl(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors placeholder:text-[#94A3B8]"
                />
              </div>
            </div>

            {/* Poster / Flyer Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Event Poster or Flyer (AI Vision OCR)
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
                className="w-full py-4 px-4 border border-dashed border-[#CBD5E1] hover:border-[#0F172A] rounded-xl bg-[#F8FAFC] text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#64748B]" />
                <span>
                  {aiPosterName ? `Attached: ${aiPosterName}` : 'Upload Poster Image (JPEG / PNG)'}
                </span>
              </button>
            </div>

            {/* Raw Notes / Prompt */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Raw Event Notes / Prompt
              </label>
              <textarea
                rows={3}
                placeholder="Paste event notes, description, or speaker details..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors resize-none placeholder:text-[#94A3B8]"
              />
            </div>

            {/* Scan Button */}
            <button
              type="button"
              onClick={handleExtractWithAI}
              disabled={isExtractingAi}
              className="w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isExtractingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing & Extracting Details...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-white" />
                  <span>Extract & Fill Details</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {aiSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{aiSuccessMsg}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(true);
        }}
        className="space-y-6"
      >
        {/* 1. General Information & Privacy */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              1. General Information
            </h2>
            <span className="text-[11px] text-[#64748B]">Required</span>
          </div>

          {/* Visibility: Public vs Private */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-2">
              Event Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  isPublic
                    ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
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
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  !isPublic
                    ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    !isPublic ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Private Event (Invite Only)</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                    Unlisted from public feeds. Accessible strictly via secret direct link.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mumbai Design & Chai Mixer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors font-medium placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Tagline & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Tagline / Pitch
              </label>
              <input
                type="text"
                placeholder="A sharp 8-12 word description of the vibe"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors placeholder:text-[#94A3B8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Date & Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              2. Date & Schedule
            </h2>
            <span className="text-[11px] text-[#64748B]">Indian Standard Time (IST)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Event Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                End Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Location & Live Google Map */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              3. Location & Venue
            </h2>
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setEventType('in-person')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  eventType === 'in-person' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                In-Person
              </button>
              <button
                type="button"
                onClick={() => setEventType('online')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  eventType === 'online' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Online
              </button>
            </div>
          </div>

          {eventType === 'in-person' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  >
                    {POPULAR_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {Object.values(INDIAN_CITIES)
                      .filter(
                        (c, idx, arr) =>
                          !c.popular && arr.findIndex((s) => s.name === c.name) === idx
                      )
                      .map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Venue Name & Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Subko Bandra or WeWork Galaxy"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white placeholder:text-[#94A3B8]"
                  />
                </div>
              </div>

              {/* In-Place Live Google Map Embed */}
              <div className="mt-3 rounded-xl border border-[#E2E8F0] overflow-hidden bg-[#F8FAFC]">
                <div className="px-3.5 py-2 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#475569] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0F172A]" />
                    <span>Map Location: {mapSearchQuery}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      mapSearchQuery
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F172A] hover:underline"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="h-44 w-full bg-[#E2E8F0] relative">
                  <iframe
                    title="Venue Location Preview"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      mapSearchQuery
                    )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    className="border-0 w-full h-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Virtual Meeting URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="url"
                  placeholder="https://meet.google.com/... or https://zoom.us/..."
                  value={onlineUrl}
                  onChange={(e) => setOnlineUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Description & Polish with AI */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              4. Event Description
            </h2>
            <button
              type="button"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F172A]" />
                  <span>Polishing...</span>
                </>
              ) : polishSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Updated!</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-[#0F172A]" />
                  <span>Polish with AI</span>
                </>
              )}
            </button>
          </div>

          <textarea
            rows={5}
            placeholder="Write details about the gathering, agenda, schedule, and who should attend..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors leading-relaxed placeholder:text-[#94A3B8]"
          />
        </div>

        {/* 5. Cover Image Banner */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              5. Cover Image
            </h2>
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setBannerOption('upload')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  bannerOption === 'upload' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </button>
              <button
                type="button"
                onClick={() => setBannerOption('link')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  bannerOption === 'link' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                <Link2 className="w-3 h-3" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => setBannerOption('ai')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  bannerOption === 'ai' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>Presets</span>
              </button>
            </div>
          </div>

          {bannerOption === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, false)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 border border-dashed border-[#CBD5E1] hover:border-[#0F172A] rounded-xl bg-[#F8FAFC] text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#64748B]" />
                <span>Choose Image from Computer (JPEG, PNG, WebP)</span>
              </button>
            </div>
          )}

          {bannerOption === 'link' && (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={customLinkInput}
                onChange={(e) => setCustomLinkInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white placeholder:text-[#94A3B8]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customLinkInput.trim()) {
                    setCoverUrl(customLinkInput.trim());
                    setCustomLinkInput('');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold cursor-pointer"
              >
                Set URL
              </button>
            </div>
          )}

          {bannerOption === 'ai' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs text-[#475569]">
                Theme preset curated for <strong>{category}</strong>.
              </div>
              <button
                type="button"
                onClick={handleGenerateAiCover}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-xs font-semibold text-[#0F172A] cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Shuffle Preset</span>
              </button>
            </div>
          )}

          {/* Cover Preview */}
          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
            <Image
              src={coverUrl}
              alt="Event cover banner"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        {/* 6. Attendee Registration & Passes (Restored Original Pass Builder) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                6. Attendee Registration & Passes
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Configure admission passes, guest approval rules, and questions.
              </p>
            </div>
          </div>

          {/* Approval Mode */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-2">
              Pass Issuance Policy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  approvalMode === 'instant'
                    ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="approvalMode"
                  value="instant"
                  checked={approvalMode === 'instant'}
                  onChange={() => setApprovalMode('instant')}
                  className="mt-0.5 text-[#0F172A] focus:ring-[#0F172A]"
                />
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Instant Pass Issuance</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                    Attendees instantly receive confirmed digital passes with QR codes upon RSVP.
                  </div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  approvalMode === 'inspection'
                    ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="approvalMode"
                  value="inspection"
                  checked={approvalMode === 'inspection'}
                  onChange={() => setApprovalMode('inspection')}
                  className="mt-0.5 text-[#0F172A] focus:ring-[#0F172A]"
                />
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Host Approval Required</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                    RSVP requests are placed on waitlist. Passes are issued only after host approval.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Standard Attendee Questions with Icons */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-semibold text-[#475569] block">
              Standard Attendee Requirements
            </span>

            {/* Email - Always Mandatory */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#64748B]" />
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Attendee Email Address
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Mandatory for digital pass delivery & verification
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Required</span>
            </div>

            {/* WhatsApp Phone */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#64748B]" />
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Require WhatsApp Phone Number
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Used for door coordination & event updates
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={askPhone}
                onChange={(e) => setAskPhone(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F172A] focus:ring-[#0F172A]"
              />
            </label>

            {/* Plus One Guest */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#64748B]" />
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Allow +1 Guest Name
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Permits guests to register an accompanying friend
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={askPlusOne}
                onChange={(e) => setAskPlusOne(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F172A] focus:ring-[#0F172A]"
              />
            </label>

            {/* Dietary Preference */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4 text-[#64748B]" />
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Ask Dietary Preferences
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Vegetarian, Vegan, Jain friendly preferences
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={askDietary}
                onChange={(e) => setAskDietary(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F172A] focus:ring-[#0F172A]"
              />
            </label>

            {/* Merch / T-Shirt Size */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <Shirt className="w-4 h-4 text-[#64748B]" />
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Ask Merch / T-Shirt Size
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    For runs, tournaments, and retreats
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={askTshirt}
                onChange={(e) => setAskTshirt(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F172A] focus:ring-[#0F172A]"
              />
            </label>
          </div>

          {/* Custom Questions Proliferator */}
          <div className="pt-4 border-t border-[#F1F5F9] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#475569]">
                Custom Attendee Questions
              </span>
              <button
                type="button"
                onClick={() => setIsAddingQuestion(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {/* Render dynamically added custom questions */}
            {customQuestions.map((q, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[#0F172A]">
                  <HelpCircle className="w-4 h-4 text-[#64748B] shrink-0" />
                  <span>{q}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(idx)}
                  className="p-1 rounded text-[#94A3B8] hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Input to add a new question */}
            {isAddingQuestion && (
              <div className="flex gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <input
                  type="text"
                  placeholder="e.g. LinkedIn / Twitter profile or company name"
                  value={newQuestionInput}
                  onChange={(e) => setNewQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuestion();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0F172A] bg-white placeholder:text-[#94A3B8]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingQuestion(false);
                    setNewQuestionInput('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Pass Confirmation Message */}
          <div className="pt-4 border-t border-[#F1F5F9]">
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Pass Confirmation Message
            </label>
            <textarea
              rows={2}
              value={confirmationMessage}
              onChange={(e) => setConfirmationMessage(e.target.value)}
              placeholder="Instructions shown to guests on their digital pass receipt..."
              className="w-full px-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white resize-none placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {/* 7. Capacity & Ticketing */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              7. Capacity & Ticketing
            </h2>
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setTicketingMode('native')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  ticketingMode === 'native' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Native Vibe RSVP
              </button>
              <button
                type="button"
                onClick={() => setTicketingMode('external')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  ticketingMode === 'external'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B]'
                }`}
              >
                External Ticketing
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                Maximum Capacity
              </label>
              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">Set to 0 for unlimited capacity.</p>
            </div>

            {ticketingMode === 'native' ? (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Ticket Price (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for Free"
                    value={priceInr}
                    onChange={(e) => setPriceInr(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white"
                  />
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Enter 0 for complimentary free admission.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Ticket Price Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹499 or Starting at ₹999"
                  value={externalPrice}
                  onChange={(e) => setExternalPrice(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white placeholder:text-[#94A3B8]"
                />
              </div>
            )}
          </div>

          {ticketingMode === 'external' && (
            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                External Ticketing URL *
              </label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="url"
                  required
                  placeholder="https://in.bookmyshow.com/... or https://insider.in/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-4 h-4 text-[#E8621A] shrink-0" />
            <span>
              {isStaff
                ? 'Superadmin session active: immediate live publishing enabled.'
                : 'All creations pass superadmin verification before appearing in public discovery.'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Submitting...</span>
                </>
              ) : isStaff ? (
                <span>Publish Event Live</span>
              ) : (
                <span>Submit for Superadmin Approval</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
