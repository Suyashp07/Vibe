'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Building2,
  AtSign,
  Palette,
  Upload,
  ArrowRight,
  CheckCircle2,
  Check,
  Type,
  Eye,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useAuth, updateAuthProfile } from '@/lib/auth';
import { saveOrganizer } from '@/lib/store';

const BRAND_COLOR_PRESETS = [
  { name: 'Sprint Orange', hex: '#E8621A', description: 'Energetic, action-oriented' },
  { name: 'Forest & Moss', hex: '#2D5A27', description: 'Organic, grounded, community' },
  { name: 'Vertex Navy', hex: '#0F3460', description: 'Tech, intellectual, high-signal' },
  { name: 'Dusty Rose', hex: '#C47B89', description: 'Celebrations, intimate, warm' },
  { name: 'Ember Terracotta', hex: '#C85A32', description: 'Culinary, culture, artisanal' },
  { name: 'Royal Amethyst', hex: '#6366F1', description: 'Creative, modern, vibrant' },
];

const FONT_PRESETS = [
  { id: 'Playfair Display', label: 'Playfair Display', style: 'Editorial & Literary' },
  { id: 'Fraunces', label: 'Fraunces', style: 'Warm, Curated & Artisanal' },
  { id: 'Inter', label: 'Inter', style: 'Modern, Clean & Tech' },
];

const LOGO_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
];

