'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { INITIAL_ORGANIZERS } from './store';
import { User, Session } from '@supabase/supabase-js';

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: 'organizer' | 'guest';
  handle?: string;
  bio?: string;
  avatar_url?: string;
  brand_color?: string;
  brand_font?: string;
  phone?: string;
  onboarded?: boolean;
  isDemo?: boolean;
}

const LOCAL_STORAGE_AUTH_KEY = 'vibe_auth_session';

/**
 * Get current stored demo/local session if any
 */
export const getLocalAuthSession = (): AuthProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setLocalAuthSession = (profile: AuthProfile | null) => {
  if (typeof window === 'undefined') return;
  if (profile) {
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
  }
  // Dispatch storage event so all tabs/components update
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
      avatar_url: profileData?.logo_url || data.user.user_metadata?.avatar_url,
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
    ? `${window.location.origin}/auth/callback?role=${role}&next=${role === 'organizer' ? '/onboarding' : '/guest'}`
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
          logo_url: updated.avatar_url,
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
    avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
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
 * Sign in with Email and Password
 */
export const signInWithPassword = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: { message: 'Supabase client is not configured.' } };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (data?.user) {
    setLocalAuthSession({
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      role: data.user.user_metadata?.role || 'organizer',
      isDemo: false,
    });
  }

  return { data, error };
};

/**
 * Sign up with Email and Password
 */
export const signUpWithPassword = async (
  email: string,
  password: string,
  name: string,
  role: 'organizer' | 'guest' = 'organizer',
  handle?: string
) => {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: { message: 'Supabase client is not configured.' } };
  }

  const cleanHandle = handle?.trim().toLowerCase() || email.split('@')[0].replace(/[^a-z0-9_]/g, '_');

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        handle: cleanHandle,
      },
    },
  });

  if (error) {
    return { data: null, error };
  }

  if (data?.user) {
    const profile: AuthProfile = {
      id: data.user.id,
      email: data.user.email || email,
      name,
      role,
      handle: cleanHandle,
      brand_color: '#E8621A',
      brand_font: 'Playfair Display',
      onboarded: false,
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
        brand_font: profile.brand_font,
        onboarded: false,
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vibe_auth_changed'));
    }
  }

  return { data, error: null };
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
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check local session first
      const local = getLocalAuthSession();
      if (local) {
        setProfile(local);
      }

      // 2. Check Supabase session
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data } = await client.auth.getSession();
          if (data?.session?.user) {
            setUser(data.session.user);
            const meta = data.session.user.user_metadata || {};
            let mergedProfile: AuthProfile = {
              id: data.session.user.id,
              email: data.session.user.email || local?.email || '',
              name: meta.name || local?.name || data.session.user.email?.split('@')[0] || 'User',
              role: (meta.role || local?.role || 'organizer') as 'organizer' | 'guest',
              handle: meta.handle || local?.handle || data.session.user.email?.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
              bio: meta.bio || local?.bio || '',
              avatar_url: meta.avatar_url || local?.avatar_url || '',
              brand_color: meta.brand_color || local?.brand_color || '#E8621A',
              brand_font: meta.brand_font || local?.brand_font || 'Playfair Display',
              phone: meta.phone || local?.phone,
              onboarded: local?.onboarded ?? meta.onboarded ?? false,
              isDemo: false,
            };

            // Enrich with public.profiles if exists in database
            try {
              const { data: dbProf } = await client
                .from('profiles')
                .select('*')
                .eq('id', data.session.user.id)
                .single();
              if (dbProf) {
                mergedProfile = {
                  ...mergedProfile,
                  name: dbProf.name || mergedProfile.name,
                  role: dbProf.role || mergedProfile.role,
                  handle: dbProf.handle || mergedProfile.handle,
                  bio: dbProf.bio || mergedProfile.bio,
                  avatar_url: dbProf.logo_url || dbProf.avatar_url || mergedProfile.avatar_url,
                  brand_color: dbProf.brand_color || mergedProfile.brand_color,
                  brand_font: dbProf.brand_font || mergedProfile.brand_font,
                  phone: dbProf.phone || mergedProfile.phone,
                  onboarded: dbProf.onboarded !== undefined ? dbProf.onboarded : mergedProfile.onboarded,
                };
              }
            } catch {}

            setProfile(mergedProfile);
            setLocalAuthSession(mergedProfile);
          } else if (!local) {
            setUser(null);
            setProfile(null);
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
          const meta = session.user.user_metadata || {};
          const mergedProfile: AuthProfile = {
            id: session.user.id,
            email: session.user.email || local?.email || '',
            name: meta.name || local?.name || session.user.email?.split('@')[0] || 'User',
            role: (meta.role || local?.role || 'organizer') as 'organizer' | 'guest',
            handle: meta.handle || local?.handle || session.user.email?.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
            bio: meta.bio || local?.bio || '',
            avatar_url: meta.avatar_url || local?.avatar_url || '',
            brand_color: meta.brand_color || local?.brand_color || '#E8621A',
            brand_font: meta.brand_font || local?.brand_font || 'Playfair Display',
            phone: meta.phone || local?.phone,
            onboarded: local?.onboarded ?? meta.onboarded ?? false,
            isDemo: false,
          };
          setProfile(mergedProfile);
          setLocalAuthSession(mergedProfile);
        } else {
          const local = getLocalAuthSession();
          if (!local) {
            setUser(null);
            setProfile(null);
          }
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

  return {
    user,
    profile,
    loading,
    isLoggedIn: !!profile,
    isOrganizer: profile?.role === 'organizer',
    isGuest: profile?.role === 'guest',
    signOut,
  };
};
