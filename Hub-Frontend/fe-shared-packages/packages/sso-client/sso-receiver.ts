/**
 * SSO 토큰 수신 처리
 *
 * @description
 * - URL 파라미터에서 토큰 추출 (레거시 지원)
 * - postMessage로 토큰 수신 (권장)
 * - 토큰 검증 및 저장
 */

import type { SSOConfig, SSOPostMessageData, SSOTokens } from './types';
import { isAllowedMessageOrigin } from './allowed-origins';
import { validateToken, getTokenExpiry } from './token-validator';

// 기본 URL 파라미터 이름
const DEFAULT_PARAM_ACCESS_TOKEN = 'sso_access_token';
const DEFAULT_PARAM_REFRESH_TOKEN = 'sso_refresh_token';

// 레거시 파라미터 이름 (OAuth 콜백용)
const LEGACY_PARAM_ACCESS_TOKEN = 'access_token';
const LEGACY_PARAM_REFRESH_TOKEN = 'refresh_token';
const LEGACY_PARAM_TOKEN_EXPIRY = 'token_expiry';

/**
 * URL에서 토큰 제거 (보안: 히스토리에 남지 않도록)
 */
function removeTokensFromUrl(paramNames: string[]): void {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let modified = false;

    paramNames.forEach(param => {
      if (urlParams.has(param)) {
        urlParams.delete(param);
        modified = true;
      }
    });

    if (modified) {
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  } catch (error) {
    console.error('[SSO] URL에서 토큰 제거 실패:', error);
  }
}

/**
 * URL 파라미터에서 SSO 토큰 추출 (레거시 방식)
 *
 * @param options - 옵션
 * @returns SSO 토큰 또는 null
 *
 * @description
 * ⚠️ 보안 경고: URL 파라미터의 토큰은 브라우저 히스토리, Referrer, 로그에 노출될 수 있음
 * 가능하면 postMessage 방식 사용 권장
 */
export function extractTokensFromUrl(options?: {
  removeFromUrl?: boolean;
  debug?: boolean;
}): SSOTokens | null {
  const { removeFromUrl = true, debug = false } = options ?? {};

  try {
    const urlParams = new URLSearchParams(window.location.search);

    // 1. 새로운 SSO 파라미터 확인
    let accessToken = urlParams.get(DEFAULT_PARAM_ACCESS_TOKEN);
    let refreshToken = urlParams.get(DEFAULT_PARAM_REFRESH_TOKEN);
    let paramsToRemove = [DEFAULT_PARAM_ACCESS_TOKEN, DEFAULT_PARAM_REFRESH_TOKEN];

    // 2. 레거시 파라미터 확인 (OAuth 콜백용)
    if (!accessToken || !refreshToken) {
      accessToken = urlParams.get(LEGACY_PARAM_ACCESS_TOKEN);
      refreshToken = urlParams.get(LEGACY_PARAM_REFRESH_TOKEN);
      paramsToRemove = [LEGACY_PARAM_ACCESS_TOKEN, LEGACY_PARAM_REFRESH_TOKEN, LEGACY_PARAM_TOKEN_EXPIRY];
    }

    // 토큰이 없으면 null 반환
    if (!accessToken || !refreshToken) {
      return null;
    }

    if (debug) {
      console.log('[SSO] URL에서 토큰 발견');
    }

    // 3. 보안: URL에서 토큰 즉시 제거
    if (removeFromUrl) {
      removeTokensFromUrl(paramsToRemove);
    }

    // 4. Access Token 검증
    const validation = validateToken(accessToken);
    if (!validation.isValid) {
      console.error(`[SSO] 토큰 검증 실패: ${validation.error}`);
      return null;
    }

    // 5. 만료 시간 추출
    const tokenExpiry = getTokenExpiry(accessToken) ?? undefined;

    return {
      accessToken,
      refreshToken,
      tokenExpiry,
    };
  } catch (error) {
    console.error('[SSO] URL 토큰 추출 실패:', error);
    return null;
  }
}

/**
 * postMessage 리스너 등록 (권장 방식)
 *
 * @param config - SSO 설정
 * @returns cleanup 함수
 *
 * @description
 * postMessage를 통해 토큰을 안전하게 수신
 * - origin 검증으로 보안 강화
 * - URL에 토큰 노출 없음
 */
