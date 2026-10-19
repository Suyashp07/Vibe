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
    const body = await req.json().catch(() => ({}));
    const {
      id,
      email,
      name,
      role,
      handle,
      bio,
      avatar_url,
      brand_color,
      brand_font,
      phone,
      city,
      gender,
      dob,
      age,
      public_profile_consent,
      show_city_consent,
      dpdp_consent,
    } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. If valid UUID user id and service role is available, update auth.users metadata
    if (id && !id.startsWith('guest-') && !id.startsWith('dev-') && !id.startsWith('usr-')) {
      try {
        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            name,
            avatar_url,
            city,
            gender,
            dob,
            age,
            phone,
            bio,
            public_profile_consent,
            show_city_consent,
            dpdp_consent,
          },
        });
      } catch (authErr) {
        // Non-blocking fallback
        console.warn('Server admin updateUserById notice:', authErr);
      }
    }

    // 2. Upsert into public.profiles
    const profilePayload: Record<string, any> = {
      name: name || undefined,
      handle: handle || undefined,
      bio: bio || undefined,
      logo_url: avatar_url || undefined,
      brand_color: brand_color || undefined,
      brand_font: brand_font || undefined,
      phone: phone || undefined,
      onboarded: true,
    };

    if (id && !id.startsWith('guest-') && !id.startsWith('dev-')) {
      profilePayload.id = id;
    }
    if (email) {
      profilePayload.email = email;
    }
    if (role) {
      profilePayload.role = role;
    }

    if (id && !id.startsWith('guest-') && !id.startsWith('dev-')) {
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(profilePayload);
      if (upsertErr) {
        console.warn('Server profiles table upsert warning:', upsertErr.message);
      }
    }

    return NextResponse.json({ success: true, data: body });
  } catch (err: any) {
    console.error('Error updating profile in API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
