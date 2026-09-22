'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { INITIAL_ORGANIZERS } from './store';
import { User, Session } from '@supabase/supabase-js';

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'curator' | 'organizer' | 'guest';
  handle?: string;
  bio?: string;
  avatar_url?: string;
  brand_color?: string;
  brand_font?: string;
  phone?: string;
  onboarded?: boolean;
  isDemo?: boolean;
}

import { ADMIN_EMAILS, isStaffRole, isSuperAdminEmail } from './adminConstants';
export { ADMIN_EMAILS, isStaffRole, isSuperAdminEmail };

// In-memory TTL cache for profile database queries to prevent polling storms
const profileDbCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Detect synthetic placeholder or auto-generated random avatars (e.g. Dicebear)
 */
export const isSyntheticAvatar = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return true;
  return (
    trimmed.includes('api.dicebear.com') ||
    trimmed.includes('dicebear') ||
    trimmed.includes('avatar.vercel.sh') ||
    trimmed.includes('ui-avatars.com')
  );
};

/**
 * Resolves a reliable, deterministic user profile avatar URL:
 * 1. User-uploaded custom logo (if non-synthetic, e.g. Supabase storage or custom hosted image)
 * 2. Authentic email account linked photo from OAuth (Google picture / avatar)
 * 3. Non-synthetic local avatar
 * 4. Fallback to empty string '' (which triggers dynamic initials badge)
 */
export const resolveAvatarUrl = (sources: {
  metaAvatar?: string | null;
  metaPicture?: string | null;
  dbLogoUrl?: string | null;
  dbAvatarUrl?: string | null;
  localAvatar?: string | null;
}): string => {
  const metaPhoto = sources.metaAvatar || sources.metaPicture;
  const dbPhoto = sources.dbLogoUrl || sources.dbAvatarUrl;
  const localPhoto = sources.localAvatar;

  // 1. Explicit user-uploaded custom logo
  if (dbPhoto && !isSyntheticAvatar(dbPhoto)) {
    return dbPhoto.trim();
  }

  // 2. Email-linked OAuth profile photo (e.g. Google avatar)
  if (metaPhoto && !isSyntheticAvatar(metaPhoto)) {
    return metaPhoto.trim();
  }

  // 3. Non-synthetic local avatar
  if (localPhoto && !isSyntheticAvatar(localPhoto)) {
    return localPhoto.trim();
  }

  return '';
};

/**
 * Generate clean 1-2 letter uppercase initials from name or email (e.g. "SP", "JD", "AK")
 */
export const getInitials = (name?: string | null, email?: string | null): string => {
  if (name && name.trim()) {
    const clean = name.trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const local = email.trim().split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    return local.slice(0, 2).toUpperCase() || 'U';
  }
  return 'U';
};

const LOCAL_STORAGE_AUTH_KEY = 'vibe_auth_session';

/**
 * Get current stored demo/local session if any
 */
export const getLocalAuthSession = (): AuthProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    if (profile && isSyntheticAvatar(profile.avatar_url)) {
      profile.avatar_url = '';
    }
    return profile;
  } catch {
    return null;
  }
};

export const setLocalAuthSession = (profile: AuthProfile | null) => {
  if (typeof window === 'undefined') return;
  const currentStr = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
  if (profile) {
    const cleanProfile = { ...profile };
    if (isSyntheticAvatar(cleanProfile.avatar_url)) {
      cleanProfile.avatar_url = '';
    }
    const nextStr = JSON.stringify(cleanProfile);
    if (currentStr === nextStr) return; // Skip if identical to prevent event loops

    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, nextStr);
    try {
      document.cookie = `vibe_auth_role=${encodeURIComponent(cleanProfile.role)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `vibe_auth_email=${encodeURIComponent(cleanProfile.email)}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
  } else {
    if (!currentStr) return; // Skip if already empty
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    try {
      document.cookie = 'vibe_auth_role=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'vibe_auth_email=; path=/; max-age=0; SameSite=Lax';
    } catch {}
  }
  // Dispatch storage event so other tabs/components update
  window.dispatchEvent(new Event('vibe_auth_changed'));
};

