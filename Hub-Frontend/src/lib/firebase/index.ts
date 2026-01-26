/**
 * Firebase 모듈 진입점
 */
export { app, auth, googleProvider } from './config';
export {
  // 인증 상태
  onAuthStateChange,
  getCurrentUser,
  // 이메일/비밀번호 인증
  signInWithEmail,
  signUpWithEmail,
  // 소셜 로그인
  signInWithGoogle,
  // 로그아웃
  signOut,
  // 토큰 관리
  getFirebaseIdToken,
  getFirebaseIdTokenResult,
  // 비밀번호 관리
  sendPasswordReset,
  // 이메일 인증
  sendVerificationEmail,
  // 프로필 관리
  updateUserProfile,
} from './auth';

// React 훅 및 Provider
export { useFirebaseAuth } from './useFirebaseAuth';
export { FirebaseAuthProvider, useFirebaseAuthContext } from './FirebaseAuthProvider';
