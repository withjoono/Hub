/**
 * 날짜 유틸리티 함수
 */

/**
 * 날짜를 지정된 형식으로 포맷팅
 */
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  switch (format) {
    case 'short':
      return `${year}-${month}-${day}`;
    case 'long':
      return `${year}년 ${month}월 ${day}일`;
    case 'full':
      return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * 상대적 시간 표시 (예: "3분 전", "2시간 전")
 */
export function getRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`;
  return `${Math.floor(diffDay / 365)}년 전`;
}

/**
 * 문자열을 Date 객체로 파싱
 */
export function parseDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * 두 날짜 사이의 일수 계산
 */
export function getDaysBetween(start: Date | string, end: Date | string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
