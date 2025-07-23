export function getCompanyDomain() {
  return process.env.NEXT_PUBLIC_COMPANY_EMAIL_DOMAIN || 'coderpush.com';
} 

export function isValidCompanyEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const COMPANY_EMAIL_DOMAIN = getCompanyDomain();
  return emailRegex.test(trimmed) && trimmed.endsWith(COMPANY_EMAIL_DOMAIN);
}