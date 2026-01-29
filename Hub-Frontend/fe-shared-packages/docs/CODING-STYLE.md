# 코딩 스타일 가이드

> 거북스쿨 프론트엔드 프로젝트 코딩 스타일 가이드

---

## 명명 규칙 (Naming Conventions)

### 변수/함수

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 | camelCase | `memberScore`, `isLoading` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_TIMEOUT` |
| 함수 | camelCase | `calculateScore()`, `getMemberById()` |
| 불리언 | is/has/can 접두사 | `isActive`, `hasPermission`, `canEdit` |

### 타입/인터페이스

| 대상 | 규칙 | 예시 |
|------|------|------|
| 인터페이스 | PascalCase | `User`, `ScoreResult` |
| 타입 | PascalCase | `UserRole`, `AdmissionType` |
| Enum | PascalCase | `UserRole.ADMIN` |
| Generic | 단일 대문자 | `<T>`, `<K, V>` |

### 컴포넌트/파일

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `ScoreCard`, `UserProfile` |
| 컴포넌트 파일 | PascalCase.tsx | `ScoreCard.tsx` |
| 훅 파일 | kebab-case | `use-debounce.ts` |
| 유틸 파일 | kebab-case | `format-date.ts` |
| 디렉토리 | kebab-case | `mock-exam/`, `school-record/` |

---

## 컴포넌트 작성 규칙

### 파일 구조

```typescript
// 1. Import 순서
// 1-1. React
import { useState, useEffect } from 'react';

// 1-2. 외부 라이브러리
import { useQuery } from '@tanstack/react-query';

// 1-3. 내부 모듈 (@/ 별칭)
import { Button } from '@/components/ui/button';

// 1-4. 상대 경로
import { ScoreItem } from './ScoreItem';

// 2. 타입 정의
interface Props {
  userId: number;
  onComplete?: () => void;
}

// 3. 컴포넌트
export function UserScore({ userId, onComplete }: Props) {
  // 3-1. 상태
  const [isLoading, setIsLoading] = useState(false);

  // 3-2. 외부 훅
  const { data } = useQuery({ ... });

  // 3-3. 파생 상태 (useMemo)
  const total = useMemo(() => ..., [data]);

  // 3-4. 이벤트 핸들러 (useCallback)
  const handleClick = useCallback(() => { ... }, []);

  // 3-5. 사이드 이펙트 (useEffect)
  useEffect(() => { ... }, []);

  // 3-6. 렌더링
  return ( ... );
}
```

### Props 규칙

```typescript
// ✅ 좋은 예시
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// ❌ 나쁜 예시
interface ButtonProps {
  v?: string; // 의미 불명확
  click?: any; // any 사용
}
```

---

## TypeScript 규칙

### 타입 정의

```typescript
// ✅ 인터페이스 사용 (객체 타입)
interface User {
  id: number;
  name: string;
  email: string;
}

// ✅ 타입 사용 (유니온, 교차 등)
type UserRole = 'admin' | 'user' | 'guest';
type UserWithRole = User & { role: UserRole };

// ❌ any 사용 지양
const data: any = response; // 피하기
const data: unknown = response; // 권장
```

### Null 처리

```typescript
// ✅ Optional chaining
const name = user?.profile?.name;

// ✅ Nullish coalescing
const displayName = name ?? '이름 없음';

// ❌ 논리 OR (빈 문자열, 0 문제)
const displayName = name || '이름 없음';
```

---

## API 연동 규칙

### API 호출 구조

```typescript
// stores/server/features/[feature]/
├── apis.ts        // API 함수 정의
├── interfaces.ts  // 타입 정의
├── queries.ts     // useQuery 훅
└── mutations.ts   // useMutation 훅
```

### API 함수

```typescript
// apis.ts
import { authClient } from '@/lib/api';

export const userApi = {
  getUser: (id: number) =>
    authClient.get<User>(`/users/${id}`),

  updateUser: (id: number, data: UpdateUserDto) =>
    authClient.patch<User>(`/users/${id}`, data),
};
```

### Query 훅

```typescript
// queries.ts
import { useQuery } from '@tanstack/react-query';
import { userApi } from './apis';

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id),
    staleTime: 1000 * 60 * 5, // 5분
  });
};
```

---

## 스타일링 규칙

### Tailwind CSS

```tsx
// ✅ 좋은 예시
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  <h1 className="text-lg font-bold text-gray-900">제목</h1>
</div>

// ❌ 인라인 스타일 지양
<div style={{ display: 'flex', padding: '16px' }}>
```

### 조건부 클래스

```tsx
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded',
    isActive ? 'bg-blue-500 text-white' : 'bg-gray-100',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
```

---

## 주석 규칙

```typescript
/**
 * 복잡한 비즈니스 로직 설명
 *
 * @param userId - 사용자 ID
 * @returns 점수 계산 결과
 */
function calculateScore(userId: number): ScoreResult {
  // 단일 라인: 복잡한 로직 설명
  const rawScore = getRawScore(userId);

  /*
   * 여러 줄 주석:
   * - 특별한 계산 로직
   * - 예외 상황 처리
   */
  return processScore(rawScore);
}
```

---

## 금지 사항

1. **any 타입 사용 금지** (unknown 사용)
2. **인라인 스타일 금지** (Tailwind 사용)
3. **console.log 커밋 금지** (console.warn/error는 허용)
4. **하드코딩 금지** (상수로 분리)
5. **주석 처리된 코드 커밋 금지**
