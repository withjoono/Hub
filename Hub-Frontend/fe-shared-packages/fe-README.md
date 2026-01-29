# 프론트엔드 공유 패키지 (Frontend Shared Packages)

> 거북스쿨 프론트엔드 프로젝트 간 공유되는 설정, 타입, 유틸리티, 컴포넌트 패키지

---

## 개요

이 패키지는 거북스쿨의 여러 프론트엔드 프로젝트에서 공통으로 사용되는 코드와 설정을 관리합니다.

### 주요 목적

1. **일관성 유지**: 모든 프로젝트에서 동일한 코딩 스타일과 설정 사용
2. **코드 재사용**: 공통 타입, 유틸리티, 컴포넌트 공유
3. **유지보수 효율**: 한 곳에서 수정하면 모든 프로젝트에 적용
4. **빠른 프로젝트 시작**: 새 프로젝트 설정 시간 단축

---

## 폴더 구조

```
fe-shared-packages/
├── fe-README.md              # 이 문서
├── fe-SETUP-PROJECT.md       # 새 프로젝트 설정 가이드
├── package.json              # 패키지 설정
├── tsconfig.base.json        # TypeScript 기본 설정
├── .gitignore
│
├── config-templates/         # 설정 파일 템플릿
│   ├── eslint/               # ESLint 설정
│   ├── prettier/             # Prettier 설정
│   ├── typescript/           # TypeScript 설정
│   ├── tailwind/             # Tailwind CSS 설정
│   └── vite/                 # Vite 설정
│
├── docs/                     # 문서
│   ├── CODING-STYLE.md       # 코딩 스타일 가이드
│   ├── COMPONENT-GUIDE.md    # 컴포넌트 작성 가이드
│   └── API-PATTERNS.md       # API 연동 패턴
│
└── packages/                 # 공유 패키지
    ├── types/                # 공유 타입 정의
    ├── utils/                # 공유 유틸리티 함수
    ├── ui/                   # 공유 UI 컴포넌트
    ├── hooks/                # 공유 React 훅
    └── constants/            # 공유 상수
```

---

## 빠른 시작

### 1. 기존 프로젝트에서 사용

```bash
# 설정 파일 복사
cp fe-shared-packages/config-templates/eslint/.eslintrc.js ./
cp fe-shared-packages/config-templates/prettier/.prettierrc ./
cp fe-shared-packages/config-templates/typescript/tsconfig.json ./

# 공유 패키지 import
import { formatDate, formatNumber } from '@shared/utils';
import { Button, Card } from '@shared/ui';
import { useDebounce } from '@shared/hooks';
import type { University, Admission } from '@shared/types';
```

### 2. 새 프로젝트 시작

`fe-SETUP-PROJECT.md` 문서를 참조하세요.

---

## 패키지 상세

### config-templates/

프로젝트 설정 파일 템플릿입니다.

| 폴더 | 설명 | 주요 파일 |
|------|------|----------|
| `eslint/` | ESLint 설정 | `.eslintrc.js`, `.eslintignore` |
| `prettier/` | Prettier 설정 | `.prettierrc`, `.prettierignore` |
| `typescript/` | TypeScript 설정 | `tsconfig.json`, `tsconfig.node.json` |
| `tailwind/` | Tailwind CSS 설정 | `tailwind.config.js`, `postcss.config.js` |
| `vite/` | Vite 설정 | `vite.config.ts` |

### packages/types/

공유 TypeScript 타입 정의입니다.

```typescript
// 대학 관련 타입
export interface University { ... }
export interface Admission { ... }
export interface RecruitmentUnit { ... }

// 사용자 관련 타입
export interface User { ... }
export interface AuthToken { ... }

// API 응답 타입
export interface ApiResponse<T> { ... }
export interface PaginatedResponse<T> { ... }
```

### packages/utils/

공유 유틸리티 함수입니다.

```typescript
// 날짜 유틸
export { formatDate, parseDate, getRelativeTime } from './date';

// 숫자 유틸
export { formatNumber, formatPercent, formatScore } from './number';

// 문자열 유틸
export { truncate, capitalize, slugify } from './string';

// 배열 유틸
export { groupBy, sortBy, unique } from './array';
```

### packages/ui/

공유 UI 컴포넌트입니다. shadcn/ui 기반으로 확장됩니다.

```typescript
// 기본 컴포넌트
export { Button, Input, Select, Checkbox } from './basic';

// 레이아웃 컴포넌트
export { Card, Container, Grid, Stack } from './layout';

// 피드백 컴포넌트
export { Alert, Toast, Modal, Spinner } from './feedback';

// 데이터 표시 컴포넌트
export { DataTable, Badge, Avatar } from './data-display';
```

### packages/hooks/

공유 React 커스텀 훅입니다.

```typescript
// 상태 관련 훅
export { useDebounce, useThrottle, useLocalStorage } from './state';

// UI 관련 훅
export { useMediaQuery, useClickOutside, useScrollLock } from './ui';

// 데이터 관련 훅
export { usePagination, useInfiniteScroll } from './data';
```

### packages/constants/

공유 상수입니다.

```typescript
// 입시 관련 상수
export { ADMISSION_TYPES, EVALUATION_TYPES } from './admission';

// 과목 코드
export { SUBJECT_CODES, MOCK_EXAM_SUBJECTS } from './subjects';

// API 엔드포인트
export { API_ENDPOINTS } from './api';

// 에러 코드
export { ERROR_CODES } from './errors';
```

---

## 사용 규칙

### 1. 수정 시 주의사항

공유 패키지 수정 시 **모든 프로젝트에 영향**을 미칩니다.

```bash
# 수정 전 영향 범위 확인
# 커밋 메시지에 영향 범위 명시
git commit -m "feat(shared): Button 컴포넌트 수정 [affects: gb-front, admin-front]"
```

### 2. 버전 관리

```json
// package.json
{
  "version": "1.0.0",
  "changeLog": [
    { "version": "1.0.0", "date": "2025-12-17", "changes": ["초기 설정"] }
  ]
}
```

### 3. Breaking Change

호환성이 깨지는 변경 시:

1. 버전 메이저 업데이트 (1.0.0 → 2.0.0)
2. `BREAKING CHANGE` 커밋 메시지
3. 마이그레이션 가이드 작성

---

## 프로젝트 목록

이 공유 패키지를 사용하는 프로젝트:

| 프로젝트 | 설명 | 사용 패키지 |
|---------|------|------------|
| Hub-Frontend | 메인 프론트엔드 | types, utils, ui, hooks, constants |
| Admin-Front | 관리자 프론트엔드 | types, utils, ui |
| Mobile-App | 모바일 앱 (예정) | types, utils |

---

## 관련 문서

- `fe-SETUP-PROJECT.md` - 새 프로젝트 설정 가이드
- `docs/CODING-STYLE.md` - 코딩 스타일 가이드
- `docs/COMPONENT-GUIDE.md` - 컴포넌트 작성 가이드
- `docs/API-PATTERNS.md` - API 연동 패턴

---

## 기여 방법

1. 공유할 코드가 2개 이상의 프로젝트에서 사용되는지 확인
2. 기존 패키지와 중복되지 않는지 확인
3. 테스트 코드 작성
4. PR 생성 및 리뷰 요청
