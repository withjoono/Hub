/**
 * JWT 토큰 검증 유틸리티
 *
 * @description
 * - JWT 형식 검증 (header.payload.signature)
 * - 토큰 만료 확인
 * - 페이로드 추출
 */

import type { JWTPayload, TokenValidationResult } from './types';

/**
 * JWT 토큰 형식 검증
 * @param token - 검증할 토큰
 * @returns 유효한 JWT 형식인지 여부
 */
export function isValidJwtFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  // Base64URL 형식 검증
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => part.length > 0 && base64UrlRegex.test(part));
}

/**
 * JWT 페이로드 디코딩 (서명 검증 없음 - 클라이언트 사이드)
 * @param token - JWT 토큰
 * @returns 디코딩된 페이로드 또는 null
 */
export function decodeJwtPayload(token: string): JWTPayload | null {
  if (!isValidJwtFormat(token)) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    // Base64URL을 Base64로 변환
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // padding 추가
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    return decoded as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * JWT 토큰에서 만료 시간(exp) 추출
 * @param token - JWT 토큰
 * @returns 만료 시간 (Unix timestamp in seconds) 또는 null
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  if (typeof payload.exp === 'number' && payload.exp > 0) {
    return payload.exp;
  }

  return null;
}

/**
 * 토큰 만료 여부 확인
 * @param token - JWT 토큰
 * @param bufferSeconds - 만료 전 버퍼 시간 (기본: 60초)
 * @returns 만료되었으면 true
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const expiry = getTokenExpiry(token);
  if (expiry === null) {
    return true; // 만료 시간을 알 수 없으면 만료된 것으로 처리
  }

  const now = Math.floor(Date.now() / 1000);
  return expiry < now + bufferSeconds;
}

/**
 * 토큰 종합 검증
 * @param token - JWT 토큰
 * @returns 검증 결과
 */
export function validateToken(token: string): TokenValidationResult {
  // 1. 토큰 존재 확인
  if (!token) {
    return { isValid: false, error: 'TOKEN_EMPTY' };
  }

  // 2. 형식 검증
  if (!isValidJwtFormat(token)) {
    return { isValid: false, error: 'INVALID_FORMAT' };
  }

  // 3. 페이로드 디코딩
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { isValid: false, error: 'DECODE_FAILED' };
  }

  // 4. 만료 시간 확인
  const expiry = payload.exp;
  if (typeof expiry !== 'number') {
    return { isValid: false, error: 'NO_EXPIRY', payload };
  }

  // 5. 만료 여부 확인
  const now = Math.floor(Date.now() / 1000);
  if (expiry < now) {
    return { isValid: false, error: 'TOKEN_EXPIRED', payload, expiry };
  }

  return { isValid: true, payload, expiry };
}

/**
 * 토큰 남은 시간 (초)
 * @param token - JWT 토큰
 * @returns 남은 시간 (초) 또는 null (만료/유효하지 않음)
 */
export function getTokenRemainingTime(token: string): number | null {
  const expiry = getTokenExpiry(token);
  if (expiry === null) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = expiry - now;

  return remaining > 0 ? remaining : null;
}
