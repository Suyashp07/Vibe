export const PRIMARY_FOUNDERS: string[] = [
  'pandeysuyash100@gmail.com',
  'suyashpersonal@gmail.com',
].map((e) => e.trim().toLowerCase());

export const ADMIN_EMAILS: string[] = [
  ...PRIMARY_FOUNDERS,
  ...(process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : []),
].map((e) => e.trim().toLowerCase());

// Secret obfuscated path for the admin workstation (Default: 'control-99f')
export const ADMIN_SECRET_SLUG: string = (
  process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX || 'control-99f'
).replace(/^\//, '').trim();

export const ADMIN_BASE_PATH: string = `/${ADMIN_SECRET_SLUG}`;

export function isStaffRole(role?: string, email?: string): boolean {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  return role === 'super_admin' || role === 'curator';
}

export function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
