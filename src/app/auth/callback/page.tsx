'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { setLocalAuthSession, AuthProfile, ADMIN_EMAILS } from '@/lib/auth';
import { Sparkles } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your session...');

  useEffect(() => {
    const handleAuth = async () => {
      const client = getSupabaseClient();
      let role = (searchParams.get('role') as 'organizer' | 'guest') || 'organizer';
      let next = searchParams.get('next');

      if (typeof window !== 'undefined') {
        const storedRole = sessionStorage.getItem('vibe_oauth_role') as 'organizer' | 'guest' | null;
        const storedNext = sessionStorage.getItem('vibe_oauth_next');
        if (storedRole) role = storedRole;
        if (!next && storedNext) next = storedNext;
        sessionStorage.removeItem('vibe_oauth_role');
        sessionStorage.removeItem('vibe_oauth_next');
      }

      if (!next) {
        next = role === 'guest' ? '/guest' : '/dashboard';
      }

      const code = searchParams.get('code');

      if (client) {
        // 1. If code in query params, exchange for session directly in the browser!
        let user: any = null;
        if (code) {
          try {
            const { data, error } = await client.auth.exchangeCodeForSession(code);
            if (!error && data?.user) {
              user = data.user;
            }
          } catch (e) {
            console.warn('Code exchange error:', e);
          }
        }

        // 2. Check if session already established
        if (!user) {
          const { data } = await client.auth.getSession();
          if (data?.session?.user) {
            user = data.session.user;
          }
        }

        if (user) {
          const meta = user.user_metadata || {};
          const cleanEmail = (user.email || '').toLowerCase();
          const isSuper = ADMIN_EMAILS.includes(cleanEmail);

          let dbProf: any = null;
          try {
            const { data } = await client
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            dbProf = data;
          } catch {}

          const assignedRole = isSuper
            ? 'super_admin'
            : (dbProf?.role || meta.role || role);

          const profile: AuthProfile = {
            id: user.id,
            email: cleanEmail,
            name: dbProf?.name || meta.full_name || meta.name || cleanEmail.split('@')[0] || 'User',
            role: assignedRole as any,
            handle: dbProf?.handle || meta.handle || cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
            bio: dbProf?.bio || meta.bio,
            avatar_url: dbProf?.logo_url || dbProf?.avatar_url || meta.avatar_url || meta.picture,
            brand_color: dbProf?.brand_color || meta.brand_color || '#0A0A0A',
            brand_font: 'Inter',
            phone: dbProf?.phone || meta.phone,
            onboarded: dbProf?.onboarded !== undefined ? dbProf.onboarded : (assignedRole === 'guest' || Boolean(dbProf?.handle)),
            isDemo: false
          };

          setLocalAuthSession(profile);

          // Ensure upserted in Supabase
          try {
            await client.from('profiles').upsert({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              handle: profile.handle,
              avatar_url: profile.avatar_url,
              brand_color: profile.brand_color,
              brand_font: 'Inter',
              onboarded: profile.onboarded,
            });
          } catch {}

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
