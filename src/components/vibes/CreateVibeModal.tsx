'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Zap, Plus, MapPin, Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { saveEvent } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { getUserCity } from '@/lib/location';
import { nanoid } from 'nanoid';
import { getCategoryCover } from '@/lib/ai/eventExtractor';

interface CreateVibeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

export default function CreateVibeModal({ isOpen, onClose, onCreated }: CreateVibeModalProps) {
  const { profile } = useAuth();
  const [bridgePhone, setBridgePhone] = useState('');
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'quickform'>('whatsapp');

  // Quick form state
  const [activity, setActivity] = useState('cricket');
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState(() => (typeof window !== 'undefined' ? getUserCity() || 'Mumbai' : 'Mumbai'));
  const [limitSpots, setLimitSpots] = useState(false);
  const [spots, setSpots] = useState(8);
  const [timeText, setTimeText] = useState('Today in 2 hours');
  const [submitting, setSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const userCity = getUserCity();
      if (userCity && userCity !== 'All India' && userCity !== 'all') {
        setCity(userCity);
      }
      fetch('/api/whatsapp/bridge-info')
        .then((res) => res.json())
        .then((data) => {
          if (data.phone) setBridgePhone(data.phone);
          if (data.connected) setBridgeConnected(true);
        })
        .catch(() => {});
      setCreatedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const samplePrompts = [
    'Box cricket at Bandra Turf tonight 8 PM. Need 4 players!',
    'Midnight chai & co-working sprint at Marine Drive 11 PM',
    'Badminton doubles at Indiranagar 7:30 PM. 2 spots open',
    'Catan & gelato board games at Koramangala today 6 PM',
  ];

  const handleQuickFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) return;

    setSubmitting(true);

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${nanoid(5)}`;
    const newFlashEvent: any = {
      id: `flash-${nanoid(8)}`,
      organizer_id: profile?.id || 'org-flash',
      organizer_name: profile?.name || 'Spontaneous Host',
      organizer_handle: profile?.handle || 'flash_host',
      organizer_brand_color: '#075CE5',
      slug,
      title: title.trim(),
      tagline: `Spontaneous meetup in ${city} • ${timeText}`,
      description: `Spontaneous flash meetup for ${title.trim()} at ${locationName.trim()}, ${city}. Come join our squad!`,
      cover_image_url: getCategoryCover(activity, `${title} ${locationName}`),
      template: 'ember',
      theme: {
        palette: 'sunset',
        font: 'Inter',
        bg_style: 'solid',
        button_style: 'pill',
        custom_accent: '#075CE5',
      },
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: locationName.trim(),
      location_address: `${locationName.trim()}, ${city}`,
      city,
      start_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      timezone: 'Asia/Kolkata',
      capacity: limitSpots ? spots : 25,
      is_public: true,
      status: 'live',
      is_flash: true,
      flash_activity: activity,
      spots_limit: limitSpots ? spots : undefined,
      spots_filled: 1,
      vibe_cheers_count: 0,
      flash_tags: [activity.toUpperCase(), city, 'Instant Vibe'],
      faq: [
        { q: 'How do I join?', a: 'Tap Join Now to verify your spot instantly.' },
      ],
      rsvp_form_config: {
        ask_plus_one: true,
        ask_dietary: false,
        ask_tshirt: false,
        waitlist_enabled: true,
        is_flash: true,
        confirmation_message: `You're confirmed for ${title}!`,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveEvent(newFlashEvent);
    setSubmitting(false);
    setCreatedSuccess(true);
    if (onCreated) onCreated(slug);
  };

  const getWhatsAppPromptUrl = (promptText: string) => {
    const text = `/vibe ${promptText}`;
    return `https://wa.me/${bridgePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg bg-white dark:bg-[#141416] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white relative overflow-hidden transition-colors max-h-[90dvh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-20 w-56 h-56 bg-gradient-to-br from-[#075CE5]/10 to-purple-600/10 dark:from-[#075CE5]/20 dark:to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-white/70 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#075CE5] text-white flex items-center gap-1 shadow-xs">
            <Zap className="w-3 h-3 fill-white" />
            <span>Vibe Creator</span>
          </span>
          {bridgeConnected && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Bridge Online
            </span>
          )}
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
          Post a Flash Event in 10 Seconds
        </h3>
        <p className="text-xs text-slate-500 dark:text-white/60 mb-5">
          Spontaneous meetups made for right now — pickup cricket, midnight chai, co-working, or gaming.
        </p>

        {/* Tabs: WhatsApp vs Web Quick Form */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 mb-5 border border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-[#25D366] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 fill-current" />
            <span>Via WhatsApp Bridge</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quickform')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'quickform'
                ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant Web Post</span>
          </button>
        </div>

        {activeTab === 'whatsapp' ? (
          <div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-4 space-y-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white/90">
                💬 How to post using WhatsApp:
              </p>
              <ol className="text-xs text-slate-600 dark:text-white/70 space-y-1.5 list-decimal pl-4">
                <li>Tap below to open WhatsApp with the bridge bot.</li>
                <li>Send a message starting with <code className="bg-slate-200 dark:bg-black/50 px-1.5 py-0.5 rounded text-[#075CE5] font-mono font-bold">/vibe</code> followed by your plans.</li>
                <li>Gemini AI will extract details, publish it to Vibe Instant, and reply with your live link!</li>
              </ol>
            </div>

            <div className="mb-4">
              <p className="text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">
                Tap a template to launch WhatsApp:
              </p>
              <div className="space-y-2">
                {samplePrompts.map((p, idx) => (
                  <a
                    key={idx}
                    href={getWhatsAppPromptUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white/90 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span className="truncate pr-2 font-medium">{p}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#25D366] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            <a
              href={`https://wa.me/${bridgePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('/vibe ')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Open WhatsApp & Post Live Vibe</span>
            </a>
          </div>
        ) : (
          /* Web Quick Form */
          <div>
            {!createdSuccess ? (
              <form onSubmit={handleQuickFormSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1">
                    Activity Type
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'cricket', label: '🏏 Cricket' },
                      { id: 'badminton', label: '🏸 Badminton' },
                      { id: 'pickleball', label: '🏓 Pickleball' },
                      { id: 'coffee', label: '☕ Chai/Cafe' },
                      { id: 'games', label: '🎲 Games' },
                      { id: 'music', label: '🎸 Jam' },
                      { id: 'football', label: '⚽ Football' },
                      { id: 'other', label: '⚡ Other' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setActivity(act.id)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          activity === act.id
                            ? 'bg-[#075CE5] text-white border-[#075CE5] shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70'
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1">
                    What's the Plan? (Title)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6v6 Box Cricket Match at Turf"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 text-sm focus:outline-none focus:bg-white focus:border-[#075CE5] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1">
                      Venue / Turf Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bandra Urban Turf"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 text-sm focus:outline-none focus:bg-white focus:border-[#075CE5] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C1F26] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:bg-white focus:border-[#075CE5] transition-colors"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Pune">Pune</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1">
                    When?
                  </label>
                  <input
                    type="text"
                    value={timeText}
                    onChange={(e) => setTimeText(e.target.value)}
                    placeholder="e.g. Tonight at 8 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 text-sm focus:outline-none focus:bg-white focus:border-[#075CE5] transition-colors"
                  />
                </div>

                {/* Optional Spots / Max Persons Limit */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={limitSpots}
                      onChange={(e) => setLimitSpots(e.target.checked)}
                      className="rounded accent-[#075CE5] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 dark:text-white/90 font-semibold">
                      Need a specific number of players / persons?
                    </span>
                  </label>

                  {limitSpots && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                      <span className="text-xs text-slate-600 dark:text-white/60">How many spots / players needed?</span>
                      <input
                        type="number"
                        min={2}
                        max={100}
                        value={spots}
                        onChange={(e) => setSpots(parseInt(e.target.value, 10) || 8)}
                        className="w-20 px-3 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white text-sm text-center font-bold focus:outline-none focus:border-[#075CE5]"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 rounded-2xl bg-[#0038A8] hover:bg-[#173DAA] active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  style={{ color: '#FFFFFF', backgroundColor: '#0038A8' }}
                >
                  {submitting ? 'Publishing Vibe...' : '⚡ Post to Vibe Instant Stream'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">Vibe is Live!</h4>
                <p className="text-xs text-slate-600 dark:text-white/70 mb-4">
                  Your event is now showing in the Vibe Instant feed for users in {city}.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#075CE5] hover:bg-[#064ec7] text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  View in Instant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
