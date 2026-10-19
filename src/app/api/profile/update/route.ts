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

    // Convert base64 avatar_url into a permanent Supabase Storage URL
    let finalAvatarUrl = avatar_url;
    if (avatar_url && typeof avatar_url === 'string' && avatar_url.startsWith('data:image/')) {
      try {
        const matches = avatar_url.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `avatars/${id || 'user'}-${Date.now()}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from('event-covers')
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true,
            });

          if (!uploadErr) {
            const { data: pubData } = supabase.storage
              .from('event-covers')
              .getPublicUrl(fileName);
            if (pubData?.publicUrl) {
              finalAvatarUrl = pubData.publicUrl;
            }
          } else {
            console.warn('Storage upload error for avatar:', uploadErr.message);
          }
        }
      } catch (uploadException) {
        console.warn('Failed to convert base64 avatar to storage:', uploadException);
      }
    }

    // 1. If valid UUID user id and service role is available, update auth.users metadata
    if (id && !id.startsWith('guest-') && !id.startsWith('dev-') && !id.startsWith('usr-')) {
      try {
        // CRITICAL: NEVER store data: URI in user_metadata because Gotrue writes it into cookies,
        // which triggers 494 REQUEST_HEADER_TOO_LARGE!
        const safeMetaAvatar = finalAvatarUrl?.startsWith('http') ? finalAvatarUrl : '';

        await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            name,
            avatar_url: safeMetaAvatar,
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
    const fullPayload: Record<string, any> = {
      name: name || undefined,
      handle: handle || undefined,
      bio: bio || undefined,
      logo_url: finalAvatarUrl || undefined,
      brand_color: brand_color || undefined,
      brand_font: brand_font || undefined,
      phone: phone || undefined,
      city: city || undefined,
      gender: gender || undefined,
      dob: dob || undefined,
      age: age ? parseInt(String(age), 10) : undefined,
      public_profile_consent: public_profile_consent !== undefined ? public_profile_consent : undefined,
      show_city_consent: show_city_consent !== undefined ? show_city_consent : undefined,
      dpdp_consent: dpdp_consent !== undefined ? dpdp_consent : undefined,
      onboarded: true,
    };

    if (id && !id.startsWith('guest-') && !id.startsWith('dev-')) {
      fullPayload.id = id;
    }
    if (email) {
      fullPayload.email = email;
    }
    if (role) {
      fullPayload.role = role;
    }

    if (id && !id.startsWith('guest-') && !id.startsWith('dev-')) {
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(fullPayload);

      // If columns do not exist in profiles table yet, gracefully fall back to base columns
      if (upsertErr) {
        if (upsertErr.message?.toLowerCase().includes('column') || upsertErr.code === '42703') {
          const basePayload = {
            id,
            email: email || undefined,
            role: role || undefined,
            name: name || undefined,
            handle: handle || undefined,
            bio: bio || undefined,
            logo_url: finalAvatarUrl || undefined,
            brand_color: brand_color || undefined,
            brand_font: brand_font || undefined,
            phone: phone || undefined,
            onboarded: true,
          };
          await supabase.from('profiles').upsert(basePayload);
        } else {
          console.warn('Server profiles table upsert warning:', upsertErr.message);
        }
      }
    }

    return NextResponse.json({ success: true, data: { ...body, avatar_url: finalAvatarUrl } });
  } catch (err: any) {
    console.error('Error updating profile in API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
