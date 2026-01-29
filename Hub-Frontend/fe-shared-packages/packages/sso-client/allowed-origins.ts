/**
 * SSO 허용 Origin 검증
 *
 * @description
 * Open Redirect 공격 방지를 위한 허용 도메인 검증
 * - 정확한 도메인 매칭
 * - 서브도메인 패턴 매칭
 * - 개발 환경 도메인 허용
 */

/**
 * 기본 허용 도메인 목록
 */
export const DEFAULT_ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
] as const;

/**
 * 기본 허용 패턴 (서브도메인 포함)
 */
export const DEFAULT_ALLOWED_PATTERNS = [
  /^localhost$/,
  /^127\.0\.0\.1$/,
  // 거북스쿨 도메인
  /\.geobukschool\.kr$/,
  /^geobukschool\.kr$/,
  /\.turtleskool\.com$/,
  /^turtleskool\.com$/,
  /\.geobukschool\.com$/,
  /^geobukschool\.com$/,
  // Vercel 미리보기 URL
  /\.vercel\.app$/,
  // Firebase 호스팅
  /\.web\.app$/,
  /\.firebaseapp\.com$/,
] as const;

/**
 * URL이 허용된 origin인지 검증
 *
 * @param url - 검증할 URL
 * @param additionalDomains - 추가로 허용할 도메인 목록
 * @param additionalPatterns - 추가로 허용할 패턴 목록
 * @returns 허용된 origin 여부
 *
 * @example
 * ```ts
 * isAllowedOrigin('https://susi.geobukschool.kr'); // true
 * isAllowedOrigin('https://evil.com'); // false
 * isAllowedOrigin('https://custom.com', ['custom.com']); // true
 * ```
 */
export function isAllowedOrigin(
  url: string,
  additionalDomains: string[] = [],
  additionalPatterns: RegExp[] = [],
): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // 1. 정확한 도메인 매칭
    const allowedDomains = [...DEFAULT_ALLOWED_DOMAINS, ...additionalDomains];
    if (allowedDomains.includes(hostname)) {
      return true;
    }

    // 2. 패턴 매칭 (서브도메인 등)
    const allowedPatterns = [...DEFAULT_ALLOWED_PATTERNS, ...additionalPatterns];
    return allowedPatterns.some(pattern => pattern.test(hostname));
  } catch {
    // URL 파싱 실패
    return false;
  }
}

/**
 * Origin이 같은지 비교
 *
 * @param url1 - 첫 번째 URL
 * @param url2 - 두 번째 URL
 * @returns 같은 origin인지 여부
 */
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const parsed1 = new URL(url1);
    const parsed2 = new URL(url2);
    return parsed1.origin === parsed2.origin;
  } catch {
    return false;
  }
}

/**
 * URL에서 origin 추출
 *
 * @param url - URL 문자열
 * @returns origin (protocol + host) 또는 null
 */
export function extractOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * postMessage를 위한 origin 검증
 *
 * @param origin - postMessage 이벤트의 origin
 * @param allowedOrigins - 허용된 origin 목록 (정확한 매칭)
 * @returns 허용된 origin 여부
 */
export function isAllowedMessageOrigin(
  origin: string,
  allowedOrigins: string[],
): boolean {
  // 정확한 매칭 (postMessage는 정확한 origin 매칭이 중요)
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // 패턴 매칭 (개발 환경 등)
  try {
    const parsed = new URL(origin);
    return DEFAULT_ALLOWED_PATTERNS.some(pattern => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}
