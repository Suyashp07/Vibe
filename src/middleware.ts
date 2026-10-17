import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EMAILS, ADMIN_SECRET_SLUG, PRIMARY_FOUNDERS } from '@/lib/adminConstants';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. OBFUSCATION SECURITY: Completely disguise '/admin' as 404 Not Found
  // Any public visitor, bot, or scraper hitting /admin directly receives a 404.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.rewrite(new URL('/_not-found', request.url));
  }

  // 2. Secret Admin Gateway (e.g. '/control-99f')
  const secretPrefix = `/${ADMIN_SECRET_SLUG}`;
  if (pathname === secretPrefix || pathname.startsWith(`${secretPrefix}/`)) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

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

    // Not authenticated -> Redirect to login with redirect param back to secret path
    if (!user || !user.email) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const effectiveEmail = user.email.toLowerCase().trim();

    // Primary founders always authorized
    if (PRIMARY_FOUNDERS.includes(effectiveEmail)) {
      const internalUrl = request.nextUrl.clone();
      internalUrl.pathname = pathname.replace(new RegExp(`^${secretPrefix}`), '/admin');
      return NextResponse.rewrite(internalUrl);
    }

    // Whitelist check
    let isAuthorized = ADMIN_EMAILS.includes(effectiveEmail);

    // Database role check via service role client if not in whitelist
    if (!isAuthorized) {
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
            isAuthorized = true;
          }
        } catch (err) {
          console.error('Admin middleware role check error:', err);
        }
      }
    }

    if (!isAuthorized) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/dashboard';
      forbiddenUrl.searchParams.set('denied', 'admin_access_required');
      return NextResponse.redirect(forbiddenUrl);
    }

    // Authorized staff: rewrite secret URL to internal /admin route
    const internalUrl = request.nextUrl.clone();
    internalUrl.pathname = pathname.replace(new RegExp(`^${secretPrefix}`), '/admin');
    return NextResponse.rewrite(internalUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/control-99f',
    '/control-99f/:path*',
  ],
};