/**
 * Send Supabase Email OTP (also provides magic link)
 */
export const sendEmailOtp = async (email: string, role: 'organizer' | 'guest' = 'organizer') => {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: { message: 'Supabase client is not configured. Check your environment variables.' } };
  }

  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback?role=${role}`
    : undefined;

  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        role,
        name: email.split('@')[0],
      },
    },
  });

  return { data, error };
};

/**
 * Verify Supabase Email OTP Token (6-digit code)
 */
export const verifyEmailOtp = async (
  email: string,
  token: string,
  role: 'organizer' | 'guest' = 'organizer'
) => {
  const client = getSupabaseClient();
  const trimmedToken = token.trim();

  let pendingSignup: any = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('vibe_pending_signup');
      if (raw) pendingSignup = JSON.parse(raw);
    } catch {}
  }

  if (!client) {
    return { data: null, error: { message: 'Supabase client is not configured.' } };
  }

  if (!trimmedToken || trimmedToken.length < 6 || trimmedToken.length > 8) {
    return { data: null, error: { message: 'Please enter the 6 to 8 digit verification code from your email.' } };
  }

  // Try 'magiclink' first (for existing users & login OTPs), then 'signup' (new users), then 'email'
  let { data, error } = await client.auth.verifyOtp({
    email,
    token: trimmedToken,
    type: 'magiclink'
  });

  if (error) {
    const signupRes = await client.auth.verifyOtp({
      email,
      token: trimmedToken,
      type: 'signup'
    });
    if (!signupRes.error) {
      data = signupRes.data;
      error = null;
    } else {
      const emailRes = await client.auth.verifyOtp({
        email,
        token: trimmedToken,
        type: 'email'
      });
      if (!emailRes.error) {
        data = emailRes.data;
        error = null;
      }
    }
  }

  if (error) {
    return { data: null, error };
  }

  if (data?.user) {
    // Try to fetch profile from public.profiles table
    let profileData: any = null;
    try {
      const { data: dbProfile } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      profileData = dbProfile;
    } catch (e) {
      // Continue if table query fails
    }

    const profile: AuthProfile = {
      id: data.user.id,
      email: data.user.email || email,
      name: profileData?.name || pendingSignup?.name || data.user.user_metadata?.name || email.split('@')[0],
      role: profileData?.role || pendingSignup?.role || data.user.user_metadata?.role || role,
      handle: profileData?.handle || pendingSignup?.handle || data.user.user_metadata?.handle || email.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
      avatar_url: resolveAvatarUrl({
        dbLogoUrl: profileData?.logo_url,
        metaAvatar: data.user.user_metadata?.avatar_url,
        metaPicture: data.user.user_metadata?.picture,
      }),
      bio: profileData?.bio,
      brand_color: profileData?.brand_color || pendingSignup?.brand_color || '#E8621A',
      brand_font: profileData?.brand_font || pendingSignup?.brand_font || 'Playfair Display',
      onboarded: profileData?.onboarded !== undefined ? profileData.onboarded : Boolean(profileData?.handle && profileData?.handle !== email.split('@')[0]),
      isDemo: false,
    };
    setLocalAuthSession(profile);
    if (typeof window !== 'undefined') sessionStorage.removeItem('vibe_pending_signup');

    // Ensure written to Supabase public.profiles table
    try {
      await client.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        handle: profile.handle,
        brand_color: profile.brand_color,
        brand_font: profile.brand_font,
        onboarded: profile.onboarded,
      });
    } catch {}

    return { data, error: null };
  }

  return { data: null, error: { message: 'Verification failed. Please check the code and try again.' } };
};

/**
 * Sign up with Email, Name and Role
 */
export const signUpWithEmailOtp = async (
  email: string,
  name: string,
  role: 'organizer' | 'guest' = 'organizer',
  handle?: string
) => {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanHandle = (handle || cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_')).slice(0, 30);

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('vibe_pending_signup', JSON.stringify({
      email: cleanEmail,
      name: cleanName,
      role,
      handle: cleanHandle,
      brand_color: '#E8621A',
      brand_font: 'Playfair Display',
    }));
  }

  if (!client) {
    return { data: null, error: { message: 'Supabase client is not configured.' } };
  }

  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback?role=${role}&next=${role === 'organizer' ? '/onboarding' : '/passes'}`
    : undefined;

  const { data, error } = await client.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        name: cleanName,
        handle: cleanHandle,
        role,
        onboarded: false,
      }
    }
  });

  return { data, error };
};

