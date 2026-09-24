import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Check public.profiles table
    const { data: profs, error: profError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .ilike('email', email)
      .limit(1);

    if (profs && profs.length > 0) {
      return NextResponse.json({
        exists: true,
        source: 'profiles',
        message: 'An account with this email already exists.',
      });
    }

    // 2. Check Supabase auth.users via admin API
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const matched = usersData?.users?.find(
        (u) => (u.email || '').toLowerCase() === email
      );

      if (matched) {
        return NextResponse.json({
          exists: true,
          source: 'auth',
          message: 'An account with this email already exists.',
        });
      }
    } catch (authErr) {
      console.warn('Auth admin listUsers check failed, continuing:', authErr);
    }

    return NextResponse.json({ exists: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal check failed' }, { status: 500 });
  }
}
