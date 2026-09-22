import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EMAILS } from '@/lib/adminConstants';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Only guard /admin routes
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Not cryptographically logged in -> Redirect to login with redirect param
    if (!user || !user.email) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const effectiveEmail = user.email.toLowerCase();

    // 2. Super admin whitelist check (Primary Gate)
    const isWhitelisted = ADMIN_EMAILS.includes(effectiveEmail);
    if (isWhitelisted) {
      return response;
    }

    // 3. Database role check via Supabase Service Role Key (Secondary Gate for Telegram Curators)
    let isStaff = false;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const adminDb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
        const { data: profile } = await adminDb
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role === 'super_admin' || profile?.role === 'curator') {
          isStaff = true;
        }
      } catch (err) {
        console.error('Admin middleware role check error:', err);
      }
    }

    if (!isStaff) {
      // User is logged in but has no administrative privileges -> Bounce immediately to dashboard
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/dashboard';
      forbiddenUrl.searchParams.set('denied', 'admin_access_required');
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
