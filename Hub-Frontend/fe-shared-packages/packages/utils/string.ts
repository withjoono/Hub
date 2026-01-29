/**
 * 문자열 유틸리티 함수
 */

/**
 * 문자열 자르기 (말줄임)
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 첫 글자 대문자
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * URL 슬러그 생성
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 빈 문자열 또는 null/undefined 체크
 */
export function isEmpty(str: string | null | undefined): boolean {
  return str === null || str === undefined || str.trim() === '';
}

/**
 * 문자열에서 HTML 태그 제거
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * 이메일 마스킹 (abc@example.com → a**@example.com)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(local.length - 1, 2));
  return `${maskedLocal}@${domain}`;
}

/**
 * 전화번호 마스킹 (010-1234-5678 → 010-****-5678)
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})[-\s]?(\d{4})[-\s]?(\d{4})/, '$1-****-$3');
}
