# 새 프론트엔드 프로젝트 설정 가이드

> 거북스쿨 프론트엔드 프로젝트 초기 설정 단계별 가이드

---

## 목차

1. [프로젝트 생성](#1-프로젝트-생성)
2. [기본 의존성 설치](#2-기본-의존성-설치)
3. [설정 파일 복사](#3-설정-파일-복사)
4. [폴더 구조 설정](#4-폴더-구조-설정)
5. [공유 패키지 연결](#5-공유-패키지-연결)
6. [Git 설정](#6-git-설정)
7. [체크리스트](#7-체크리스트)

---

## 1. 프로젝트 생성

### Vite + React + TypeScript

```bash
# 프로젝트 생성
npm create vite@latest [project-name] -- --template react-ts

# 프로젝트 폴더로 이동
cd [project-name]

# 의존성 설치
npm install
```

---

## 2. 기본 의존성 설치

### 핵심 의존성

```bash
# 라우팅
npm install @tanstack/react-router

# 상태 관리
npm install zustand @tanstack/react-query

# HTTP 클라이언트
npm install axios humps
npm install -D @types/humps

# 폼 & 검증
npm install react-hook-form @hookform/resolvers zod

# UI
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install lucide-react
```

### 개발 의존성

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# ESLint & Prettier
npm install -D eslint prettier eslint-plugin-react-hooks eslint-plugin-react-refresh
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-config-prettier eslint-plugin-prettier

# Commitlint & Husky
npm install -D @commitlint/cli @commitlint/config-conventional husky lint-staged
```

---

## 3. 설정 파일 복사

공유 패키지에서 설정 파일을 복사합니다.

```bash
# 프로젝트 루트에서 실행
SHARED_PATH="../fe-shared-packages/config-templates"

# ESLint
cp $SHARED_PATH/eslint/.eslintrc.cjs ./
cp $SHARED_PATH/eslint/.eslintignore ./

# Prettier
cp $SHARED_PATH/prettier/.prettierrc ./
cp $SHARED_PATH/prettier/.prettierignore ./

# TypeScript
cp $SHARED_PATH/typescript/tsconfig.json ./
cp $SHARED_PATH/typescript/tsconfig.node.json ./

# Tailwind
cp $SHARED_PATH/tailwind/tailwind.config.js ./
cp $SHARED_PATH/tailwind/postcss.config.js ./

# Vite
cp $SHARED_PATH/vite/vite.config.ts ./

# Commitlint
cp $SHARED_PATH/commitlint.config.js ./
```

### Windows PowerShell

```powershell
$SHARED_PATH = "..\fe-shared-packages\config-templates"

Copy-Item "$SHARED_PATH\eslint\.eslintrc.cjs" .
Copy-Item "$SHARED_PATH\prettier\.prettierrc" .
Copy-Item "$SHARED_PATH\typescript\tsconfig.json" .
Copy-Item "$SHARED_PATH\tailwind\tailwind.config.js" .
Copy-Item "$SHARED_PATH\vite\vite.config.ts" .
```

---

## 4. 폴더 구조 설정

### 기본 폴더 구조 생성

```bash
mkdir -p src/{components/{ui,custom,services},hooks,lib/{api,utils,validations,config,errors},routes,stores/{atoms,client,server/features},types}
```

### 최종 폴더 구조

```
src/
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── custom/             # 커스텀 공통 컴포넌트
│   └── services/           # 도메인별 컴포넌트
│       └── [feature]/
│
├── hooks/                  # 커스텀 훅
│
├── lib/
│   ├── api/                # API 클라이언트
│   │   ├── index.ts
│   │   ├── instances.ts
│   │   ├── token-manager.ts
│   │   └── interceptors/
│   ├── config/             # 환경 설정
│   │   └── env.ts
│   ├── errors/             # 에러 처리
│   │   ├── error-codes.ts
│   │   └── error-handler.ts
│   ├── utils/              # 유틸리티
│   └── validations/        # Zod 스키마
│
├── routes/                 # TanStack Router 라우트
│
├── stores/
│   ├── atoms/              # Zustand 전역 상태
│   ├── client/             # UI 상태
│   └── server/             # TanStack Query
│       └── features/
│           └── [feature]/
│               ├── apis.ts
│               ├── interfaces.ts
│               ├── mutations.ts
│               └── queries.ts
│
└── types/                  # 타입 정의
```

---

## 5. 공유 패키지 연결

### tsconfig.json paths 설정

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./fe-shared-packages/packages/*"]
    }
  }
}
```

### vite.config.ts alias 설정

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './fe-shared-packages/packages'),
    },
  },
});
```

### 사용 예시

```typescript
// 공유 타입 import
import type { University, User } from '@shared/types';

// 공유 유틸 import
import { formatDate, formatNumber } from '@shared/utils';

// 공유 훅 import
import { useDebounce } from '@shared/hooks';

// 공유 상수 import
import { SUBJECT_CODES } from '@shared/constants';
```

---

## 6. Git 설정

### Husky 초기화

```bash
npx husky install
npm pkg set scripts.prepare="husky install"

# commit-msg 훅
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# pre-commit 훅
npx husky add .husky/pre-commit 'npx lint-staged'
```

### lint-staged 설정 (package.json)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### .gitignore 기본 설정

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Misc
*.local
```

---

## 7. 체크리스트

### 프로젝트 생성 체크리스트

- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] 기본 의존성 설치
- [ ] 개발 의존성 설치

### 설정 체크리스트

- [ ] ESLint 설정 복사 및 적용
- [ ] Prettier 설정 복사 및 적용
- [ ] TypeScript 설정 복사 및 적용
- [ ] Tailwind CSS 설정 복사 및 적용
- [ ] Vite 설정 복사 및 적용
- [ ] Commitlint 설정 복사 및 적용

### 폴더 구조 체크리스트

- [ ] src/components 폴더 구조 생성
- [ ] src/lib 폴더 구조 생성
- [ ] src/stores 폴더 구조 생성
- [ ] src/routes 폴더 생성

### Git 체크리스트

- [ ] Husky 초기화
- [ ] commit-msg 훅 설정
- [ ] pre-commit 훅 설정
- [ ] lint-staged 설정
- [ ] .gitignore 설정

### 공유 패키지 체크리스트

- [ ] tsconfig.json paths 설정
- [ ] vite.config.ts alias 설정
- [ ] 공유 패키지 import 테스트

---

## 스크립트 설정 (package.json)

```json
{
  "scripts": {
    "dev": "vite --port 3000 --host",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0 --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

---

## 문제 해결

### ESLint 오류

```bash
# ESLint 캐시 삭제
rm -rf node_modules/.cache/eslint

# 재설치
npm install
```

### TypeScript 경로 인식 오류

```bash
# VS Code에서 TypeScript 버전 선택
# Ctrl+Shift+P → "TypeScript: Select TypeScript Version" → "Use Workspace Version"
```

### Tailwind CSS 미적용

```bash
# PostCSS 플러그인 확인
npm install -D postcss autoprefixer

# tailwind.config.js content 경로 확인
```

---

## 관련 문서

- `fe-README.md` - 공유 패키지 개요
- `docs/CODING-STYLE.md` - 코딩 스타일 가이드
- `docs/COMPONENT-GUIDE.md` - 컴포넌트 작성 가이드
