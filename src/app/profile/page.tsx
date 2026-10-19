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
  Shield,
  ShieldCheck,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Upload,
  Download,
  Lock,
  Save,
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  useAuth,
  updateAuthProfile,
  setLocalAuthSession,
  signOut,
  getInitials,
  isSyntheticAvatar,
  AuthProfile
} from '@/lib/auth';
import { INDIAN_CITIES } from '@/lib/location';
import AuthModal from '@/components/auth/AuthModal';

// Illustrated presets
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

  // Form states (Username / handle and Instagram handle removed per user request)
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState('male');
  const [city, setCity] = useState('Mumbai');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Privacy Preferences (Toggles)
  const [communityProfileConsent, setCommunityProfileConsent] = useState(true);
  const [showHomeCity, setShowHomeCity] = useState(false);

  // UI state
  const [activeNav, setActiveNav] = useState<'photo' | 'personal' | 'contact' | 'privacy'>('photo');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Erasure Modal State (DPDP Section 12)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Populate form when profile loads or updates
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(profile.avatar_url || '');
      setDob(profile.dob || '');
      const calculated = calculateAge(profile.dob);
      setAge(profile.age ? String(profile.age) : calculated !== null ? String(calculated) : '');
      const validGenders = ['male', 'female', 'other'];
      const profileGender = profile.gender?.toLowerCase() || '';
      setGender(validGenders.includes(profileGender) ? profileGender : 'male');
      setCity(profile.city || 'Mumbai');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');

      setCommunityProfileConsent(profile.public_profile_consent !== false);
      setShowHomeCity(profile.show_city_consent === true);
    }
  }, [profile]);

  // Sample profile loader for instant preview
  const handleLoadSampleProfile = () => {
    setName('Suyash P');
    setDob('2000-05-15');
    setAge('24');
    setGender('male');
    setCity('Mumbai');
    setPhone('+91 98765 43210');
    setBio('Good music, new places, and great company..');
    setCommunityProfileConsent(true);
    setShowHomeCity(false);
    setSaveSuccess(false);
  };

  // Revert changes
  const handleCancel = () => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(profile.avatar_url || '');
      setDob(profile.dob || '');
      const calculated = calculateAge(profile.dob);
      setAge(profile.age ? String(profile.age) : calculated !== null ? String(calculated) : '');
      const validGenders = ['male', 'female', 'other'];
      const profileGender = profile.gender?.toLowerCase() || '';
      setGender(validGenders.includes(profileGender) ? profileGender : 'male');
      setCity(profile.city || 'Mumbai');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setCommunityProfileConsent(profile.public_profile_consent !== false);
      setShowHomeCity(profile.show_city_consent === true);
    }
    setErrorMessage('');
  };

  // Upload custom profile photo with automatic canvas optimization (under 30KB)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please choose an image under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setErrorMessage('Could not read image file.');
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new window.Image();
      img.onerror = () => setAvatarUrl(rawDataUrl);
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setAvatarUrl(rawDataUrl);
        }
        setSaveSuccess(false);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Save changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const cleanAge = age ? parseInt(age, 10) : calculateAge(dob);

      // If user is not yet logged into Supabase, create a local session so their changes are not lost
      let activeProfile = profile;
      if (!activeProfile) {
        const guestId = `guest-${Date.now()}`;
        activeProfile = {
          id: guestId,
          email: 'guest@vibe.local',
          name: name.trim() || 'Guest User',
          role: 'guest',
          avatar_url: avatarUrl.trim(),
          city: city.trim() || 'Mumbai',
          gender: gender || 'male',
          dob: dob || undefined,
          age: cleanAge && !isNaN(cleanAge) ? cleanAge : undefined,
          phone: phone.trim() || undefined,
          bio: bio.trim() || undefined,
          onboarded: true,
          isDemo: true,
        };
        setLocalAuthSession(activeProfile);
      }

      const updates: Partial<AuthProfile> & { show_city_consent?: boolean } = {
        name: name.trim() || activeProfile.name,
        avatar_url: avatarUrl.trim(),
        dob: dob || undefined,
        age: cleanAge && !isNaN(cleanAge) ? cleanAge : undefined,
        gender: gender || 'male',
        city: city.trim() || 'Mumbai',
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        // DPDP Act 2023 Consent Audit Trail
        dpdp_consent: true,
        dpdp_consent_at: new Date().toISOString(),
        dpdp_consent_version: 'DPDP-2023-V1.0',
        public_profile_consent: communityProfileConsent,
        show_city_consent: showHomeCity,
      };

      const res = await updateAuthProfile(updates);
      if (res.error) {
        throw new Error(res.error.message || 'Failed to update profile');
      }

      if (res.data) {
        setName(res.data.name || '');
        setAvatarUrl(res.data.avatar_url || '');
        setGender(res.data.gender || 'male');
        setCity(res.data.city || 'Mumbai');
        setPhone(res.data.phone || '');
        setBio(res.data.bio || '');
        if (res.data.dob) setDob(res.data.dob);
        if (res.data.age) setAge(String(res.data.age));
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
        date_of_birth: dob || null,
        age: age ? parseInt(age, 10) : calculateAge(dob),
        gender,
        home_city: city,
        phone_number: phone || null,
        bio: bio || null,
        profile_avatar_url: avatarUrl || null,
      },
      consent_records: {
        dpdp_statutory_consent: true,
        dpdp_consent_version: 'DPDP-2023-V1.0',
        community_profile_consent: communityProfileConsent,
        show_home_city_consent: showHomeCity,
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

      await signOut();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  const scrollToSection = (id: string, navKey: 'photo' | 'personal' | 'contact' | 'privacy') => {
    setActiveNav(navKey);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const initials = getInitials(name || profile?.name, profile?.email);
  const hasPhoto = avatarUrl && !isSyntheticAvatar(avatarUrl);

  const cityOptions = Array.from(
    new Set(Object.values(INDIAN_CITIES).map((c) => c.name))
  ).sort();

  return (
    <div className="min-h-screen bg-[#050505] text-[#F3F4F6] flex flex-col font-sans selection:bg-[#FF5500] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to discover</span>
          </Link>

          <button
            type="button"
            onClick={handleLoadSampleProfile}
            className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-medium text-white/70 hover:text-white transition cursor-pointer"
          >
            Sample profile
          </button>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="pb-8 border-b border-white/[0.08] mb-8 sm:mb-10 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40 block">
              YOUR VIBE, YOUR WAY
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-baseline">
              Personal profile &amp; privacy<span className="text-[#FF5500]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/60 pt-0.5">
              A little about you. Always in your control.
            </p>
          </div>

          {/* Orange Shield Icon */}
          <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/25 text-[#FF5500] shrink-0 mt-1">
            <Shield className="w-6 h-6 text-[#FF5500]" />
          </div>
        </div>

        {/* Quick Nav Bar (Mobile & Tablet) */}
        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 pb-4 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => scrollToSection('section-photo', 'photo')}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeNav === 'photo'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Profile photo</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('section-personal', 'personal')}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeNav === 'personal'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Personal info</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('section-contact', 'contact')}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeNav === 'contact'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Contact details</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('section-privacy', 'privacy')}
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeNav === 'privacy'
                ? 'bg-white/10 text-white border border-white/15'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Privacy</span>
          </button>
        </div>

        {/* Layout: Sidebar Navigation + Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Sidebar (Desktop Sticky Navigation) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 space-y-6">
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => scrollToSection('section-photo', 'photo')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeNav === 'photo'
                    ? 'bg-white/[0.08] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Camera className="w-4 h-4 text-white/50" />
                <span>Profile photo</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('section-personal', 'personal')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeNav === 'personal'
                    ? 'bg-white/[0.08] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <User className="w-4 h-4 text-white/50" />
                <span>Personal information</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('section-contact', 'contact')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeNav === 'contact'
                    ? 'bg-white/[0.08] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Mail className="w-4 h-4 text-white/50" />
                <span>Contact details</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('section-privacy', 'privacy')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeNav === 'privacy'
                    ? 'bg-white/[0.08] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Lock className="w-4 h-4 text-white/50" />
                <span>Privacy</span>
              </button>
            </nav>

            <div className="pt-6 border-t border-white/[0.08] space-y-2">
              <Shield className="w-4 h-4 text-[#FF5500]" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Your identity. Your choice.</p>
                <p className="text-[11px] text-white/50">Only share what feels right.</p>
              </div>
            </div>

            {profile && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </aside>

          {/* Right Main Content */}
          <div className="lg:col-span-9 space-y-10 sm:space-y-12">
            {/* Feedback Notifications */}
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-semibold">Profile and privacy settings saved successfully!</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Unauthenticated Prompt */}
            {!loading && !profile && (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/50">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">Sign in to edit your profile</h2>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    Save your personal preferences and sync your identity across events.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-5 py-2 bg-[#FF5500] hover:bg-[#FF661A] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-[#FF5500]/20"
                >
                  Sign In to Continue
                </button>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSaveProfile} className="space-y-10 sm:space-y-12">
              {/* 01 Profile Photo */}
              <section id="section-photo" className="space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-baseline gap-2">
                    <span className="text-[#FF5500] font-mono text-xs font-bold">01</span>
                    <span>Profile photo</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    A familiar face makes a real connection.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
                  {/* Avatar Circle with Camera badge */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-[#241712] border-2 border-white/10 relative flex items-center justify-center shadow-lg">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Profile avatar"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl font-black text-[#E8621A]">
                          {initials || <Sparkles className="w-6 h-6 text-[#E8621A]" />}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#FF5500] text-white hover:bg-[#FF661A] transition shadow-md cursor-pointer border-2 border-[#070709]"
                      title="Upload photo"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white transition flex items-center gap-2 cursor-pointer border border-white/10"
                      >
                        <Upload className="w-3.5 h-3.5 text-white/70" />
                        <span>Upload photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white transition cursor-pointer"
                      >
                        Choose preset
                      </button>

                      {hasPhoto && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="p-2 rounded-xl text-xs text-white/40 hover:text-red-400 transition cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-white/40">
                      JPG, PNG or WebP · Max 5 MB
                    </p>
                  </div>
                </div>

                {/* Preset Selector */}
                {showAvatarPresets && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-2 animate-in fade-in">
                    <span className="text-[11px] font-semibold text-white/50">
                      Choose an illustrated preset:
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
                          className={`w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 transition hover:scale-105 cursor-pointer relative ${
                            avatarUrl === preset
                              ? 'border-[#FF5500] ring-2 ring-[#FF5500]/30'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          <Image
                            src={preset}
                            alt={`Preset ${index + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <hr className="border-white/[0.08]" />

              {/* 02 Personal Information */}
              <section id="section-personal" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-baseline gap-2">
                      <span className="text-[#FF5500] font-mono text-xs font-bold">02</span>
                      <span>Personal information</span>
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                      The person behind the plans.
                    </p>
                  </div>
                  <User className="w-4 h-4 text-white/40" />
                </div>

                <div className="space-y-4 pt-1">
                  {/* Full Name (Takes full width, Username / handle removed) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 block">
                      Full name <span className="text-[#FF5500]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Suyash Pandey"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 block">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#141417] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#FF5500] transition cursor-pointer"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Place / Home City */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/80 block">
                        Place / home city
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#141417] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#FF5500] transition cursor-pointer"
                        >
                          {cityOptions.map((cityName) => (
                            <option key={cityName} value={cityName}>
                              {cityName}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* About You */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white/80 block">
                        About you
                      </label>
                      <span className="text-[11px] text-white/40 font-mono">
                        Optional
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Good music, new places, and great company.."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition resize-none"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-white/[0.08]" />

              {/* 03 Contact Details */}
              <section id="section-contact" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-baseline gap-2">
                      <span className="text-[#FF5500] font-mono text-xs font-bold">03</span>
                      <span>Contact details</span>
                    </h2>
                    <p className="text-xs text-white/50 mt-0.5">
                      Stay connected to the gatherings that matter.
                    </p>
                  </div>
                  <Lock className="w-4 h-4 text-white/40" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Email address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/80 block">
                      Email address
                    </label>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={profile?.email || 'you@example.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-white/50 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white/80 block">
                        Phone number
                      </label>
                      <span className="text-[11px] text-white/40 font-mono">
                        Optional
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-white/[0.08]" />

              {/* 04 Privacy Preferences */}
              <section id="section-privacy" className="space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-baseline gap-2">
                    <span className="text-[#FF5500] font-mono text-xs font-bold">04</span>
                    <span>Privacy preferences</span>
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    Decide what your community can see.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Toggle 1: Community Profile */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white">Community profile</p>
                      <p className="text-[11px] text-white/50">Show your name, photo, and bio to other guests.</p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={communityProfileConsent}
                      onClick={() => setCommunityProfileConsent(!communityProfileConsent)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        communityProfileConsent ? 'bg-[#FF5500]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          communityProfileConsent ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <hr className="border-white/[0.05]" />

                  {/* Toggle 2: Show Home City */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white">Show home city</p>
                      <p className="text-[11px] text-white/50">Let people see where you&apos;re based.</p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={showHomeCity}
                      onClick={() => setShowHomeCity(!showHomeCity)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showHomeCity ? 'bg-[#FF5500]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          showHomeCity ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Bottom Notice Banner */}
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-white/60 flex items-start gap-2.5 mt-2">
                    <ShieldCheck className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      Your personal data is encrypted and handled in compliance with India&apos;s DPDP Act 2023. Privacy settings are synchronized securely across your confirmed event passes.
                    </span>
                  </div>

                  {/* Data Principal Statutory Rights (Section 11 & 12) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition cursor-pointer text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download my data (JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError('');
                        setDeleteConfirmationInput('');
                        setShowDeleteModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-red-400/80 hover:text-red-400 transition cursor-pointer text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Request data erasure</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Bottom Actions Bar */}
              <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-white/40 text-center sm:text-left">
                  Changes apply to your profile.
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF661A] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF5500]/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Saving changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-white" />
                        <span>Save changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />

      {/* DPDP Section 12 - Account Erasure Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="dark-dialog relative w-full max-w-md bg-[#111114] border border-red-500/30 rounded-2xl p-6 text-white space-y-4 shadow-2xl animate-in zoom-in-95">
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
              This action cannot be undone. All personal records and account credentials will be permanently erased.
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
