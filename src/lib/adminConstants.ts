export const ADMIN_EMAILS: string[] = [
  'suyashpersonal@gmail.com',
  'suyashpandey4002@gmail.com',
  'pandeysuyash100@gmail.com',
  'suyashpersonal100@gmail.com',
  ...(process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
    : []),
];

export function isStaffRole(role?: string, email?: string): boolean {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return true;
  return role === 'super_admin' || role === 'curator';
}

export function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
