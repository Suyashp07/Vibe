import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
};

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase browser client
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (typeof window === 'undefined') return null;
  if (!isSupabaseConfigured()) return null;

  if (!browserClient && supabaseUrl && supabaseAnonKey) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return browserClient;
};

/**
 * Realtime subscription to live RSVPs and Comments for a specific event
 */
export const subscribeToEventRealtime = (
  eventId: string,
  onRsvpChange: (payload: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel(`event-rsvps-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rsvps',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        onRsvpChange(payload);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

/**
 * Upload cover image to Supabase Storage (bucket: 'event-covers')
 */
export const uploadCoverImage = async (file: File): Promise<string | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await client.storage
      .from('event-covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data } = client.storage.from('event-covers').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to Supabase:', err);
    return null;
  }
};
