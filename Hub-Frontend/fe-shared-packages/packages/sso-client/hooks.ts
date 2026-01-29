/**
 * SSO React Hooks
 *
 * @description
 * React 컴포넌트에서 SSO 기능을 쉽게 사용하기 위한 훅
 */

import { useEffect, useCallback, useRef } from 'react';
import type { SSOConfig, SSOTokens } from './types';
import { initSSOReceiver, extractTokensFromUrl } from './sso-receiver';
import { initiatePostMessageSSO, generateSSOUrl } from './sso-sender';
import { validateToken, isTokenExpired } from './token-validator';

/**
 * SSO 토큰 수신 훅
 *
 * @param config - SSO 설정
 *
 * @description
 * 컴포넌트 마운트 시 자동으로:
 * 1. URL 파라미터에서 토큰 확인
 * 2. postMessage 리스너 등록
 *
 * @example
 * ```tsx
 * function App() {
 *   useSSOReceiver({
 *     hubUrl: 'https://geobukschool.kr',
 *     allowedOrigins: ['https://geobukschool.kr'],
 *     onTokensReceived: (tokens) => {
 *       setTokens(tokens.accessToken, tokens.refreshToken);
 *     },
 *     onLogout: () => {
 *       clearTokens();
 *       navigate('/login');
 *     },
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useSSOReceiver(config: SSOConfig): void {
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const cleanup = initSSOReceiver(configRef.current);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.hubUrl, JSON.stringify(config.allowedOrigins)]);
}

/**
 * SSO 토큰 전송 훅
 *
 * @returns SSO 전송 유틸리티
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { navigateWithSSO, openWithSSO } = useSSOSender();
 *   const tokens = useTokens();
 *
 *   const handleNavigate = async () => {
 *     await openWithSSO('https://susi.geobukschool.kr', tokens);
 *   };
 *
 *   return <button onClick={handleNavigate}>수시 서비스</button>;
 * }
 * ```
 */
export function useSSOSender() {
  /**
   * postMessage로 새 창 열고 토큰 전달
   */
  const openWithSSO = useCallback(async (
    targetUrl: string,
    tokens: SSOTokens,
    options?: { timeout?: number; debug?: boolean },
  ): Promise<boolean> => {
    return initiatePostMessageSSO(targetUrl, tokens, options);
  }, []);

  /**
   * URL 파라미터로 리다이렉트 (레거시)
   */
  const navigateWithSSO = useCallback((
    targetUrl: string,
    tokens: SSOTokens,
  ): void => {
    const ssoUrl = generateSSOUrl(targetUrl, tokens);
    window.location.href = ssoUrl;
  }, []);

  /**
   * SSO URL 생성 (리다이렉트 없이)
   */
  const createSSOUrl = useCallback((
    targetUrl: string,
    tokens: SSOTokens,
  ): string => {
    return generateSSOUrl(targetUrl, tokens);
  }, []);

  return {
    openWithSSO,
    navigateWithSSO,
    createSSOUrl,
  };
}

/**
 * SSO 토큰 초기화 훅 (앱 시작 시 1회 실행)
 *
 * @param onTokensFound - 토큰 발견 시 콜백
 *
 * @description
 * 앱 초기화 시 URL에서 SSO 토큰을 확인하고 처리
 * postMessage 리스너는 등록하지 않음 (URL 확인만)
 *
 * @example
 * ```tsx
 * function App() {
 *   const [isReady, setIsReady] = useState(false);
 *
 *   useSSOInit((tokens) => {
 *     setTokens(tokens.accessToken, tokens.refreshToken);
 *     toast.success('자동 로그인 되었습니다');
 *   });
 *
 *   // ...
 * }
 * ```
 */
export function useSSOInit(
  onTokensFound: (tokens: SSOTokens) => void,
  options?: { debug?: boolean },
): void {
  const hasRun = useRef(false);
  const callbackRef = useRef(onTokensFound);
  callbackRef.current = onTokensFound;
  const debug = options?.debug;

  useEffect(() => {
    // StrictMode에서 중복 실행 방지
    if (hasRun.current) return;
    hasRun.current = true;

    const tokens = extractTokensFromUrl({
      removeFromUrl: true,
      debug,
    });

    if (tokens) {
      callbackRef.current(tokens);
    }
  }, [debug]);
}

/**
 * 토큰 상태 확인 훅
 *
 * @param accessToken - Access Token
 * @returns 토큰 상태 정보
 */
export function useTokenStatus(accessToken: string | null) {
  if (!accessToken) {
    return {
      isValid: false,
      isExpired: true,
      expiresIn: null,
      error: 'NO_TOKEN',
    };
  }

  const validation = validateToken(accessToken);

  return {
    isValid: validation.isValid,
    isExpired: validation.isValid ? isTokenExpired(accessToken) : true,
    expiresIn: validation.expiry
      ? validation.expiry - Math.floor(Date.now() / 1000)
      : null,
    error: validation.error ?? null,
  };
}
