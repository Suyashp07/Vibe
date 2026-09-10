import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ids, status, email, event_id } = body;

    if (!status || !['confirmed', 'waitlisted', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid or missing status. Must be "confirmed", "waitlisted", or "cancelled".' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    let updatedRows: any[] = [];

    // 1. Batch update by list of IDs
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const validUuids = ids.filter(i => typeof i === 'string' && i.length === 36);
      if (validUuids.length > 0) {
        const { data, error } = await supabase
          .from('rsvps')
          .update({ status })
          .in('id', validUuids)
          .select();

        if (error) {
          console.error('Batch RSVP status update error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        updatedRows = data || [];
      }
    } 
    // 2. Single update by ID
    else if (id) {
      // If it's a valid Supabase UUID
      if (typeof id === 'string' && id.length === 36) {
        const { data, error } = await supabase
          .from('rsvps')
          .update({ status })
          .eq('id', id)
          .select();

        if (error) {
          console.error('Single RSVP status update error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        updatedRows = data || [];
      }

      // If not a UUID or if 0 rows matched and we have email & event_id, update by email & event
      if (updatedRows.length === 0 && email && event_id) {
        const query = supabase.from('rsvps').update({ status }).eq('email', email.trim());
        if (event_id.length === 36) {
          query.eq('event_id', event_id);
        }
        const { data: fallbackData } = await query.select();
        if (fallbackData && fallbackData.length > 0) {
          updatedRows = fallbackData;
        }
      }
    } 
    // 3. Fallback: Update by email & event_id if provided
    else if (email && event_id) {
      const query = supabase.from('rsvps').update({ status }).eq('email', email.trim());
      if (event_id.length === 36) {
        query.eq('event_id', event_id);
      }
      const { data, error } = await query.select();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      updatedRows = data || [];
    } else {
      return NextResponse.json({ error: 'Missing identifier (id, ids, or email + event_id)' }, { status: 400 });
    }

    console.log(`[RSVP Status Updated in Supabase] Status: "${status}", Updated Count: ${updatedRows.length}`);
    return NextResponse.json({
      success: true,
      status,
      count: updatedRows.length,
      rsvps: updatedRows
    });
  } catch (err: any) {
    console.error('Error in /api/rsvps/update-status:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
