'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { setLocalAuthSession, AuthProfile } from '@/lib/auth';
import { Sparkles } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your session...');

  useEffect(() => {
    const handleAuth = async () => {
      const client = getSupabaseClient();
      const role = (searchParams.get('role') as 'organizer' | 'guest') || 'organizer';
      const next = searchParams.get('next') || (role === 'guest' ? '/guest' : '/dashboard');
      const code = searchParams.get('code');

      if (client) {
        // 1. If code in query params, exchange for session directly in the browser!
        if (code) {
          try {
            const { data, error } = await client.auth.exchangeCodeForSession(code);
            if (!error && data?.user) {
              const meta = data.user.user_metadata || {};
              let profile: AuthProfile = {
                id: data.user.id,
                email: data.user.email || '',
                name: meta.name || data.user.email?.split('@')[0] || 'User',
                role: meta.role || role,
                handle: meta.handle || data.user.email?.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
                brand_color: meta.brand_color || '#E8621A',
                brand_font: meta.brand_font || 'Playfair Display',
                avatar_url: meta.avatar_url,
                onboarded: Boolean(meta.onboarded),
                isDemo: false
              };

              try {
                const { data: dbProf } = await client
                  .from('profiles')
                  .select('*')
                  .eq('id', data.user.id)
                  .single();
                if (dbProf) {
                  profile = {
                    ...profile,
                    name: dbProf.name || profile.name,
                    role: dbProf.role || profile.role,
                    handle: dbProf.handle || profile.handle,
                    bio: dbProf.bio || profile.bio,
                    avatar_url: dbProf.logo_url || dbProf.avatar_url || profile.avatar_url,
                    brand_color: dbProf.brand_color || profile.brand_color,
                    brand_font: dbProf.brand_font || profile.brand_font,
                    phone: dbProf.phone || profile.phone,
                    onboarded: dbProf.onboarded !== undefined ? dbProf.onboarded : profile.onboarded,
                  };
                }
              } catch {}

              setLocalAuthSession(profile);
              router.replace(next);
              return;
            }
          } catch (e) {
            console.warn('Code exchange error:', e);
          }
        }

        // 2. Check if session already established (e.g. hash token #access_token)
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          const meta = data.session.user.user_metadata || {};
          let profile: AuthProfile = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: meta.name || data.session.user.email?.split('@')[0] || 'User',
            role: meta.role || role,
            handle: meta.handle || data.session.user.email?.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
            brand_color: meta.brand_color || '#E8621A',
            brand_font: meta.brand_font || 'Playfair Display',
            avatar_url: meta.avatar_url,
            onboarded: Boolean(meta.onboarded),
            isDemo: false
          };

          try {
            const { data: dbProf } = await client
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
            if (dbProf) {
              profile = {
                ...profile,
                name: dbProf.name || profile.name,
                role: dbProf.role || profile.role,
                handle: dbProf.handle || profile.handle,
                bio: dbProf.bio || profile.bio,
                avatar_url: dbProf.logo_url || dbProf.avatar_url || profile.avatar_url,
                brand_color: dbProf.brand_color || profile.brand_color,
                brand_font: dbProf.brand_font || profile.brand_font,
                phone: dbProf.phone || profile.phone,
                onboarded: dbProf.onboarded !== undefined ? dbProf.onboarded : profile.onboarded,
              };
            }
          } catch {}

          setLocalAuthSession(profile);
          router.replace(next);
          return;
        }
      }

      router.replace(next);
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-2 p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-brand text-gold flex items-center justify-center shadow-md animate-pulse">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-lg text-ink">{status}</h2>
        <p className="text-xs text-ink-muted">Finalizing authentication with Vibe by Swaniki...</p>
      </div>
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-2 flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
      <CallbackHandler />
    </Suspense>
  );
}
