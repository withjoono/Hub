/**
 * Commitlint 설정 템플릿
 *
 * 설치:
 * npm install -D @commitlint/cli @commitlint/config-conventional husky
 *
 * Husky 설정:
 * npx husky install
 * npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type 규칙
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새로운 기능
        'fix', // 버그 수정
        'docs', // 문서 수정
        'style', // 코드 포맷팅
        'refactor', // 리팩토링
        'test', // 테스트
        'chore', // 빌드, 설정
        'perf', // 성능 개선
        'revert', // 되돌리기
        'ci', // CI/CD
        'build', // 빌드 시스템
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scope 규칙 (프로젝트에 맞게 수정)
    'scope-enum': [
      1, // warning
      'always',
      [
        // 기능별 scope 추가
        'shared', // 공용
        'ui', // UI 컴포넌트
        'api', // API 레이어
        'auth', // 인증
        'config', // 설정
        'deps', // 의존성
        'release', // 릴리즈
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],

    // Subject 규칙
    'subject-case': [0], // 한글 허용
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],

    // Header 규칙
    'header-max-length': [2, 'always', 100],

    // Body 규칙
    'body-max-line-length': [1, 'always', 100],

    // Footer 규칙
    'footer-max-line-length': [1, 'always', 100],
  },
};
