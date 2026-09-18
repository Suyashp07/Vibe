'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Zap, Plus, MapPin, Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { saveEvent } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { nanoid } from 'nanoid';

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
  const [city, setCity] = useState('Mumbai');
  const [spots, setSpots] = useState(8);
  const [timeText, setTimeText] = useState('Today in 2 hours');
  const [submitting, setSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

    const FLASH_COVERS: Record<string, string> = {
      cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
      football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
      badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
      pickleball: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
      coffee: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      games: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
      music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
      other: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    };

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${nanoid(5)}`;
    const newFlashEvent: any = {
      id: `flash-${nanoid(8)}`,
      organizer_id: profile?.id || 'org-flash',
      organizer_name: profile?.name || 'Spontaneous Host',
      organizer_handle: profile?.handle || 'flash_host',
      organizer_brand_color: '#E8621A',
      slug,
      title: title.trim(),
      tagline: `Spontaneous meetup in ${city} • ${timeText}`,
      description: `Spontaneous flash meetup for ${title.trim()} at ${locationName.trim()}, ${city}. Come join our squad!`,
      cover_image_url: FLASH_COVERS[activity] || FLASH_COVERS['other'],
      template: 'ember',
      theme: {
        palette: 'sunset',
        font: 'Inter',
        bg_style: 'solid',
        button_style: 'pill',
        custom_accent: '#E8621A',
      },
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: locationName.trim(),
      location_address: `${locationName.trim()}, ${city}`,
      city,
      start_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      timezone: 'Asia/Kolkata',
      capacity: spots,
      is_public: true,
      status: 'live',
      ai_generated: false,
      is_flash: true,
      flash_activity: activity,
      spots_limit: spots,
      spots_filled: 1,
      whatsapp_host_phone: profile?.phone || bridgePhone,
      vibe_cheers_count: 1,
      flash_tags: [activity, city, 'Flash Vibe'],
      faq: [
        { q: 'What do I need to bring?', a: 'Just bring your good energy and casual gear!' }
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg bg-[#111318] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-20 w-56 h-56 bg-gradient-to-br from-[#E8621A]/30 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8621A] text-white flex items-center gap-1 shadow-xs">
            <Zap className="w-3 h-3 fill-white" />
            <span>Flash Vibe Creator</span>
          </span>
          {bridgeConnected && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              WhatsApp Bridge Online
            </span>
          )}
        </div>

        <h3 className="text-xl font-black text-white mb-1">
          Post a Flash Event in 10 Seconds
        </h3>
        <p className="text-xs text-white/60 mb-5">
          Spontaneous meetups made for right now — pickup cricket, midnight chai, co-working, or gaming.
        </p>

        {/* Tabs: WhatsApp vs Web Quick Form */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-5 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'whatsapp'
                ? 'bg-[#25D366] text-black shadow-md'
                : 'text-white/60 hover:text-white'
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
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant Web Post</span>
          </button>
        </div>

        {activeTab === 'whatsapp' ? (
          <div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 space-y-2">
              <p className="text-xs font-semibold text-white/90">
                💬 How to post using WhatsApp:
              </p>
              <ol className="text-xs text-white/70 space-y-1.5 list-decimal pl-4">
                <li>Tap below to open WhatsApp with the bridge bot.</li>
                <li>Send a message starting with <code className="bg-black/50 px-1.5 py-0.5 rounded text-[#E8621A] font-mono">/vibe</code> followed by your plans.</li>
                <li>Gemini AI will extract details, publish it to Vibe Instant, and reply with your live link!</li>
              </ol>
            </div>

            <div className="mb-4">
              <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
                Tap a template to launch WhatsApp:
              </p>
              <div className="space-y-2">
                {samplePrompts.map((p, idx) => (
                  <a
                    key={idx}
                    href={getWhatsAppPromptUrl(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-xs text-white/90 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{p}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#25D366] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            <a
              href={`https://wa.me/${bridgePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('/vibe ')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>Open WhatsApp & Post Live Vibe</span>
            </a>
          </div>
        ) : (
          /* Web Quick Form */
          <div>
            {!createdSuccess ? (
              <form onSubmit={handleQuickFormSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
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
                            ? 'bg-[#E8621A] text-white border-[#E8621A]'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                    What's the Plan? (Title)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6v6 Box Cricket Match at Turf"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                      Venue / Turf Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bandra Urban Turf"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1C1F26] border border-white/10 text-white text-sm focus:outline-none focus:border-[#E8621A]"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Pune">Pune</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                      Spots / Max Players
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={spots}
                      onChange={(e) => setSpots(parseInt(e.target.value, 10) || 8)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#E8621A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                      When?
                    </label>
                    <input
                      type="text"
                      value={timeText}
                      onChange={(e) => setTimeText(e.target.value)}
                      placeholder="e.g. Tonight at 8 PM"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#E8621A]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#E8621A]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publishing Flash Vibe...' : '⚡ Post to Vibe Instant Stream'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-white mb-1">Flash Vibe is Live!</h4>
                <p className="text-xs text-white/70 mb-4">
                  Your event is now showing in the Vibe Instant feed for users in {city}.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#E8621A] text-white font-bold text-xs shadow-md"
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
