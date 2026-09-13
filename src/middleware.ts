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
  if (pathname.startsWith('/admin')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return response;
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

    // 1. Not logged in -> Redirect to login with redirect param
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Logged in -> Check email against whitelist or user_metadata
    const email = user.email?.toLowerCase() || '';
    const isWhitelisted = ADMIN_EMAILS.includes(email);
    const metaRole = user.user_metadata?.role;
    const isMetaStaff = metaRole === 'super_admin' || metaRole === 'curator';

    if (!isWhitelisted && !isMetaStaff) {
      // User is logged in but has no administrative privileges
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/dashboard';
      forbiddenUrl.searchParams.set('denied', 'admin_access_required');
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
