/**
 * ESLint 설정 템플릿
 *
 * 사용법:
 * 1. 이 파일을 프로젝트 루트에 복사
 * 2. 필요에 따라 ignorePatterns 수정
 */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended', // Prettier 연동 (선택)
  ],
  ignorePatterns: [
    'dist',
    'build',
    '.eslintrc.cjs',
    'node_modules',
    '*.gen.ts', // 자동 생성 파일
    '_reference', // 참조 폴더
    'shared-packages', // 공유 패키지
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    // React Refresh
    'react-refresh/only-export-components': 'off',

    // TypeScript
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',

    // 일반
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
