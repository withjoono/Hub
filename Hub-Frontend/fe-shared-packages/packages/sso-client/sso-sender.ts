/**
 * SSO 토큰 전송
 *
 * @description
 * Hub에서 외부 서비스로 토큰 전달
 * - postMessage 방식 (권장)
 * - URL 파라미터 방식 (레거시)
 */

import type { SSOPostMessageData, SSOTokens } from './types';
import { isAllowedOrigin } from './allowed-origins';
import { validateToken, isTokenExpired } from './token-validator';

/**
 * postMessage로 토큰 전송 (권장)
 *
 * @param targetWindow - 대상 윈도우 (iframe 또는 popup)
 * @param tokens - 전송할 토큰
 * @param targetOrigin - 대상 origin (보안상 필수)
 * @param requestId - 요청 ID (응답 매칭용)
 *
 * @description
 * 보안:
 * - targetOrigin을 '*'로 설정하지 마세요
 * - 반드시 허용된 origin만 지정하세요
 *
 * @example
 * ```ts
 * const popup = window.open('https://susi.geobukschool.kr');
 * sendTokensViaPostMessage(popup, tokens, 'https://susi.geobukschool.kr');
 * ```
 */
export function sendTokensViaPostMessage(
  targetWindow: Window | null,
  tokens: SSOTokens,
  targetOrigin: string,
  requestId?: string,
): boolean {
  if (!targetWindow) {
    console.error('[SSO] 대상 윈도우가 없습니다');
    return false;
  }

  // Origin 검증
  if (!isAllowedOrigin(targetOrigin)) {
    console.error('[SSO] 허용되지 않은 대상 origin:', targetOrigin);
    return false;
  }

  // 토큰 검증
  const validation = validateToken(tokens.accessToken);
  if (!validation.isValid) {
    console.error('[SSO] 전송할 토큰이 유효하지 않음:', validation.error);
    return false;
  }

  const message: SSOPostMessageData = {
    type: 'SSO_TOKEN_RESPONSE',
    tokens,
    requestId,
  };

  try {
    targetWindow.postMessage(message, targetOrigin);
    return true;
  } catch (error) {
    console.error('[SSO] postMessage 전송 실패:', error);
    return false;
  }
}

/**
 * 로그아웃 메시지 브로드캐스트
 *
 * @param targetWindows - 대상 윈도우 목록
 * @param targetOrigins - 대상 origin 목록
 */
export function broadcastLogout(
  targetWindows: (Window | null)[],
  targetOrigins: string[],
): void {
  const message: SSOPostMessageData = {
    type: 'SSO_LOGOUT',
  };

  targetWindows.forEach((win, index) => {
    if (win && targetOrigins[index]) {
      try {
        win.postMessage(message, targetOrigins[index]);
      } catch (error) {
        console.warn('[SSO] 로그아웃 브로드캐스트 실패:', error);
      }
    }
  });
}

/**
 * URL 파라미터로 SSO URL 생성 (레거시)
 *
 * @param baseUrl - 대상 서비스 URL
 * @param tokens - 전송할 토큰
 * @returns SSO URL (검증 실패 시 원본 URL)
 *
 * @description
 * ⚠️ 보안 경고: URL의 토큰은 히스토리/로그에 노출될 수 있음
 * 가능하면 postMessage 방식 사용 권장
 */
export function generateSSOUrl(baseUrl: string, tokens: SSOTokens): string {
  // 토큰 검증
  if (!tokens.accessToken || !tokens.refreshToken) {
    console.warn('[SSO] 토큰이 없습니다');
    return baseUrl;
  }

  const validation = validateToken(tokens.accessToken);
  if (!validation.isValid) {
    console.error('[SSO] 토큰이 유효하지 않음:', validation.error);
    return baseUrl;
  }

  if (isTokenExpired(tokens.accessToken)) {
    console.error('[SSO] 토큰이 만료됨');
    return baseUrl;
  }

  // URL 검증
  if (!isAllowedOrigin(baseUrl)) {
    console.error('[SSO] 허용되지 않은 대상 URL:', baseUrl);
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('sso_access_token', tokens.accessToken);
    url.searchParams.set('sso_refresh_token', tokens.refreshToken);
    return url.toString();
  } catch (error) {
    console.error('[SSO] URL 생성 실패:', error);
    return baseUrl;
  }
}

