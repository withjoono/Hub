/**
 * 배열 유틸리티 함수
 */

/**
 * 배열을 특정 키로 그룹화
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * 배열을 특정 키로 정렬
 */
export function sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * 배열에서 중복 제거
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * 배열에서 특정 키로 중복 제거
 */
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/**
 * 배열을 청크로 분할
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * 두 배열의 교집합
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter((item) => set.has(item));
}

/**
 * 두 배열의 차집합
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter((item) => !set.has(item));
}
