import { SupabaseClient } from '@supabase/supabase-js';
import {
  PRIMARY_FOUNDERS,
  ADMIN_EMAILS,
  IMMUTABLE_ADMINS,
  getImmutableAdmin,
  DEPRECATED_ADMIN_EMAILS,
} from './adminConstants';

export interface SuperAdminEntry {
  email: string;
  name?: string;
  source: 'whitelist' | 'database' | 'granted';
  isPrimaryFounder: boolean;
  isImmutable: boolean;
  tier: 'developer_admin' | 'owner_admin' | 'super_admin';
  tierLabel: string;
  created_at?: string;
  userId?: string;
  grantedBy?: string;
}

/**
 * Reconstructs live superadmin grants and revocations from Supabase
 * using audit_logs + profiles + immutable administrators.
 * This guarantees persistence across serverless lambda cold starts
 * without needing extra migrations.
 */
export async function getLiveSuperadminRegistry(
  supabase: SupabaseClient,
  profilesList: any[] = []
): Promise<{
  superAdminsList: SuperAdminEntry[];
  grantedEmails: Set<string>;
  revokedEmails: Set<string>;
}> {
  const grantedEmails = new Set<string>();
  const revokedEmails = new Set<string>();
  const grantMetadata = new Map<string, { grantedBy?: string; grantedAt?: string; notes?: string }>();

  // Ensure deprecated admins are always marked as revoked/blocked
  DEPRECATED_ADMIN_EMAILS.forEach((dep) => revokedEmails.add(dep));

  // 1. Replay audit_logs for superadmin grant/revoke actions in chronological order
  try {
    const { data: auditEvents } = await supabase
      .from('audit_logs')
      .select('action, target_id, metadata, created_at')
      .in('action', ['grant_superadmin', 'revoke_superadmin'])
      .order('created_at', { ascending: true });

    if (auditEvents && Array.isArray(auditEvents)) {
      for (const event of auditEvents) {
        const rawEmail = event.metadata?.targetEmail || event.target_id || '';
        const email = String(rawEmail).toLowerCase().trim();
        if (!email || !email.includes('@')) continue;

        // Deprecated admins can NEVER be granted
        if (DEPRECATED_ADMIN_EMAILS.includes(email)) continue;

        // Immutable administrators can NEVER be revoked
        if (PRIMARY_FOUNDERS.includes(email)) continue;

        if (event.action === 'grant_superadmin') {
          revokedEmails.delete(email);
          grantedEmails.add(email);
          grantMetadata.set(email, {
            grantedBy: event.metadata?.grantedBy || event.metadata?.actorEmail || 'Founder',
            grantedAt: event.created_at,
            notes: event.metadata?.notes,
          });
        } else if (event.action === 'revoke_superadmin') {
          grantedEmails.delete(email);
          revokedEmails.add(email);
        }
      }
    }
  } catch (err) {
    console.warn('[superadminManager] Failed to read audit_logs for superadmin events:', err);
  }

  // 2. Also check superadmin_grants table if it exists
  try {
    const { data: dbGrants } = await supabase
      .from('superadmin_grants')
      .select('email, granted_by, created_at, notes');

    if (dbGrants && Array.isArray(dbGrants)) {
      for (const g of dbGrants) {
        const email = String(g.email || '').toLowerCase().trim();
        if (email && !revokedEmails.has(email) && !DEPRECATED_ADMIN_EMAILS.includes(email)) {
          grantedEmails.add(email);
          if (!grantMetadata.has(email)) {
            grantMetadata.set(email, {
              grantedBy: g.granted_by,
              grantedAt: g.created_at,
              notes: g.notes,
            });
          }
        }
      }
    }
  } catch {
    // Optional table
  }

  // 3. Build unified superadmin map
  const superAdminMap = new Map<string, SuperAdminEntry>();

  // A. Immutable Administrators (Developer Admin & Owner Admin) ALWAYS have access
  IMMUTABLE_ADMINS.forEach((immutable) => {
    const clean = immutable.email.toLowerCase().trim();
    const matchedProfile = profilesList.find((p) => (p.email || '').toLowerCase() === clean);
    superAdminMap.set(clean, {
      email: clean,
      name: matchedProfile?.name || immutable.name,
      source: 'whitelist',
      isPrimaryFounder: true,
      isImmutable: true,
      tier: immutable.tier,
      tierLabel: immutable.roleTitle,
      created_at: matchedProfile?.created_at,
      userId: matchedProfile?.id,
    });
  });

  // B. Whitelist emails from env/constants (EXCLUDING deprecated or revoked)
  ADMIN_EMAILS.forEach((email) => {
    const clean = email.toLowerCase().trim();
    if (revokedEmails.has(clean) || DEPRECATED_ADMIN_EMAILS.includes(clean)) return;

    if (!superAdminMap.has(clean)) {
      const matchedProfile = profilesList.find((p) => (p.email || '').toLowerCase() === clean);
      const imm = getImmutableAdmin(clean);
      superAdminMap.set(clean, {
        email: clean,
        name: matchedProfile?.name || (imm ? imm.name : 'Vibe Administrator'),
        source: 'whitelist',
        isPrimaryFounder: Boolean(imm),
        isImmutable: Boolean(imm),
        tier: imm ? imm.tier : 'super_admin',
        tierLabel: imm ? imm.roleTitle : 'Super Admin',
        created_at: matchedProfile?.created_at,
        userId: matchedProfile?.id,
      });
    }
  });

  // C. Profiles table with role = 'super_admin' (EXCLUDING deprecated or revoked)
  profilesList.forEach((p) => {
    if (p.role === 'super_admin' && p.email) {
      const clean = p.email.toLowerCase().trim();
      if (revokedEmails.has(clean) || DEPRECATED_ADMIN_EMAILS.includes(clean)) return;

      const existing = superAdminMap.get(clean);
      const imm = getImmutableAdmin(clean);
      superAdminMap.set(clean, {
        email: clean,
        name: p.name || existing?.name || (imm ? imm.name : 'Super Administrator'),
        source: existing ? existing.source : 'database',
        isPrimaryFounder: Boolean(imm),
        isImmutable: Boolean(imm),
        tier: imm ? imm.tier : 'super_admin',
        tierLabel: imm ? imm.roleTitle : 'Super Admin',
        created_at: p.created_at,
        userId: p.id,
      });
    }
  });

  // D. Dynamically granted emails from audit trail / grants table
  grantedEmails.forEach((email) => {
    const clean = email.toLowerCase().trim();
    if (revokedEmails.has(clean) || DEPRECATED_ADMIN_EMAILS.includes(clean)) return;

    if (!superAdminMap.has(clean)) {
      const meta = grantMetadata.get(clean);
      const matchedProfile = profilesList.find((p) => (p.email || '').toLowerCase() === clean);
      const imm = getImmutableAdmin(clean);
      superAdminMap.set(clean, {
        email: clean,
        name: matchedProfile?.name || (imm ? imm.name : 'Granted Administrator'),
        source: 'granted',
        isPrimaryFounder: Boolean(imm),
        isImmutable: Boolean(imm),
        tier: imm ? imm.tier : 'super_admin',
        tierLabel: imm ? imm.roleTitle : 'Super Admin',
        created_at: meta?.grantedAt || matchedProfile?.created_at,
        grantedBy: meta?.grantedBy,
        userId: matchedProfile?.id,
      });
    }
  });

  return {
    superAdminsList: Array.from(superAdminMap.values()),
    grantedEmails,
    revokedEmails,
  };
}
