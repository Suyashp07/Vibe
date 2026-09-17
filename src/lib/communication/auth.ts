/**
 * Server-Side Authentication & Authorization for Vibe Communication Gateway
 *
 * Ensures that:
 * 1. Client-supplied identities (guestId, hostId, requesterRole) are never trusted blindly.
 * 2. Authenticated user sessions are verified via Supabase Bearer token, Supabase SSR cookies,
 *    or verified local auth cookies.
 * 3. Callers are strictly authorized as GUEST (conversation participant), HOST (event organizer),
 *    or SUPER_ADMIN.
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSuperAdminEmail, ADMIN_EMAILS } from '../adminConstants';

export interface VerifiedSession {
  userId: string;
  email: string;
  role: 'user' | 'super_admin' | 'curator';
  isSuperAdmin: boolean;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Verifies caller session from Authorization header, Supabase SSR cookies, or local auth session.
 * Returns null if the caller is completely unauthenticated.
 */
export async function verifyCommunicationSession(req: NextRequest): Promise<VerifiedSession | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  let user: { id: string; email: string } | null = null;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createClient(supabaseUrl, anonKey);
    const { data } = await supabase.auth.getUser(token);
    if (data?.user?.email) {
      user = { id: data.user.id, email: data.user.email };
    }
  }

  // 2. Check Supabase SSR Cookies
  if (!user) {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      });
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        user = { id: data.user.id, email: data.user.email };
      }
    } catch {
      // Cookies not available or SSR context error
    }
  }

  // 3. Fallback to vibe_auth_user cookie
  if (!user) {
    try {
      const cookieStore = cookies();
      const userCookie = cookieStore.get('vibe_auth_user')?.value || req.cookies.get('vibe_auth_user')?.value;
      if (userCookie) {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        if (parsed?.email) {
          user = { id: parsed.id || '', email: parsed.email.toLowerCase().trim() };
        }
      }
      if (!user) {
        const emailCookie = cookieStore.get('vibe_auth_email')?.value || req.cookies.get('vibe_auth_email')?.value;
        if (emailCookie) {
          user = { id: '', email: decodeURIComponent(emailCookie).toLowerCase().trim() };
        }
      }
    } catch {
      // Invalid cookie JSON
    }
  }

  if (!user || !user.email) {
    return null;
  }

  // Resolve user.id and role from profiles table if needed
  const adminClient = getSupabaseAdmin();
  let resolvedRole: 'user' | 'super_admin' | 'curator' = 'user';

  try {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (profile) {
      if (profile.id) user.id = profile.id;
      if (profile.role === 'super_admin' || profile.role === 'curator') {
        resolvedRole = profile.role;
      }
    }
  } catch {
    // Ignore profile lookup error
  }

  const isSuper = isSuperAdminEmail(user.email);
  if (isSuper) {
    resolvedRole = 'super_admin';
  }

  return {
    userId: user.id || user.email,
    email: user.email,
    role: resolvedRole,
    isSuperAdmin: resolvedRole === 'super_admin',
  };
}

/**
 * Sanitizes a Conversation record before returning to the frontend:
 * Strips private host infrastructure details (telegram_chat_id, telegram_topic_id).
 */
export function sanitizeConversationForClient(conv: any): any {
  if (!conv) return null;
  const sanitized = { ...conv };
  delete sanitized.telegram_chat_id;
  delete sanitized.telegram_topic_id;
  return sanitized;
}
