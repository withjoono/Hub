/**
 * 공유 타입 정의
 *
 * @example
 * import type { University, User, ApiResponse } from '@shared/types';
 */

// ==================== API 응답 타입 ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==================== 사용자 타입 ====================

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_OFFICER' | 'ROLE_MENTOR';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ==================== 대학 타입 ====================

export interface University {
  id: number;
  name: string;
  shortName?: string;
  region?: string;
  type?: UniversityType;
}

export type UniversityType = 'NATIONAL' | 'PUBLIC' | 'PRIVATE';

export interface Admission {
  id: number;
  universityId: number;
  name: string;
  type: AdmissionType;
  year: number;
}

export type AdmissionType =
  | 'EARLY_COMPREHENSIVE' // 수시 학종
  | 'EARLY_SUBJECT' // 수시 교과
  | 'EARLY_ESSAY' // 수시 논술
  | 'REGULAR'; // 정시

export interface RecruitmentUnit {
  id: number;
  admissionId: number;
  name: string;
  department: string;
  quota: number;
}

// ==================== 점수 타입 ====================

export interface Score {
  korean: number;
  math: number;
  english: number;
  inquiry1: number;
  inquiry2: number;
  history?: number;
  foreign?: number;
}

export interface ConvertedScore extends Score {
  total: number;
  average: number;
  percentile?: number;
}

// ==================== 공통 타입 ====================

export type Status = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
