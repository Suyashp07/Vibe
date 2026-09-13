import { createClient } from '@supabase/supabase-js';

export interface AuditEventPayload {
  actorId?: string;
  actorEmail: string;
  actorRole?: string;
  action: string;
  targetType: 'event' | 'rsvp' | 'profile' | 'curator' | 'system';
  targetId: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Log an immutable administrative action to public.audit_logs
 */
export async function logAuditEvent(payload: AuditEventPayload): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: payload.actorId || null,
      actor_email: payload.actorEmail,
      actor_role: payload.actorRole || 'admin',
      action: payload.action,
      target_type: payload.targetType,
      target_id: payload.targetId,
      ip_address: payload.ipAddress || null,
      metadata: payload.metadata || {},
    });

    if (error) {
      console.warn('[Audit Log] Failed to insert audit event:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Audit Log] Unexpected error logging audit event:', err);
    return false;
  }
}
