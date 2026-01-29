/**
 * 입시 관련 상수
 */

// 전형 유형
export const ADMISSION_TYPES = {
  EARLY_COMPREHENSIVE: '학생부종합',
  EARLY_SUBJECT: '학생부교과',
  EARLY_ESSAY: '논술',
  REGULAR: '정시',
} as const;

export type AdmissionTypeKey = keyof typeof ADMISSION_TYPES;
export type AdmissionTypeValue = (typeof ADMISSION_TYPES)[AdmissionTypeKey];

// 평가 유형
export const EVALUATION_TYPES = {
  DOCUMENT: '서류평가',
  INTERVIEW: '면접',
  APTITUDE: '적성고사',
  ESSAY: '논술',
} as const;

// 대학 유형
export const UNIVERSITY_TYPES = {
  NATIONAL: '국립',
  PUBLIC: '공립',
  PRIVATE: '사립',
} as const;

// 지역
export const REGIONS = {
  SEOUL: '서울',
  GYEONGGI: '경기',
  INCHEON: '인천',
  GANGWON: '강원',
  CHUNGBUK: '충북',
  CHUNGNAM: '충남',
  DAEJEON: '대전',
  SEJONG: '세종',
  JEONBUK: '전북',
  JEONNAM: '전남',
  GWANGJU: '광주',
  GYEONGBUK: '경북',
  GYEONGNAM: '경남',
  DAEGU: '대구',
  ULSAN: '울산',
  BUSAN: '부산',
  JEJU: '제주',
} as const;

// 입시 연도
export const ADMISSION_YEARS = [2024, 2025, 2026, 2027] as const;

// 모집 시기
export const RECRUITMENT_PERIODS = {
  EARLY: '수시',
  REGULAR: '정시',
  ADDITIONAL: '추가',
} as const;