/**
 * Update authenticated profile locally and in Supabase
 */
export const updateAuthProfile = async (updates: Partial<AuthProfile>): Promise<{ data: AuthProfile | null; error: any }> => {
  const current = getLocalAuthSession();
  if (!current) {
    return { data: null, error: { message: 'No active session found. Please sign in.' } };
  }

  const updated: AuthProfile = {
    ...current,
    ...updates,
    onboarded: updates.onboarded !== undefined ? updates.onboarded : true,
  };

  setLocalAuthSession(updated);

  // Sync with store organizers
  if (updated.role === 'organizer' && updated.handle) {
    try {
      const { saveOrganizer } = await import('./store');
      saveOrganizer({
        id: updated.id,
        role: 'organizer',
        name: updated.name,
        handle: updated.handle,
        bio: updated.bio || '',
        logo_url: updated.avatar_url || '',
        brand_color: updated.brand_color || '#E8621A',
        brand_font: updated.brand_font || 'Playfair Display',
        phone: updated.phone || '',
        email: updated.email,
        onboarded: true,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not sync organizer to store:', e);
    }
  }

  // Sync to Supabase if available
  const client = getSupabaseClient();
  if (client && !updated.isDemo) {
    try {
      const { error } = await client
        .from('profiles')
        .upsert({
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          handle: updated.handle,
          bio: updated.bio,
          logo_url: isSyntheticAvatar(updated.avatar_url) ? null : updated.avatar_url,
          brand_color: updated.brand_color,
          brand_font: updated.brand_font,
          phone: updated.phone,
          onboarded: updated.onboarded,
        });
      if (error) console.warn('Supabase profile upsert warning:', error);
    } catch (e) {
      console.warn('Supabase update exception:', e);
    }
  }

  return { data: updated, error: null };
};

/**
 * Soft Prompt: Create Guest Account From Completed RSVP
 */
export const createGuestAccountFromRsvp = (email: string, name: string, phone?: string): AuthProfile => {
  const profile: AuthProfile = {
    id: `guest-${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    role: 'guest',
    avatar_url: '',
    onboarded: true,
    isDemo: false,
  };
  setLocalAuthSession(profile);
  return profile;
};

/**
 * Sign in via Supabase Magic Link
 */
export const signInWithMagicLink = sendEmailOtp;

/**
 * Sign in with Email and Password (Host or Guest)
 */
export const signInWithPassword = async (
  email: string,
  password: string,
  intendedRole?: 'organizer' | 'guest'
) => {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();

  if (!client) {
    // Local fallback if Supabase not configured
    const isSuper = ADMIN_EMAILS.includes(cleanEmail);
    const profile: AuthProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      role: isSuper ? 'super_admin' : (intendedRole || 'organizer'),
      handle: cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
      brand_color: '#0A0A0A',
      brand_font: 'Inter',
      onboarded: true,
      isDemo: true,
    };
    setLocalAuthSession(profile);
    return { data: { user: { id: profile.id, email: cleanEmail } }, error: null };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    return { data: null, error };
  }

  if (data?.user) {
    const isSuper = ADMIN_EMAILS.includes(cleanEmail);
    let dbProfile: any = null;
    try {
      const { data: prof } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      dbProfile = prof;
    } catch {}

    const meta = data.user.user_metadata || {};
    const assignedRole = isSuper
      ? 'super_admin'
      : (dbProfile?.role || meta.role || intendedRole || 'organizer');

    const profile: AuthProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      name: dbProfile?.name || meta.name || cleanEmail.split('@')[0],
      role: assignedRole as any,
      handle: dbProfile?.handle || meta.handle || cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
      avatar_url: resolveAvatarUrl({
        dbLogoUrl: dbProfile?.logo_url,
        dbAvatarUrl: dbProfile?.avatar_url,
        metaAvatar: meta.avatar_url,
        metaPicture: meta.picture,
      }),
      bio: dbProfile?.bio || meta.bio,
      brand_color: dbProfile?.brand_color || meta.brand_color || '#0A0A0A',
      brand_font: 'Inter',
      phone: dbProfile?.phone || meta.phone,
      onboarded: dbProfile?.onboarded !== undefined ? dbProfile.onboarded : (assignedRole === 'guest' || Boolean(dbProfile?.handle)),
      isDemo: false,
    };

    setLocalAuthSession(profile);

    if (!dbProfile) {
      try {
        await client.from('profiles').upsert({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          handle: profile.handle,
          brand_color: profile.brand_color,
          brand_font: 'Inter',
          onboarded: profile.onboarded,
        });
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vibe_auth_changed'));
    }
  }

  return { data, error: null };
};

/**
 * Sign up with Email and Password (Host or Guest)
 */
export const signUpWithPassword = async (
  email: string,
  password: string,
  name: string,
  role: 'organizer' | 'guest' = 'organizer',
  handle?: string
) => {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanHandle = (handle || cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_')).slice(0, 30);

  if (!client) {
    const isSuper = ADMIN_EMAILS.includes(cleanEmail);
    const profile: AuthProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      role: isSuper ? 'super_admin' : role,
      handle: cleanHandle,
      brand_color: '#0A0A0A',
      brand_font: 'Inter',
      onboarded: role === 'guest',
      isDemo: true,
    };
    setLocalAuthSession(profile);
    return { data: { user: { id: profile.id, email: cleanEmail } }, error: null };
  }

  const { data, error } = await client.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        name: cleanName,
        role,
        handle: cleanHandle,
      },
    },
  });

  if (error) {
    return { data: null, error };
  }

  if (data?.user) {
    const isSuper = ADMIN_EMAILS.includes(cleanEmail);
    const profile: AuthProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      name: cleanName,
      role: isSuper ? 'super_admin' : role,
      handle: cleanHandle,
      brand_color: '#0A0A0A',
      brand_font: 'Inter',
      onboarded: role === 'guest',
      isDemo: false,
    };
    setLocalAuthSession(profile);

    try {
      await client.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        handle: profile.handle,
        brand_color: profile.brand_color,
        brand_font: 'Inter',
        onboarded: profile.onboarded,
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vibe_auth_changed'));
    }
  }

  return { data, error: null };
};

/**
 * Sign in with Google OAuth (supports both Host and Guest roles)
 */
export const signInWithGoogle = async (
  role: 'organizer' | 'guest' = 'organizer',
  nextUrl?: string
) => {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: { message: 'Supabase client is not configured.' } };
  }

  const redirectDestination = nextUrl || '/dashboard';

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('vibe_oauth_role', role);
      sessionStorage.setItem('vibe_oauth_next', redirectDestination);
      document.cookie = `vibe_oauth_role=${encodeURIComponent(role)}; path=/; max-age=3600; SameSite=Lax`;
      document.cookie = `vibe_oauth_next=${encodeURIComponent(redirectDestination)}; path=/; max-age=3600; SameSite=Lax`;
    } catch {}
  }

  // Clean callback URL matching Supabase URL configuration without query string mismatch
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : undefined;

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  return { data, error };
};

/**
 * Sign Out
 */
export const signOut = async () => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout error:', e);
    }
  }
  setLocalAuthSession(null);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('vibe_auth_changed'));
    window.location.href = '/';
  }
};

/**
 * React Hook for Authentication State
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(() => {
    if (typeof window !== 'undefined') {
      return getLocalAuthSession();
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !getLocalAuthSession();
    }
    return true;
  });

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check local session first
      const local = getLocalAuthSession();
      if (local) {
        setProfile(local);
        setLoading(false);
      }

      // 2. Check Supabase session
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data } = await client.auth.getSession();
          if (data?.session?.user) {
            setUser(data.session.user);
            const userEmail = (data.session.user.email || '').toLowerCase();
            const isDifferentUser = Boolean(local && local.email && local.email.toLowerCase() !== userEmail);
            const safeLocal = isDifferentUser ? null : local;

            const isSuper = ADMIN_EMAILS.includes(userEmail);
            const meta = data.session.user.user_metadata || {};

            let mergedProfile: AuthProfile = {
              id: data.session.user.id,
              email: userEmail,
              name: meta.name || safeLocal?.name || userEmail.split('@')[0] || 'User',
              role: isSuper ? 'super_admin' : 'organizer',
              handle: meta.handle || safeLocal?.handle || userEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
              bio: meta.bio || safeLocal?.bio || '',
              avatar_url: resolveAvatarUrl({
                metaAvatar: meta.avatar_url,
                metaPicture: meta.picture,
                localAvatar: safeLocal?.avatar_url,
              }),
              brand_color: meta.brand_color || safeLocal?.brand_color || '#E8621A',
              brand_font: meta.brand_font || safeLocal?.brand_font || 'Playfair Display',
              phone: meta.phone || safeLocal?.phone,
              onboarded: safeLocal?.onboarded ?? meta.onboarded ?? false,
              isDemo: false,
            };

            // Enrich with public.profiles if exists in database (cached for 60s)
            let dbProf: any = null;
            const cached = profileDbCache.get(data.session.user.id);
            if (cached && Date.now() - cached.timestamp < 60000) {
              dbProf = cached.data;
            } else {
              try {
                const { data: fetchedProf } = await client
                  .from('profiles')
                  .select('*')
                  .eq('id', data.session.user.id)
                  .single();
                if (fetchedProf) {
                  dbProf = fetchedProf;
                  profileDbCache.set(data.session.user.id, { data: fetchedProf, timestamp: Date.now() });
                }
              } catch {}
            }

            if (dbProf) {
              const resolvedRole = isSuper
                ? 'super_admin'
                : (dbProf.role === 'super_admin' || dbProf.role === 'curator' ? dbProf.role : (dbProf.role || 'organizer'));

              const resolvedAvatar = resolveAvatarUrl({
                dbLogoUrl: dbProf.logo_url,
                dbAvatarUrl: dbProf.avatar_url,
                metaAvatar: meta.avatar_url,
                metaPicture: meta.picture,
                localAvatar: mergedProfile.avatar_url,
              });

              mergedProfile = {
                ...mergedProfile,
                name: dbProf.name || mergedProfile.name,
                role: resolvedRole as any,
                handle: dbProf.handle || mergedProfile.handle,
                bio: dbProf.bio || mergedProfile.bio,
                avatar_url: resolvedAvatar,
                brand_color: dbProf.brand_color || mergedProfile.brand_color,
                brand_font: dbProf.brand_font || mergedProfile.brand_font,
                phone: dbProf.phone || mergedProfile.phone,
                onboarded: dbProf.onboarded !== undefined ? dbProf.onboarded : mergedProfile.onboarded,
              };
            }

            setProfile(mergedProfile);
            setLocalAuthSession(mergedProfile);
          } else if (!local) {
            setUser(null);
            setProfile(null);
            setLocalAuthSession(null);
          }
        } catch (e) {
          console.warn('Auth session check failed:', e);
        }
      }

      setLoading(false);
    };

    checkAuth();

    // Listen to Supabase auth events
    const client = getSupabaseClient();
    let authListener: any = null;
    if (client) {
      const { data } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const local = getLocalAuthSession();
          const userEmail = (session.user.email || '').toLowerCase();
          const isDifferentUser = Boolean(local && local.email && local.email.toLowerCase() !== userEmail);
          const safeLocal = isDifferentUser ? null : local;

          const isSuper = ADMIN_EMAILS.includes(userEmail);
          const meta = session.user.user_metadata || {};

          let resolvedRole: 'super_admin' | 'curator' | 'organizer' | 'guest' = isSuper ? 'super_admin' : 'organizer';
          let dbProf: any = null;
          const cached = profileDbCache.get(session.user.id);
          if (cached && Date.now() - cached.timestamp < 60000) {
            dbProf = cached.data;
            if (dbProf?.role) {
              resolvedRole = isSuper ? 'super_admin' : (dbProf.role as any);
            }
          } else {
            try {
              const { data: prof } = await client
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              if (prof) {
                dbProf = prof;
                profileDbCache.set(session.user.id, { data: prof, timestamp: Date.now() });
                if (dbProf?.role) {
                  resolvedRole = isSuper ? 'super_admin' : (dbProf.role as any);
                }
              }
            } catch {}
          }

          const resolvedAvatar = resolveAvatarUrl({
            dbLogoUrl: dbProf?.logo_url,
            dbAvatarUrl: dbProf?.avatar_url,
            metaAvatar: meta.avatar_url,
            metaPicture: meta.picture,
            localAvatar: safeLocal?.avatar_url,
          });

          const mergedProfile: AuthProfile = {
            id: session.user.id,
            email: userEmail,
            name: dbProf?.name || meta.name || safeLocal?.name || session.user.email?.split('@')[0] || 'User',
            role: resolvedRole,
            handle: dbProf?.handle || meta.handle || safeLocal?.handle || session.user.email?.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
            bio: dbProf?.bio || meta.bio || safeLocal?.bio || '',
            avatar_url: resolvedAvatar,
            brand_color: dbProf?.brand_color || meta.brand_color || safeLocal?.brand_color || '#E8621A',
            brand_font: dbProf?.brand_font || meta.brand_font || safeLocal?.brand_font || 'Playfair Display',
            phone: dbProf?.phone || meta.phone || safeLocal?.phone,
            onboarded: dbProf?.onboarded !== undefined ? dbProf.onboarded : (safeLocal?.onboarded ?? meta.onboarded ?? false),
            isDemo: false,
          };
          setProfile(mergedProfile);
          setLocalAuthSession(mergedProfile);
        } else {
          setUser(null);
          setProfile(null);
          setLocalAuthSession(null);
        }
      });
      authListener = data.subscription;
    }

    // Listen to local changes across windows/tabs
    const onLocalChange = () => {
      const local = getLocalAuthSession();
      setProfile(local);
    };
    window.addEventListener('vibe_auth_changed', onLocalChange);

    return () => {
      if (authListener) authListener.unsubscribe();
      window.removeEventListener('vibe_auth_changed', onLocalChange);
    };
  }, []);

  const isStaff = Boolean(profile?.email && isStaffRole(profile?.role, profile?.email));
  const isSuperAdmin = Boolean(
    (profile?.role === 'super_admin' && profile?.email && ADMIN_EMAILS.includes(profile.email.toLowerCase())) ||
    (profile?.email && ADMIN_EMAILS.includes(profile.email.toLowerCase()))
  );

  return {
    user,
    profile,
    loading,
    isLoggedIn: !!profile,
    isOrganizer: !!profile,
    isGuest: false,
    isStaff,
    isSuperAdmin,
    signOut,
  };
};
