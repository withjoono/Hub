/**
 * 숫자 유틸리티 함수
 */

/**
 * 숫자를 천단위 콤마로 포맷팅
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('ko-KR');
}

/**
 * 백분율 포맷팅
 */
export function formatPercent(num: number, decimals: number = 1): string {
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * 점수 포맷팅 (소수점 지정)
 */
export function formatScore(num: number, decimals: number = 2): string {
  if (isNaN(num)) return '-';
  return num.toFixed(decimals);
}

/**
 * 금액 포맷팅
 */
export function formatCurrency(num: number): string {
  if (isNaN(num)) return '0원';
  return `${formatNumber(num)}원`;
}

/**
 * 범위 내로 값 제한
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * 두 숫자 사이의 랜덤 값
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