export default function OrganizerOnboardingPage() {
  const router = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#E8621A');
  const [brandFont, setBrandFont] = useState('Playfair Display');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize from existing profile if available
  useEffect(() => {
    if (profile) {
      if (profile.name && !name) setName(profile.name);
      if (profile.handle && !handle) setHandle(profile.handle);
      if (profile.brand_color && brandColor === '#E8621A') setBrandColor(profile.brand_color);
      if (profile.brand_font && brandFont === 'Playfair Display') setBrandFont(profile.brand_font);
      if (profile.avatar_url && !logoUrl) setLogoUrl(profile.avatar_url);
      if (profile.bio && !bio) setBio(profile.bio);
    }
  }, [profile]);

  // Set initial logo fallback if empty
  useEffect(() => {
    if (!logoUrl && name) {
      setLogoUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`);
    }
  }, [name, logoUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local data URL reader for instant upload preview
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) return;

    setSaving(true);
    setErrorMessage(null);

    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, '');

    const { error } = await updateAuthProfile({
      name: name.trim(),
      handle: cleanHandle,
      bio: bio.trim(),
      avatar_url: logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanHandle}`,
      brand_color: brandColor,
      brand_font: brandFont,
      onboarded: true,
      role: 'organizer',
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'Failed to complete onboarding. Please try again.');
      return;
    }

    // Trigger celebration confetti
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: [brandColor, '#C9A84C', '#1A1A2E', '#1A7A4A']
    });

    // Navigate to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Onboarding Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organizer Onboarding</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
            Set Up Your Brand Identity
          </h1>
          <p className="text-xs text-ink-secondary max-w-md mx-auto">
            Set your brand logo and accent palette once. It will auto-apply to all future event pages, share cards, and attendee tickets.
          </p>
        </div>

        {/* Wizard Steps Tracker */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              step === 1 ? 'bg-brand text-white' : 'bg-surface text-ink-muted border border-border'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            <span>Identity & Handle</span>
          </button>

          <div className="w-8 h-0.5 bg-border" />

          <button
            type="button"
            onClick={() => {
              if (name && handle) setStep(2);
            }}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              step === 2 ? 'bg-brand text-white' : 'bg-surface text-ink-muted border border-border'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
            <span>Brand Colors & Visuals</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            /* STEP 1: IDENTITY */
            <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-elevated space-y-6 animate-in fade-in">
              <div className="border-b border-border pb-4">
                <h2 className="font-display font-black text-xl text-ink">
                  1. Organization & Public URL
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  How should attendees recognize your collective or studio?
                </p>
              </div>

              {/* Organizer Name */}
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Organizer or Brand Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!handle) {
                        setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24));
                      }
                    }}
                    placeholder="e.g. Koramangala Tech Club, Swaniki Studio"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-input border border-border bg-surface focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Handle */}
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Public Profile Handle *
                </label>
                <div className="relative flex items-center">
                  <span className="pl-3 pr-1 text-xs text-ink-muted font-mono select-none">
                    vibe-by-swaniki.app/
                  </span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="yourhandle"
                    className="w-full pr-3 py-2 text-xs rounded-input border border-border bg-surface font-mono font-bold text-accent focus:outline-none focus:border-accent"
                  />
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  This creates your personal event directory: <span className="font-mono text-ink font-semibold">/{handle || 'yourhandle'}</span>
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Tagline or Short Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Curating intimate salons, tech meetups, and design mixers across Mumbai and Bengaluru."
                  className="w-full p-3 text-xs rounded-input border border-border bg-surface focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!name.trim() || !handle.trim()}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 py-2.5 px-6 rounded-btn bg-brand hover:bg-brand-mid text-white font-bold text-xs shadow-sm hover-lift transition-all disabled:opacity-50"
                >
                  <span>Continue to Brand Visuals</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: VISUAL IDENTITY */
            <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-elevated space-y-6 animate-in fade-in">
              <div className="border-b border-border pb-4">
                <h2 className="font-display font-black text-xl text-ink">
                  2. Brand Logo, Palette & Typography
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Customize the look and feel that will power your 5 editorial event templates.
                </p>
              </div>

              {/* Logo Upload & Presets */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-ink-secondary">
                  Brand Logo / Avatar
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current Logo Preview */}
                  <div
                    className="w-20 h-20 rounded-2xl border-2 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative group bg-surface-2"
                    style={{ borderColor: brandColor }}
                  >
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo Preview"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-ink-muted" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    {/* File Upload Button */}
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-ink transition-colors">
                        <Upload className="w-3.5 h-3.5 text-accent" />
                        <span>Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-ink-muted">or choose a preset:</span>
                    </div>

                    {/* Logo Presets */}
                    <div className="flex items-center gap-2">
                      {LOGO_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogoUrl(preset)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border transition-all ${
                            logoUrl === preset ? 'ring-2 ring-accent border-accent scale-105' : 'border-border opacity-70 hover:opacity-100'
                          }`}
                        >
                          <Image
                            src={preset}
                            alt={`Preset ${idx}`}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Accent Color */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink-secondary">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-border"
                    />
                    <span className="font-mono text-xs font-bold text-ink uppercase">
                      {brandColor}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {BRAND_COLOR_PRESETS.map((preset) => {
                    const isSelected = brandColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setBrandColor(preset.hex)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-brand bg-surface shadow-xs ring-1 ring-brand'
                            : 'border-border bg-surface hover:bg-surface-2'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate leading-tight">
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-ink-muted truncate font-mono">
                            {preset.hex}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Typography */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-ink-secondary">
                  Primary Brand Font
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {FONT_PRESETS.map((font) => {
                    const isSelected = brandFont === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setBrandFont(font.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-brand bg-surface shadow-xs ring-1 ring-brand'
                            : 'border-border bg-surface hover:bg-surface-2'
                        }`}
                      >
                        <p className="text-xs font-black text-ink">{font.label}</p>
                        <p className="text-[10px] text-ink-muted mt-0.5">{font.style}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE BRAND PREVIEW CARD */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  <Eye className="w-3.5 h-3.5 text-accent" />
                  <span>Live Brand Badge Preview</span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface-2 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl overflow-hidden border flex items-center justify-center shadow-xs"
                      style={{ borderColor: brandColor }}
                    >
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt="Brand logo"
                          width={44}
                          height={44}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-ink-muted" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
                        Hosted by
                      </span>
                      <h4 className="font-black text-sm text-ink leading-tight">
                        {name || 'Your Brand'}
                      </h4>
                      <p className="text-[10px] font-mono text-accent font-semibold">
                        vibe-by-swaniki.app/{handle || 'handle'}
                      </p>
                    </div>
                  </div>

                  <div
                    className="px-3 py-1 rounded-btn text-white text-xs font-bold shadow-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    RSVP · Free
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-ink-muted hover:text-ink font-semibold"
                >
                  ← Back to Identity
                </button>

                <button
                  type="submit"
                  disabled={saving || !name.trim() || !handle.trim()}
                  className="inline-flex items-center gap-2 py-3 px-8 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Setup & Go to Command Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 text-center flex items-center justify-center gap-2 text-[11px] text-ink-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>You can modify your brand presets anytime in your Organizer Command Settings.</span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
