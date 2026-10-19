'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  ShieldCheck,
  Crown,
  Instagram,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  UploadCloud,
  Download,
  Lock,
  FileText,
  AlertTriangle,
  Info,
  ShieldAlert,
  BellRing
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  useAuth,
  updateAuthProfile,
  signOut,
  getInitials,
  isSyntheticAvatar,
  AuthProfile
} from '@/lib/auth';
import { getImmutableAdmin } from '@/lib/adminConstants';
import { INDIAN_CITIES } from '@/lib/location';
import AuthModal from '@/components/auth/AuthModal';

// Clean aesthetic avatar presets if the user prefers an illustrated persona
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80',
];

// Helper to calculate exact age from birthdate
function calculateAge(dobString?: string): number | null {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let calculatedAge = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }
  return calculatedAge >= 0 && calculatedAge < 130 ? calculatedAge : null;
}

export default function ProfilePage() {
  const { profile, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [city, setCity] = useState('Mumbai');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');

  // DPDP Consent States (Section 6 & 6(4))
  const [communicationConsent, setCommunicationConsent] = useState(true);
  const [publicProfileConsent, setPublicProfileConsent] = useState(true);
  const [personalizationConsent, setPersonalizationConsent] = useState(true);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Erasure Modal State (Section 12)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Populate form when profile loads or updates
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setHandle(profile.handle || '');
      setAvatarUrl(profile.avatar_url || '');
      setDob(profile.dob || '');
      const calculated = calculateAge(profile.dob);
      setAge(profile.age ? String(profile.age) : calculated !== null ? String(calculated) : '');
      setGender(profile.gender || 'prefer_not_to_say');
      setCity(profile.city || 'Mumbai');
      setPhone(profile.phone || '');
      setInstagram(profile.instagram || '');
      setBio(profile.bio || '');

      setCommunicationConsent(profile.communication_consent !== false);
      setPublicProfileConsent(profile.public_profile_consent !== false);
    }
  }, [profile]);

  // Update age whenever DOB changes
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    const calculated = calculateAge(val);
    if (calculated !== null) {
      setAge(String(calculated));
    }
  };

  // Upload custom profile photo
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please choose an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        setSaveSuccess(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save changes & record DPDP consent
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const cleanAge = age ? parseInt(age, 10) : calculateAge(dob);

      const updates: Partial<AuthProfile> = {
        name: name.trim() || profile.name,
        handle: cleanHandle || profile.handle,
        avatar_url: avatarUrl.trim(),
        dob: dob || undefined,
        age: cleanAge && !isNaN(cleanAge) ? cleanAge : undefined,
        gender: gender || 'prefer_not_to_say',
        city: city.trim() || 'Mumbai',
        phone: phone.trim() || undefined,
        instagram: instagram.trim().replace(/^@/, '') || undefined,
        bio: bio.trim() || undefined,
        // DPDP Act 2023 Consent Audit Trail
        dpdp_consent: true,
        dpdp_consent_at: new Date().toISOString(),
        dpdp_consent_version: 'DPDP-2023-V1.0',
        communication_consent: communicationConsent,
        public_profile_consent: publicProfileConsent,
      };

      const res = await updateAuthProfile(updates);
      if (res.error) {
        throw new Error(res.error.message || 'Failed to update profile');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // DPDP Section 11 - Right to Access & Data Portability (Export JSON)
  const handleExportData = () => {
    if (!profile) return;
    const personalDataExport = {
      compliance: 'Digital Personal Data Protection Act (DPDP Act, 2023) - India',
      data_principal: {
        user_id: profile.id,
        email: profile.email,
        full_name: name || profile.name,
        handle: handle || profile.handle,
        date_of_birth: dob || null,
        age: age ? parseInt(age, 10) : calculateAge(dob),
        gender,
        home_city: city,
        phone_number: phone || null,
        instagram_handle: instagram || null,
        bio: bio || null,
        profile_avatar_url: avatarUrl || null,
      },
      consent_records: {
        dpdp_statutory_consent: true,
        dpdp_consent_version: 'DPDP-2023-V1.0',
        last_consent_timestamp: profile.dpdp_consent_at || new Date().toISOString(),
        communication_consent: communicationConsent,
        public_directory_consent: publicProfileConsent,
        personalization_consent: personalizationConsent,
      },
      data_fiduciary: {
        entity: 'Swaniki (Vibe Platform)',
        data_protection_officer_contact: 'privacy@swaniki.com',
        grievance_officer_contact: 'grievance@swaniki.com',
        export_generated_at: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(personalDataExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-personal-data-${profile.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // DPDP Section 12 - Right to Erasure / Account Deletion
  const handleConfirmAccountErasure = async () => {
    if (!profile) return;
    if (deleteConfirmationInput.trim() !== 'DELETE') {
      setDeleteError('Please type DELETE in capital letters to confirm.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          userEmail: profile.email,
          confirmationText: deleteConfirmationInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to erase account data.');
      }

      // Successful erasure: clear local session and redirect
      await signOut();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  const immutableConfig = getImmutableAdmin(profile?.email);
  const initials = getInitials(name || profile?.name, profile?.email);
  const hasPhoto = avatarUrl && !isSyntheticAvatar(avatarUrl);
  const numericAge = age ? parseInt(age, 10) : calculateAge(dob);
  const isMinor = numericAge !== null && numericAge < 18;

  // Distinct city list from Indian cities database
  const cityOptions = Array.from(
    new Set(Object.values(INDIAN_CITIES).map((c) => c.name))
  ).sort();

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col font-sans selection:bg-[#FF5500] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to explore</span>
          </Link>

          {profile && (
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          )}
        </div>

        {/* Page Title & DPDP Notice */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Personal Profile & Privacy
              </h1>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Manage your identity, personal information, and data privacy rights.
              </p>
            </div>

            {/* DPDP Compliance Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DPDP Act 2023 Compliant</span>
            </span>
          </div>

          {/* DPDP Section 6 Notice Banner */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
            <span>
              <strong>Digital Personal Data Protection Notice:</strong> We collect your name, age, contact details, and location solely for verified event ticketing, community safety, and attendance coordination under India&apos;s DPDP Act 2023. We never sell your personal data.
            </span>
          </div>

          {/* DPDP Section 9 - Minor Protection Warning */}
          {isMinor && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Minor Account Protection Active (Age &lt; 18)</strong>
                <span>Under Section 9 of the DPDP Act 2023, commercial profiling and targeted advertising are strictly disabled for minor data principals. Parental consent is required for ticket bookings.</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF5500]" />
            <span className="text-xs text-white/50">Loading profile data...</span>
          </div>
        )}

        {/* Not Signed In State */}
        {!loading && !profile && (
          <div className="p-8 sm:p-10 rounded-2xl bg-[#121216] border border-white/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Sign in to edit your profile</h2>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Sign in to manage your display name, profile photo, age, date of birth, and DPDP privacy settings.
              </p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#FF661A] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-[#FF5500]/20"
            >
              Sign In to Continue
            </button>
          </div>
        )}

        {/* Main Profile Form */}
        {!loading && profile && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Feedback Notifications */}
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-semibold">Profile and consent preferences updated successfully!</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Profile Photo */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/10 shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FF5500]" />
                Profile Photo
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Circular Photo / Initials */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/15 bg-white/5 flex items-center justify-center shadow-lg relative">
                    {hasPhoto ? (
                      <Image
                        src={avatarUrl}
                        alt={name || 'User avatar'}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-white/90">
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Quick Camera Upload Trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#FF5500] hover:bg-[#FF661A] text-white shadow-md transition cursor-pointer"
                    title="Upload photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                {/* Upload Action Buttons */}
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer border border-white/10"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-white/70" />
                      <span>Upload New Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white/70 hover:text-white transition cursor-pointer"
                    >
                      <span>Choose Preset</span>
                    </button>

                    {hasPhoto && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-2.5 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-white/40">
                    Recommended: Square JPG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>

              {/* Preset Selector Accordion */}
              {showAvatarPresets && (
                <div className="pt-4 border-t border-white/10 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-semibold text-white/60">
                    Pick an avatar preset:
                  </span>
                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {AVATAR_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(preset);
                          setShowAvatarPresets(false);
                        }}
                        className={`w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition hover:scale-105 cursor-pointer relative ${
                          avatarUrl === preset
                            ? 'border-[#FF5500] ring-2 ring-[#FF5500]/30'
                            : 'border-white/20 hover:border-white/50'
                        }`}
                      >
                        <Image
                          src={preset}
                          alt={`Preset avatar ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Personal Information (DPDP Section 12 Right to Correction) */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/10 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <User className="w-4 h-4 text-[#FF5500]" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Suyash Pandey"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition"
                  />
                </div>

                {/* Username / Handle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    Username / Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-white/40 font-mono">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition font-mono"
                    />
                  </div>
                </div>

                {/* Date of Birth (DOB) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
                    <span>Date of Birth (DOB)</span>
                    {age && (
                      <span className="text-[11px] font-mono text-[#FF5500] font-bold">
                        {age} yrs old
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dob}
                      onChange={handleDobChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition scheme-dark"
                    />
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5500] transition cursor-pointer"
                  >
                    <option value="prefer_not_to_say" className="bg-[#121216]">Rather not say</option>
                    <option value="male" className="bg-[#121216]">Male</option>
                    <option value="female" className="bg-[#121216]">Female</option>
                    <option value="non_binary" className="bg-[#121216]">Non-binary</option>
                    <option value="other" className="bg-[#121216]">Other / Custom</option>
                  </select>
                </div>

                {/* Place / City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    Place / Home City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF5500] transition cursor-pointer"
                    >
                      {cityOptions.map((cityName) => (
                        <option key={cityName} value={cityName} className="bg-[#121216]">
                          {cityName}
                        </option>
                      ))}
                      <option value="Other" className="bg-[#121216]">Other Location</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bio / About */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/80 block">
                    About / Bio
                  </label>
                  <span className="text-[10px] text-white/40">
                    {bio.length}/300
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community a little about yourself (e.g. hobbies, music taste, what vibes you enjoy)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition resize-none"
                />
              </div>
            </div>

            {/* 3. Contact Details */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/10 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF5500]" />
                Contact & Social
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address (Read-only verified) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={profile.email}
                      className="w-full pl-9 pr-20 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70 cursor-not-allowed"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  </div>
                </div>

                {/* Phone / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80 block">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition"
                    />
                  </div>
                </div>

                {/* Instagram Handle */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-white/80 block">
                    Instagram Handle
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="your_handle"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. DPDP Act 2023 Granular Consent Management (Section 6(4)) */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/10 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FF5500]" />
                Consent & Privacy Preferences (DPDP Section 6)
              </h2>
              <p className="text-xs text-white/60">
                Under Section 6(4) of the DPDP Act 2023, you have the statutory right to give, manage, or withdraw your consent at any time.
              </p>

              <div className="space-y-3 pt-1">
                {/* Toggle 1: Public Profile Discovery */}
                <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">
                      Public Profile & Directory Discovery
                    </span>
                    <span className="text-[11px] text-white/50 block">
                      Allow other verified community members and event hosts to see your display name and @handle.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={publicProfileConsent}
                    onChange={(e) => setPublicProfileConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#FF5500] focus:ring-[#FF5500] border-white/20 bg-black/50 cursor-pointer"
                  />
                </label>

                {/* Toggle 2: WhatsApp & Transactional Notifications */}
                <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">
                      WhatsApp & SMS Event Passes
                    </span>
                    <span className="text-[11px] text-white/50 block">
                      Receive your confirmed QR ticket passes, venue gate changes, and security updates via WhatsApp/SMS.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={communicationConsent}
                    onChange={(e) => setCommunicationConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#FF5500] focus:ring-[#FF5500] border-white/20 bg-black/50 cursor-pointer"
                  />
                </label>

                {/* Toggle 3: Personalization & Experience Recommendations */}
                <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">
                      Localized Experience Recommendations
                    </span>
                    <span className="text-[11px] text-white/50 block">
                      Tailor suggested gatherings based on your home city and preferred activity categories.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={personalizationConsent}
                    onChange={(e) => setPersonalizationConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#FF5500] focus:ring-[#FF5500] border-white/20 bg-black/50 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* 5. Data Principal Rights Hub (DPDP Sections 11, 12 & 13) */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/10 shadow-xs space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF5500]" />
                Your Data Principal Rights (DPDP Act 2023)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Section 11: Right to Access & Portability */}
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">
                      Right to Data Portability (Section 11)
                    </span>
                    <p className="text-[11px] text-white/50">
                      Download a structured, machine-readable JSON copy of all personal data held about you.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download My Data (JSON)</span>
                  </button>
                </div>

                {/* Section 12: Right to Erasure */}
                <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-red-400 block">
                      Right to Erasure (Section 12)
                    </span>
                    <p className="text-[11px] text-white/50">
                      Permanently wipe your profile and personal records from our database servers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setDeleteConfirmationInput('');
                      setShowDeleteModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 flex items-center justify-center gap-1.5 transition cursor-pointer border border-red-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Request Data Erasure</span>
                  </button>
                </div>
              </div>

              {/* Section 13: Grievance Redressal Officer Contact */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/50">
                <span>
                  <strong>Grievance Officer:</strong> <a href="mailto:grievance@swaniki.com" className="text-[#FF5500] hover:underline font-medium">grievance@swaniki.com</a> (SLA: 48h Response)
                </span>
                <span>Data Protection Board of India (DPBI) Redressal Active</span>
              </div>
            </div>

            {/* 6. Account Credentials Badge */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/50">Account Role:</span>
                {immutableConfig ? (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    <Crown className="w-3 h-3" />
                    {immutableConfig.roleTitle}
                  </span>
                ) : profile.role === 'super_admin' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Super Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-[#FF5500] bg-[#FF5500]/10 border border-[#FF5500]/20 px-2.5 py-0.5 rounded-full">
                    Community Member
                  </span>
                )}
              </div>

              <span className="text-[11px] text-white/40">
                User ID: <code className="font-mono text-white/60">{profile.id.slice(0, 10)}...</code>
              </span>
            </div>

            {/* 7. Save Changes Primary Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF661A] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-[#FF5500]/20 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />

      {/* DPDP Section 12 - Account Erasure Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#121216] border border-red-500/30 rounded-2xl p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Permanently Erase Personal Data</h3>
                <span className="text-[11px] text-white/50">DPDP Act 2023 (Section 12 Right to Erasure)</span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              This action cannot be undone. All your personal data, profile records, and registered RSVPs will be permanently purged from our servers.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80 block">
                Type <strong className="text-red-400 font-mono">DELETE</strong> to confirm erasure:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 transition font-mono uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccountErasure}
                disabled={isDeletingAccount || deleteConfirmationInput.trim() !== 'DELETE'}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/25"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Erasing Data...</span>
                  </>
                ) : (
                  <span>Confirm Erasure</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal fallback if logged out */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
