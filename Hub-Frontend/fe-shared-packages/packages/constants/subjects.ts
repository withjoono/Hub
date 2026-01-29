/**
 * 과목 관련 상수
 */

// 수능 영역
export const CSAT_AREAS = {
  KOREAN: '국어',
  MATH: '수학',
  ENGLISH: '영어',
  KOREAN_HISTORY: '한국사',
  INQUIRY: '탐구',
  FOREIGN: '제2외국어/한문',
} as const;

// 수학 선택과목
export const MATH_SUBJECTS = {
  CALCULUS: '미적분',
  GEOMETRY: '기하',
  PROBABILITY: '확률과 통계',
} as const;

// 탐구 영역
export const INQUIRY_AREAS = {
  SOCIAL: '사회탐구',
  SCIENCE: '과학탐구',
  VOCATIONAL: '직업탐구',
} as const;

// 사회탐구 과목
export const SOCIAL_SUBJECTS = {
  LIFE_ETHICS: '생활과 윤리',
  ETHICS_THOUGHT: '윤리와 사상',
  KOREAN_GEOGRAPHY: '한국지리',
  WORLD_GEOGRAPHY: '세계지리',
  EAST_ASIAN_HISTORY: '동아시아사',
  WORLD_HISTORY: '세계사',
  ECONOMY: '경제',
  POLITICS_LAW: '정치와 법',
  SOCIETY_CULTURE: '사회·문화',
} as const;

// 과학탐구 과목
export const SCIENCE_SUBJECTS = {
  PHYSICS1: '물리학Ⅰ',
  PHYSICS2: '물리학Ⅱ',
  CHEMISTRY1: '화학Ⅰ',
  CHEMISTRY2: '화학Ⅱ',
  BIOLOGY1: '생명과학Ⅰ',
  BIOLOGY2: '생명과학Ⅱ',
  EARTH_SCIENCE1: '지구과학Ⅰ',
  EARTH_SCIENCE2: '지구과학Ⅱ',
} as const;

// 제2외국어/한문
export const FOREIGN_SUBJECTS = {
  GERMAN: '독일어Ⅰ',
  FRENCH: '프랑스어Ⅰ',
  SPANISH: '스페인어Ⅰ',
  CHINESE: '중국어Ⅰ',
  JAPANESE: '일본어Ⅰ',
  RUSSIAN: '러시아어Ⅰ',
  ARABIC: '아랍어Ⅰ',
  VIETNAMESE: '베트남어Ⅰ',
  CHINESE_CLASSICS: '한문Ⅰ',
} as const;

// 모의고사 과목 코드
export const MOCK_EXAM_SUBJECT_CODES = {
  KOREAN: '01',
  MATH: '02',
  ENGLISH: '03',
  KOREAN_HISTORY: '04',
  // ... 추가 과목 코드
} as const;