export function setupPostMessageListener(config: SSOConfig): () => void {
  const { allowedOrigins, onTokensReceived, onLogout, debug } = config;

  const handleMessage = (event: MessageEvent<SSOPostMessageData>) => {
    // 1. Origin 검증 (중요!)
    if (!isAllowedMessageOrigin(event.origin, allowedOrigins)) {
      if (debug) {
        console.warn('[SSO] 허용되지 않은 origin:', event.origin);
      }
      return;
    }

    // 2. 데이터 형식 확인
    const data = event.data;
    if (!data || typeof data !== 'object' || !data.type) {
      return;
    }

    // 3. SSO 메시지 타입 처리
    switch (data.type) {
      case 'SSO_TOKEN':
      case 'SSO_TOKEN_RESPONSE':
        if (data.tokens) {
          // 토큰 검증
          const validation = validateToken(data.tokens.accessToken);
          if (!validation.isValid) {
            console.error(`[SSO] postMessage 토큰 검증 실패: ${validation.error}`);
            return;
          }

          if (debug) {
            console.log('[SSO] postMessage로 토큰 수신');
          }

          // 만료 시간 추가
          const tokens: SSOTokens = {
            ...data.tokens,
            tokenExpiry: data.tokens.tokenExpiry ?? validation.expiry,
          };

          onTokensReceived?.(tokens);
        } else if (data.error) {
          console.error('[SSO] 토큰 수신 에러:', data.error);
        }
        break;

      case 'SSO_LOGOUT':
        if (debug) {
          console.log('[SSO] 로그아웃 메시지 수신');
        }
        onLogout?.();
        break;

      case 'SSO_TOKEN_REQUEST':
        // 토큰 요청 메시지 (Hub에서 처리)
        // 이 라이브러리는 수신 측에서 사용하므로 무시
        break;

      default:
        // 알 수 없는 메시지 타입
        break;
    }
  };

  // 리스너 등록
  window.addEventListener('message', handleMessage);

  // cleanup 함수 반환
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * SSO 수신 처리 (URL + postMessage 통합)
 *
 * @param config - SSO 설정
 * @returns cleanup 함수 (postMessage 리스너 해제)
 *
 * @description
 * 1. URL 파라미터 확인 (레거시 지원)
 * 2. opener(Hub)에 토큰 요청 (postMessage)
 * 3. postMessage 리스너 등록 (권장)
 */
export function initSSOReceiver(config: SSOConfig): () => void {
  const { hubUrl, onTokensReceived, debug } = config;

  // 1. URL에서 토큰 확인 (레거시 지원)
  const urlTokens = extractTokensFromUrl({ removeFromUrl: true, debug });
  if (urlTokens) {
    onTokensReceived?.(urlTokens);
  } else {
    // 2. opener(Hub)가 있으면 토큰 요청
    requestTokensFromHub(hubUrl, debug);
  }

  // 3. postMessage 리스너 등록
  const cleanup = setupPostMessageListener(config);

  return cleanup;
}

/**
 * Hub(opener)에 토큰 요청 (독립 앱에서 사용)
 *
 * @param hubUrl - Hub URL
 * @param debug - 디버그 모드
 *
 * @description
 * Hub에서 새 창으로 열렸을 때, opener(Hub)에 토큰 요청 메시지 전송
 */
export function requestTokensFromHub(hubUrl: string, debug?: boolean): void {
  if (!window.opener) {
    if (debug) {
      console.log('[SSO] opener 없음 - Hub에서 직접 열리지 않음');
    }
    return;
  }

  if (debug) {
    console.log('[SSO] Hub에 토큰 요청 중...', hubUrl);
  }

  try {
    const hubOrigin = new URL(hubUrl).origin;
    const message: SSOPostMessageData = {
      type: 'SSO_TOKEN_REQUEST',
      requestId: `req_${Date.now()}`,
    };
    window.opener.postMessage(message, hubOrigin);
  } catch (error) {
    console.error('[SSO] 토큰 요청 실패:', error);
  }
}