/**
 * postMessage 기반 SSO 로그인 (Popup 방식)
 *
 * @param targetUrl - 대상 서비스 URL
 * @param tokens - 전송할 토큰
 * @param options - 옵션
 * @returns 성공 여부 Promise
 *
 * @description
 * 1. 대상 서비스를 새 창(popup)으로 열기
 * 2. 대상 서비스에서 SSO_TOKEN_REQUEST 메시지 수신 대기
 * 3. 토큰을 postMessage로 안전하게 전달
 *
 * @example
 * ```ts
 * const success = await initiatePostMessageSSO(
 *   'https://susi.geobukschool.kr',
 *   { accessToken, refreshToken },
 *   { timeout: 10000 }
 * );
 * ```
 */
export function initiatePostMessageSSO(
  targetUrl: string,
  tokens: SSOTokens,
  options?: {
    /** 요청 타임아웃 (ms, 기본: 10000) */
    timeout?: number;
    /** 팝업 대신 리다이렉트 (기본: false) */
    redirect?: boolean;
    /** 디버그 모드 */
    debug?: boolean;
  },
): Promise<boolean> {
  const { timeout = 10000, redirect = false, debug = false } = options ?? {};

  return new Promise((resolve) => {
    // 1. 토큰 검증
    const validation = validateToken(tokens.accessToken);
    if (!validation.isValid) {
      console.error('[SSO] 토큰이 유효하지 않음:', validation.error);
      resolve(false);
      return;
    }

    // 2. URL 검증
    if (!isAllowedOrigin(targetUrl)) {
      console.error('[SSO] 허용되지 않은 대상 URL:', targetUrl);
      resolve(false);
      return;
    }

    // 3. 리다이렉트 방식 (레거시)
    if (redirect) {
      const ssoUrl = generateSSOUrl(targetUrl, tokens);
      window.location.href = ssoUrl;
      resolve(true);
      return;
    }

    // 4. 팝업 열기
    const popup = window.open(targetUrl, '_blank');
    if (!popup) {
      console.error('[SSO] 팝업이 차단되었습니다');
      // 팝업 차단 시 레거시 방식 폴백
      const ssoUrl = generateSSOUrl(targetUrl, tokens);
      window.location.href = ssoUrl;
      resolve(true);
      return;
    }

    const requestId = `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const targetOrigin = new URL(targetUrl).origin;
    let resolved = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 5. 토큰 요청 메시지 리스너
    const handleMessage = (event: MessageEvent<SSOPostMessageData>) => {
      if (resolved) return;

      // Origin 검증
      if (event.origin !== targetOrigin) {
        return;
      }

      const data = event.data;
      if (!data || data.type !== 'SSO_TOKEN_REQUEST') {
        return;
      }

      if (debug) {
        console.log('[SSO] 토큰 요청 수신, 토큰 전송 중...');
      }

      // 토큰 전송
      const success = sendTokensViaPostMessage(popup, tokens, targetOrigin, requestId);

      resolved = true;
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
      resolve(success);
    };

    // 6. 리스너 등록 및 타임아웃 설정
    window.addEventListener('message', handleMessage);

    timeoutId = setTimeout(() => {
      if (resolved) return;

      if (debug) {
        console.log('[SSO] 타임아웃 - 대상 서비스가 토큰 요청을 보내지 않음');
      }

      // 타임아웃 시 직접 토큰 전송 시도
      sendTokensViaPostMessage(popup, tokens, targetOrigin, requestId);

      resolved = true;
      window.removeEventListener('message', handleMessage);
      resolve(true); // 타임아웃이어도 토큰은 전송됨
    }, timeout);
  });
}

/**
 * 토큰 요청 메시지 전송 (수신 측에서 사용)
 *
 * @param targetWindow - Hub 윈도우 (opener)
 * @param hubOrigin - Hub origin
 */
export function requestTokensViaPostMessage(
  targetWindow: Window | null,
  hubOrigin: string,
): void {
  if (!targetWindow) {
    console.warn('[SSO] 대상 윈도우가 없습니다 (opener가 없음?)');
    return;
  }

  const message: SSOPostMessageData = {
    type: 'SSO_TOKEN_REQUEST',
    requestId: `req_${Date.now()}`,
  };

  try {
    targetWindow.postMessage(message, hubOrigin);
  } catch (error) {
    console.error('[SSO] 토큰 요청 전송 실패:', error);
  }
}
