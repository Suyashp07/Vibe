export interface ImmutableAdminConfig {
  email: string;
  roleTitle: string;
  tier: 'developer_admin' | 'owner_admin';
  name: string;
}

export const IMMUTABLE_ADMINS: ImmutableAdminConfig[] = [
  {
    email: 'pandeysuyash100@gmail.com',
    roleTitle: 'Developer Admin',
    tier: 'developer_admin',
    name: 'Suyash Pandey',
  },
  {
    email: 'mail.jaiswal@gmail.com',
    roleTitle: 'Owner Admin',
    tier: 'owner_admin',
    name: 'Ankur Jaiswal',
  },
];

// Returns config if email belongs to an immutable protected administrator
export function getImmutableAdmin(email?: string): ImmutableAdminConfig | undefined {
  if (!email) return undefined;
  const clean = email.trim().toLowerCase();
  return IMMUTABLE_ADMINS.find((a) => a.email.toLowerCase() === clean);
}

export const PRIMARY_FOUNDERS: string[] = IMMUTABLE_ADMINS.map((a) => a.email.toLowerCase().trim());

// Deprecated / revoked administrator emails that are explicitly barred from administrative privileges
export const DEPRECATED_ADMIN_EMAILS: string[] = [
  'suyashpersonal@gmail.com',
  'suyashpersonal100@gmail.com',
].map((e) => e.trim().toLowerCase());

export const ADMIN_EMAILS: string[] = [
  ...PRIMARY_FOUNDERS,
  ...(process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : []),
]
  .map((e) => e.trim().toLowerCase())
  .filter((e) => !DEPRECATED_ADMIN_EMAILS.includes(e));

// Secret obfuscated path for the admin workstation (Default: 'control-99f')
export const ADMIN_SECRET_SLUG: string = (
  process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX || 'control-99f'
).replace(/^\//, '').trim();

export const ADMIN_BASE_PATH: string = `/${ADMIN_SECRET_SLUG}`;

export function isStaffRole(role?: string, email?: string): boolean {
  if (email) {
    const clean = email.toLowerCase().trim();
    if (DEPRECATED_ADMIN_EMAILS.includes(clean)) return false;
    if (ADMIN_EMAILS.includes(clean)) return true;
  }
  return role === 'super_admin' || role === 'curator';
}

export function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  if (DEPRECATED_ADMIN_EMAILS.includes(clean)) return false;
  return ADMIN_EMAILS.includes(clean);
}

