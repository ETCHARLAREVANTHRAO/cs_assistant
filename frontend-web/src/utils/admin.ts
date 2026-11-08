const ADMIN_EMAILS = new Set([
  'etcherlarevanthrao9402@gmail.com',
  'etcharlarevanthrao9402@gmail.com',
  'revrao9550@gmail.com',
]);

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (ADMIN_EMAILS.has(normalized)) return true;
  const envAdmins = ((import.meta as any).env?.VITE_ADMIN_EMAILS || '').split(',');
  return envAdmins.some((e: string) => e.trim().toLowerCase() === normalized && e.trim().length > 0);
}
