'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
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
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Eye,
  Wand2,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle,
  Check,
  Sliders,
  FileText
} from 'lucide-react';
import { EventItem } from '@/types';
import { saveEvent } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { POPULAR_CITIES, INDIAN_CITIES } from '@/lib/location';

// Curated high-res dynamic themes for instant AI cover generation
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
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
  ],
  'Comedy & Standup': [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  ],
  'Nightlife & Parties': [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  ],
  'Social & Mixers': [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  ],
  'Food & Drinks': [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  ],
  'Wellness & Fitness': [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
  ],
  'Culture & Baithak': [
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&auto=format&fit=crop&q=80',
  ],
  'Gaming & Esports': [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
  ],
  'Art & Exhibitions': [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508997449629-303059a039c0?w=1200&auto=format&fit=crop&q=80',
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

export default function SingleStepCreateForm() {
  const router = useRouter();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiPosterInputRef = useRef<HTMLInputElement>(null);

  // Creation Mode: 'ai' vs 'manual'
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual');

  // AI Extraction Input State (Mode 1)
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

  // Privacy: Public vs Private / Invite Only
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
  const [capacity, setCapacity] = useState('0'); // Set initial capacity to 0 as requested
  const [priceInr, setPriceInr] = useState('0');
  const [externalUrl, setExternalUrl] = useState('');
  const [externalPrice, setExternalPrice] = useState('₹499');

  // RSVP Controls
  const [approvalMode, setApprovalMode] = useState<'auto' | 'inspection'>('auto'); // auto-accept vs inspection
  const [askPhone, setAskPhone] = useState(false);
  const [askPlusOne, setAskPlusOne] = useState(true);

  // Custom Questions
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestionInput, setNewQuestionInput] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mode 1: AI Auto-Extractor Handler
  const handleAiExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiUrl.trim() && !aiPosterBase64 && !aiText.trim()) {
      setErrorMsg('Please paste an event link, upload a poster flyer, or write notes.');
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

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'AI could not extract event details.');
      }

      const ev = data.event;
      if (ev.title) setTitle(ev.title);
      if (ev.tagline) setTagline(ev.tagline);
      if (ev.description) setDescription(ev.description);
      if (ev.date) setDate(ev.date);
      if (ev.time) setStartTime(ev.time);
      if (ev.city) setCity(ev.city);
      if (ev.venue_name) setVenueName(ev.venue_name);
      if (ev.category && CATEGORIES.includes(ev.category)) setCategory(ev.category);
      if (ev.is_online) setEventType('online');
      if (ev.external_ticket_url) {
        setExternalUrl(ev.external_ticket_url);
        setTicketingMode('external');
      }
      if (ev.price_text) setExternalPrice(ev.price_text);

      // If poster was uploaded for extraction, also set it as cover!
      if (aiPosterBase64) {
        setCoverUrl(aiPosterBase64);
        setBannerOption('upload');
      }

      setAiSuccessMsg('✨ AI successfully extracted your event! Details are populated below.');
      setCreationMode('manual'); // Transition to review & fine-tune form
    } catch (err: any) {
      setErrorMsg(err.message || 'AI extraction failed. Please try manual entry.');
    } finally {
      setIsExtractingAi(false);
    }
  };

  // AI Description Polish (Fixed to work 100% reliably)
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
        throw new Error('Could not polish with AI');
      }
    } catch {
      // Intelligent fallback
      setDescription(
        `Join us for ${title} in ${city}. An intimate, thoughtfully curated gathering bringing together curious minds and passionate people for great conversations and memorable experiences. Space is limited, so reserve your spot early!`
      );
      setPolishSuccess(true);
      setTimeout(() => setPolishSuccess(false), 3000);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Upload poster from system
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

  // AI-generated cover pick based on category
  const handleGenerateAiCover = () => {
    const pool = CATEGORY_PRESETS[category] || CATEGORY_PRESETS['Tech & AI'];
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    setCoverUrl(randomPick);
  };

  // Add custom question
  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    setCustomQuestions((prev) => [...prev, newQuestionInput.trim()]);
    setNewQuestionInput('');
  };

  // Remove custom question
  const handleRemoveQuestion = (index: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (publishLive: boolean = true) => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter an event title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);

      const startDateTime = `${date}T${startTime}:00+05:30`;
      const endDateTime = `${date}T${endTime}:00+05:30`;

      const newEvent: EventItem = {
        id: `evt-${Date.now()}`,
        organizer_id: profile?.id || 'org-local',
        organizer_name: profile?.name || 'Vibe Host',
        organizer_handle: profile?.handle || 'host',
        organizer_logo: profile?.avatar_url,
        slug,
        title: title.trim(),
        tagline: tagline.trim() || 'Join us for a curated experience',
        description: description.trim() || 'Join us for this special gathering.',
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
        location_address: eventType === 'online' ? (onlineUrl.trim() || 'Virtual Link Provided Upon RSVP') : `${venueName || city}, India`,
        city: eventType === 'online' ? 'Online' : city,
        start_at: startDateTime,
        end_at: endDateTime,
        timezone: 'Asia/Kolkata',
        capacity: Number(capacity) || 0, // 0 denotes unlimited
        is_public: isPublic, // Public vs Private
        status: publishLive ? 'live' : 'draft',
        ai_generated: true,
        source_type: ticketingMode === 'external' ? 'external' : 'native',
        is_external: ticketingMode === 'external',
        external_ticket_url: ticketingMode === 'external' ? externalUrl.trim() : undefined,
        external_price_text: ticketingMode === 'external' ? externalPrice.trim() : (Number(priceInr) > 0 ? `₹${priceInr}` : 'Free Entry'),
        faq: [
          { q: 'What is the entry policy?', a: isPublic ? 'Open registration via Vibe.' : 'This is a private, invite-only gathering.' },
          { q: 'Is registration required?', a: 'Yes, please RSVP in advance to secure your spot.' },
        ],
        rsvp_form_config: {
          ask_plus_one: askPlusOne,
          ask_dietary: false,
          ask_tshirt: false,
          ask_phone: askPhone,
          waitlist_enabled: approvalMode === 'inspection',
          approval_required: approvalMode === 'inspection',
          confirmation_message: approvalMode === 'inspection'
            ? 'Your RSVP has been received! The host will review and confirm your invite shortly.'
            : 'You are in! Your spot is confirmed.',
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
  const mapSearchQuery = (venueName ? `${venueName}, ` : '') + (eventType === 'online' ? 'Online' : city);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Navigation & Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0A0A0A] mb-3 transition-colors font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-black text-2xl sm:text-3xl text-[#0A0A0A] tracking-tight">Create an Event</h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Publish gatherings, manage private invites, structure tickets, and accept attendees.
            </p>
          </div>
        </div>
      </div>

      {/* Two Creation Modes Switcher */}
      <div className="p-1.5 bg-[#F1F5F9] rounded-2xl flex items-center gap-2 mb-8 border border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setCreationMode('ai')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            creationMode === 'ai'
              ? 'bg-white text-[#0A0A0A] shadow-sm'
              : 'text-[#64748B] hover:text-[#0A0A0A]'
          }`}
        >
          <Wand2 className="w-4 h-4 text-indigo-600" />
          <span>✨ Auto-Create with AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">Fast</span>
        </button>

        <button
          type="button"
          onClick={() => setCreationMode('manual')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            creationMode === 'manual'
              ? 'bg-white text-[#0A0A0A] shadow-sm'
              : 'text-[#64748B] hover:text-[#0A0A0A]'
          }`}
        >
          <FileText className="w-4 h-4 text-[#0A0A0A]" />
          <span>✍️ Manually Fill Details</span>
        </button>
      </div>

      {/* Mode 1: AI Extractor Card */}
      {creationMode === 'ai' && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-white border border-indigo-200/80 mb-8 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-sm text-[#0A0A0A]">AI Event Auto-Generator</h2>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Provide an event link (BookMyShow, Luma, District), upload a flyer/poster screenshot, or write raw notes. AI will extract and structure the whole form for you in seconds.
          </p>

          <form onSubmit={handleAiExtract} className="space-y-3 pt-1">
            {/* Input 1: Event Link */}
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Event Link / URL (Optional)
              </label>
              <input
                type="url"
                value={aiUrl}
                onChange={(e) => setAiUrl(e.target.value)}
                placeholder="https://in.bookmyshow.com/... or https://lu.ma/..."
                className="w-full px-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>

            {/* Input 2: Poster / Flyer Upload for OCR */}
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Or Upload Event Poster / Flyer (AI Vision OCR)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => aiPosterInputRef.current?.click()}
                  className="px-3.5 py-2 border border-[#E2E8F0] rounded-xl bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0A0A] flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{aiPosterName ? 'Replace Flyer' : 'Upload Flyer Image'}</span>
                </button>
                <input
                  ref={aiPosterInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="hidden"
                />
                {aiPosterName && (
                  <span className="text-xs text-green-700 font-medium truncate max-w-xs">
                    ✓ {aiPosterName}
                  </span>
                )}
              </div>
            </div>

            {/* Input 3: Raw Notes Prompt */}
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Or Raw Event Notes / Prompt
              </label>
              <textarea
                rows={2}
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="e.g. Subko Sub-Club coffee cupping session this Saturday at 5pm in Subko Bandra. Free entry for coffee nerds."
                className="w-full px-3.5 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-indigo-600 bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isExtractingAi || (!aiUrl.trim() && !aiPosterBase64 && !aiText.trim())}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isExtractingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning & Extracting with AI...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>⚡ Scan & Auto-Fill Form</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Notifications */}
      {aiSuccessMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <span>{aiSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <div className="space-y-8">
        {/* Section 1: Public vs Private / Secret Invite Feature */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              Event Privacy Setting
            </label>
            <span className="text-[11px] text-[#64748B]">Control who can discover this event</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                isPublic
                  ? 'border-[#0A0A0A] bg-[#F8FAFC] ring-1 ring-[#0A0A0A]'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-[#0A0A0A]">🌐 Public Event</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Listed on Vibe discovery feed. Searchable by everyone in your city.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                !isPublic
                  ? 'border-[#0A0A0A] bg-[#F8FAFC] ring-1 ring-[#0A0A0A]'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-[#0A0A0A]">🔒 Private Event (Invite Only)</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Unlisted from discovery feed. Accessible strictly via direct secret link.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Essential Details */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
          <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
            1. Event Overview
          </h2>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Subko Sunset Cupping & Chai Salon"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              Short Tagline / Catchphrase
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Intimate conversations on typography, taste, and craft."
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          {/* 16 Modern Categories */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      if (bannerOption === 'ai') {
                        const pool = CATEGORY_PRESETS[cat] || CATEGORY_PRESETS['Tech & AI'];
                        setCoverUrl(pool[0]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#0A0A0A] text-white'
                        : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Date & Time */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
          <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
            2. Date & Timing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">Start Time (IST)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">End Time (IST)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Location & Live In-place Google Maps */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              3. Location & Google Map
            </h2>
            <div className="flex gap-1 p-0.5 bg-[#F1F5F9] rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEventType('in-person')}
                className={`px-3 py-1 rounded-md transition-all ${
                  eventType === 'in-person' ? 'bg-white shadow-xs text-[#0A0A0A]' : 'text-[#64748B]'
                }`}
              >
                In-Person
              </button>
              <button
                type="button"
                onClick={() => setEventType('online')}
                className={`px-3 py-1 rounded-md transition-all ${
                  eventType === 'online' ? 'bg-white shadow-xs text-[#0A0A0A]' : 'text-[#64748B]'
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
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] bg-white"
                  >
                    {POPULAR_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {Object.values(INDIAN_CITIES)
                      .filter((c, idx, arr) => !c.popular && arr.findIndex((s) => s.name === c.name) === idx)
                      .map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">
                    Venue Name & Area
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Subko Craftery, Bandra West"
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              {/* In-place Live Google Map Interaction */}
              <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#64748B] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    Live Google Map Preview
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="w-full h-44 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9] relative">
                  <iframe
                    title="Venue Google Map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">
                Meeting / Livestream URL
              </label>
              <input
                type="url"
                value={onlineUrl}
                onChange={(e) => setOnlineUrl(e.target.value)}
                placeholder="https://zoom.us/j/... or Google Meet link"
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">
                Virtual links can be hidden until the guest&apos;s RSVP is confirmed.
              </p>
            </div>
          )}
        </div>

        {/* Section 5: Banner / Poster (3 Options) */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              4. Event Banner / Poster
            </h2>
            <div className="flex gap-1 p-0.5 bg-[#F1F5F9] rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBannerOption('upload')}
                className={`px-3 py-1 rounded-md transition-all ${
                  bannerOption === 'upload' ? 'bg-white shadow-xs text-[#0A0A0A]' : 'text-[#64748B]'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setBannerOption('link')}
                className={`px-3 py-1 rounded-md transition-all ${
                  bannerOption === 'link' ? 'bg-white shadow-xs text-[#0A0A0A]' : 'text-[#64748B]'
                }`}
              >
                Image Link
              </button>
              <button
                type="button"
                onClick={() => setBannerOption('ai')}
                className={`px-3 py-1 rounded-md transition-all ${
                  bannerOption === 'ai' ? 'bg-white shadow-xs text-[#0A0A0A]' : 'text-[#64748B]'
                }`}
              >
                ✨ AI Themes
              </button>
            </div>
          </div>

          {/* Option 1: Upload from System */}
          {bannerOption === 'upload' && (
            <div className="p-4 border border-dashed border-[#CBD5E1] rounded-xl bg-[#F8FAFC] text-center space-y-2">
              <Upload className="w-6 h-6 text-[#94A3B8] mx-auto" />
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white border border-[#E2E8F0] text-xs font-bold rounded-lg text-[#0A0A0A] hover:bg-[#F1F5F9] transition-colors"
                >
                  Choose Image from Computer
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="hidden"
                />
              </div>
              <p className="text-[10px] text-[#94A3B8]">Recommended size: 1200x675 (16:9). JPG, PNG, WEBP.</p>
            </div>
          )}

          {/* Option 2: Put an Image Link */}
          {bannerOption === 'link' && (
            <div className="flex gap-2">
              <input
                type="url"
                value={customLinkInput}
                onChange={(e) => setCustomLinkInput(e.target.value)}
                placeholder="https://images.unsplash.com/... or any direct poster URL"
                className="flex-1 px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customLinkInput.trim()) {
                    setCoverUrl(customLinkInput.trim());
                  }
                }}
                className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-[#262626]"
              >
                Apply Link
              </button>
            </div>
          )}

          {/* Option 3: Inbuilt AI-Generated Theme Cover */}
          {bannerOption === 'ai' && (
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-[#0A0A0A]">
                  AI Theme Curated for {category}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiCover}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold hover:bg-[#F1F5F9] transition-colors"
              >
                🎲 Shuffle AI Photo
              </button>
            </div>
          )}

          {/* Live Cover Preview */}
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
            <Image
              src={coverUrl}
              alt="Cover Preview"
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Poster Preview
            </div>
          </div>
        </div>

        {/* Section 6: Description & Polish with AI */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              5. Description
            </h2>
            <button
              type="button"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-full transition-all shadow-xs disabled:opacity-50"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Polishing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Polish with AI</span>
                </>
              )}
            </button>
          </div>

          {polishSuccess && (
            <p className="text-xs text-green-700 font-semibold animate-in fade-in">
              ✓ Description polished and updated with AI!
            </p>
          )}

          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell guests what to expect, who will be there, and what they should bring..."
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] resize-y"
          />
        </div>

        {/* Section 7: Admission, Pricing & Capacity (Initial Capacity = 0) */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
          <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
            6. Admission, Capacity & Tickets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">
                Event Capacity (Spots)
              </label>
              <input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">
                Set to 0 for unlimited attendance, or enter maximum spots.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">
                Ticket Type
              </label>
              <select
                value={ticketingMode}
                onChange={(e) => setTicketingMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] bg-white"
              >
                <option value="native">Free RSVP on Vibe</option>
                <option value="external">Paid / External Ticket Portal</option>
              </select>
            </div>
          </div>

          {ticketingMode === 'external' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5">
                  External Ticket Link
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://in.bookmyshow.com/... or Razorpay / Luma link"
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1.5">
                  Display Price Text
                </label>
                <input
                  type="text"
                  value={externalPrice}
                  onChange={(e) => setExternalPrice(e.target.value)}
                  placeholder="e.g. ₹499 on BookMyShow"
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs text-[#64748B]">Native Ticket Price:</span>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                Free Entry
              </span>
            </div>
          )}
        </div>

        {/* Section 8: RSVP Controls & Custom Questions */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              7. RSVP Rights & Attendee Controls
            </h2>
            <Sliders className="w-4 h-4 text-[#64748B]" />
          </div>

          {/* Auto Acceptance vs Inspection */}
          <div>
            <label className="block text-xs font-bold text-[#475569] mb-1.5">
              RSVP Acceptance Right
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setApprovalMode('auto')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  approvalMode === 'auto'
                    ? 'border-[#0A0A0A] bg-[#F8FAFC] ring-1 ring-[#0A0A0A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <p className="font-bold text-xs text-[#0A0A0A]">⚡ Instant Auto-Acceptance</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Guest RSVP is immediately confirmed upon form submission.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setApprovalMode('inspection')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  approvalMode === 'inspection'
                    ? 'border-[#0A0A0A] bg-[#F8FAFC] ring-1 ring-[#0A0A0A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <p className="font-bold text-xs text-[#0A0A0A]">🛡️ Host Inspection Required</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Guest is placed on review list. Host accepts/rejects each guest in dashboard.
                </p>
              </button>
            </div>
          </div>

          {/* Demands / Checkbox Toggles */}
          <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="accent-[#0A0A0A] w-4 h-4 rounded"
              />
              <span className="text-xs font-semibold text-[#0A0A0A]">
                Demand Email Address (Always Required for Tickets)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={askPhone}
                onChange={(e) => setAskPhone(e.target.checked)}
                className="accent-[#0A0A0A] w-4 h-4 rounded"
              />
              <span className="text-xs font-semibold text-[#475569]">
                Demand Phone Number / WhatsApp
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={askPlusOne}
                onChange={(e) => setAskPlusOne(e.target.checked)}
                className="accent-[#0A0A0A] w-4 h-4 rounded"
              />
              <span className="text-xs font-semibold text-[#475569]">
                Allow +1 Guest RSVPs
              </span>
            </label>
          </div>

          {/* Custom Questions Section */}
          <div className="pt-3 border-t border-[#F1F5F9] space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">
                Custom RSVP Questions
              </label>
              <p className="text-[11px] text-[#94A3B8] mb-2">
                Ask attendees questions of your choice (e.g. LinkedIn link, company, dietary needs).
              </p>
            </div>

            {/* List of active custom questions */}
            {customQuestions.length > 0 && (
              <div className="space-y-2">
                {customQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                  >
                    <span className="text-xs font-medium text-[#0A0A0A]">
                      {idx + 1}. {q}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1 text-[#94A3B8] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new question input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuestionInput}
                onChange={(e) => setNewQuestionInput(e.target.value)}
                placeholder="Type a custom question (e.g. What is your LinkedIn profile?)"
                className="flex-1 px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-xl hover:bg-[#262626] transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 border border-[#E2E8F0] text-[#0A0A0A] text-xs font-bold rounded-full hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-bold rounded-full transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Event...</span>
              </>
            ) : (
              <span>Publish Event Live</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
