'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { setLocalAuthSession, AuthProfile, ADMIN_EMAILS, resolveAvatarUrl } from '@/lib/auth';
import { Sparkles, ArrowRight } from 'lucide-react';

export function CallbackHandler({
  customTitle,
  customSubtitle,
}: {
  customTitle?: string;
  customSubtitle?: string;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Verifying your session...');
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [nextUrl, setNextUrl] = useState('/dashboard');
  const [pwaReturnInfo, setPwaReturnInfo] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    // Fail-safe: if network hangs or Supabase takes longer than 4s, show manual recovery buttons
    const timer = setTimeout(() => {
      setShowManualFallback(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isCancelled = false;

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
        next = '/dashboard';
      }
      setNextUrl(next);

      const code = searchParams.get('code');

      if (client) {
        let user: any = null;
        let authSession: any = null;
        if (code) {
          try {
            setStatus('Exchanging authentication token...');
            const { data, error } = await client.auth.exchangeCodeForSession(code);
            if (!error && data?.user) {
              user = data.user;
              authSession = data.session;
            }
          } catch (e) {
            console.warn('Code exchange error:', e);
          }
        }

        if (!user) {
          try {
            const { data } = await client.auth.getUser();
            if (data?.user) {
              user = data.user;
            }
          } catch {}
        }

        if (!user || !authSession) {
          const { data } = await client.auth.getSession();
          if (data?.session?.user) {
            user = data.session.user;
            authSession = data.session;
          }
        }

        if (user && !isCancelled) {
          setStatus('Finalizing your profile...');
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
            : (dbProf?.role || meta.role || 'organizer');

          const resolvedAvatar = resolveAvatarUrl({
            dbLogoUrl: dbProf?.logo_url,
            dbAvatarUrl: dbProf?.avatar_url,
            metaAvatar: meta.avatar_url,
            metaPicture: meta.picture,
          });

          const profile: AuthProfile = {
            id: user.id,
            email: cleanEmail,
            name: dbProf?.name || meta.full_name || meta.name || cleanEmail.split('@')[0] || 'User',
            role: assignedRole as any,
            handle: dbProf?.handle || meta.handle || cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
            bio: dbProf?.bio || meta.bio,
            avatar_url: resolvedAvatar,
            brand_color: dbProf?.brand_color || meta.brand_color || '#0A0A0A',
            brand_font: 'Inter',
            phone: dbProf?.phone || meta.phone,
            city: meta.city || dbProf?.city || 'Mumbai',
            gender: meta.gender || dbProf?.gender || 'male',
            dob: meta.dob || dbProf?.dob,
            age: meta.age || dbProf?.age,
            public_profile_consent: meta.public_profile_consent ?? true,
            show_city_consent: meta.show_city_consent ?? false,
            dpdp_consent: meta.dpdp_consent ?? true,
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
              logo_url: profile.avatar_url || null,
              brand_color: profile.brand_color,
              brand_font: 'Inter',
              onboarded: profile.onboarded,
            });
          } catch {}

          // Clean up ?code= from browser URL to avoid re-triggering on reload
          if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          const isFromPwa =
            searchParams.get('from_pwa') === '1' ||
            (typeof window !== 'undefined' && (
              document.cookie.includes('vibe_is_pwa=1') ||
              sessionStorage.getItem('vibe_is_pwa') === '1'
            ));

          // 1. Broadcast to any open windows / PWA in background via BroadcastChannel
          try {
            const channel = new BroadcastChannel('vibe_auth_channel');
            channel.postMessage({
              type: 'vibe_auth_success',
              profile,
              session: authSession,
            });
          } catch {}

          // 2. If opened via window.open (in-app sheet or popup), notify opener and close
          if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage(
                {
                  type: 'vibe_auth_success',
                  profile,
                  session: authSession,
                },
                window.location.origin
              );
              setStatus('Authenticated! Closing popup...');
              setTimeout(() => {
                window.close();
              }, 400);
              return;
            } catch {}
          }

          // 3. If user initiated auth from an installed PWA and got opened in external browser:
          if (isFromPwa && authSession?.access_token) {
            const tokenParams = new URLSearchParams();
            tokenParams.set('access_token', authSession.access_token);
            tokenParams.set('refresh_token', authSession.refresh_token || '');
            tokenParams.set('pwa_auth', '1');
            const targetUrl = `${window.location.origin}${next}#${tokenParams.toString()}`;

            setPwaReturnInfo({
              url: targetUrl,
              name: profile.name,
            });

            // Automatically attempt navigating to open the PWA app
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.href = targetUrl;
              }
            }, 800);
            return;
          }

          setStatus('Redirecting you straight to your dashboard...');
          router.replace(next);
          return;
        }
      }

      // Fallback redirect if user already had session or code was already consumed
      if (!isCancelled) {
        if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        router.replace(next);
      }
    };

    handleAuth();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  if (pwaReturnInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#08080A] text-white p-6 space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FF5500] to-[#E8621A] text-white flex items-center justify-center shadow-xl shadow-[#FF5500]/30 animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2 max-w-sm">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-1">
            ✓ Signed In Successfully
          </span>
          <h2 className="font-sans font-black text-2xl text-white">
            Welcome, {pwaReturnInfo.name.split(' ')[0]}!
          </h2>
          <p className="text-xs text-white/60">
            Returning you to your installed Vibe App...
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3 pt-2">
          <a
            href={pwaReturnInfo.url}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] text-white font-black text-sm shadow-xl shadow-[#FF5500]/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:brightness-110 active:scale-[0.98]"
          >
            <span>Tap to Open Vibe App</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-center text-white/40">
            If your app doesn't open automatically, tap the button above or switch back to the Vibe app from your home screen.
          </p>
        </div>
      </div>
    );
  }

  const displayTitle = customTitle || 'Signing you in with Google...';
  const displaySubtitle = customSubtitle || status;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-xl animate-pulse">
        <Sparkles className="w-7 h-7" />
      </div>

      <div className="text-center space-y-1.5 max-w-sm">
        <h2 className="font-sans font-bold text-xl text-[#0F172A]">{displayTitle}</h2>
        <p className="text-xs text-[#64748B]">{displaySubtitle}</p>
      </div>

      <div className="w-6 h-6 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />

      {/* Fail-safe manual escape button if network is slow */}
      {showManualFallback && (
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = nextUrl;
              } else {
                router.replace(nextUrl);
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white font-bold text-xs hover:bg-[#1E293B] shadow-sm transition-all"
          >
            Continue to Dashboard →
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-[#0F172A] font-semibold text-xs hover:bg-slate-200 transition-all"
          >
            Return to Homepage
          </button>
        </div>
      )}
    </div>
  );
}
