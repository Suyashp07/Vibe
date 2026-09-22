import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import { ADMIN_EMAILS, isStaffRole, isSuperAdminEmail } from './adminConstants';
export { ADMIN_EMAILS, isStaffRole, isSuperAdminEmail };

/**
 * Server-side verification of staff / admin status
 */
export async function verifyStaffSession(req?: NextRequest): Promise<{
  authorized: boolean;
  user: { id: string; email: string } | null;
  role: string;
  isSuperAdmin: boolean;
  error?: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

  if (!supabaseUrl || !anonKey) {
    return { authorized: false, user: null, role: 'none', isSuperAdmin: false, error: 'Supabase credentials not configured' };
  }

  let user: { id: string; email: string } | null = null;

  // 1. Check Authorization Bearer header if provided
  if (req) {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const supabase = createClient(supabaseUrl, anonKey);
      const { data, error } = await supabase.auth.getUser(token);
      if (data?.user?.email) {
        user = { id: data.user.id, email: data.user.email };
      }
    }
  }

  // 2. Fallback to cookies via @supabase/ssr
  if (!user) {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore in read-only route contexts
            }
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        user = { id: data.user.id, email: data.user.email };
      }
    } catch (e) {
      // Cookies not available or SSR context error
    }
  }

  // 3. Fallback check: user must be authenticated via valid token or session
  if (!user || !user.email) {
    return { authorized: false, user: null, role: 'none', isSuperAdmin: false, error: 'Unauthorized: No active cryptographic session' };
  }

  const cleanEmail = user.email.toLowerCase();

  // 4. Check whitelist first
  const isSuper = isSuperAdminEmail(cleanEmail);
  if (isSuper) {
    return { authorized: true, user: { id: user.id, email: cleanEmail }, role: 'super_admin', isSuperAdmin: true };
  }

  // 5. Query database profiles table via service role client to check assigned role
  const adminClient = createClient(supabaseUrl, serviceKey || anonKey, { auth: { persistSession: false } });
  let profileRole: string | null = null;
  try {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role) {
      profileRole = profile.role;
    }
  } catch (err) {
    console.warn('Profile lookup failed in verifyStaffSession:', err);
  }

  if (profileRole && (profileRole === 'super_admin' || profileRole === 'curator')) {
    return {
      authorized: true,
      user: { id: user.id, email: cleanEmail },
      role: profileRole,
      isSuperAdmin: profileRole === 'super_admin',
    };
  }

  return { authorized: false, user, role: 'unauthorized', isSuperAdmin: false, error: 'Forbidden: Insufficient privileges' };
}
