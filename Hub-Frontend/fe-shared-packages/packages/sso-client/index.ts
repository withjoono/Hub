/**
 * 공유 SSO 클라이언트 라이브러리
 *
 * @description
 * Hub SSO 시스템을 위한 클라이언트 라이브러리
 * - JWT 토큰 검증
 * - SSO 토큰 송수신 (URL 파라미터 / postMessage)
 * - Origin 검증 (보안)
 * - React Hooks
 *
 * @example
 * ```ts
 * // 토큰 검증
 * import { validateToken, isTokenExpired } from '@shared/sso-client';
 *
 * // SSO 수신 (외부 서비스에서)
 * import { useSSOReceiver, useSSOInit } from '@shared/sso-client';
 *
 * // SSO 전송 (Hub에서)
 * import { useSSOSender, generateSSOUrl } from '@shared/sso-client';
 *
 * // Origin 검증
 * import { isAllowedOrigin } from '@shared/sso-client';
 * ```
 */

// Types
export type {
  SSOTokens,
  SSOConfig,
  SSOServiceConfig,
  SSOPostMessageData,
  JWTPayload,
  TokenValidationResult,
} from './types';

// Token Validation
export {
  isValidJwtFormat,
  decodeJwtPayload,
  getTokenExpiry,
  isTokenExpired,
  validateToken,
  getTokenRemainingTime,
} from './token-validator';

// Origin Validation
export {
  isAllowedOrigin,
  isSameOrigin,
  extractOrigin,
  isAllowedMessageOrigin,
  DEFAULT_ALLOWED_DOMAINS,
  DEFAULT_ALLOWED_PATTERNS,
} from './allowed-origins';

// SSO Receiver (토큰 수신)
export {
  extractTokensFromUrl,
  setupPostMessageListener,
  initSSOReceiver,
  requestTokensFromHub,
} from './sso-receiver';

// SSO Sender (토큰 전송)
export {
  sendTokensViaPostMessage,
  broadcastLogout,
  generateSSOUrl,
  initiatePostMessageSSO,
  requestTokensViaPostMessage,
} from './sso-sender';

// React Hooks
export {
  useSSOReceiver,
  useSSOSender,
  useSSOInit,
  useTokenStatus,
} from './hooks';
