/**
 * Firebase Auth 서비스
 *
 * Firebase Authentication을 사용한 인증 기능 제공
 * - 이메일/비밀번호 로그인
 * - Google 소셜 로그인
 * - 인증 상태 관리
 * - 토큰 관리
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  getIdToken,
  getIdTokenResult,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

// ============================================
// 인증 상태 리스너
// ============================================

/**
 * 인증 상태 변경 리스너 등록
 * @param callback 인증 상태 변경 시 호출될 콜백
 * @returns 리스너 해제 함수
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * 현재 인증된 사용자 가져오기
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// ============================================
// 이메일/비밀번호 인증
// ============================================

/**
 * 이메일/비밀번호로 로그인
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * 이메일/비밀번호로 회원가입
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // 사용자 프로필 업데이트 (displayName)
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }

  return userCredential;
};

// ============================================
// 소셜 로그인
// ============================================

/**
 * Google 로그인
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

// ============================================
// 로그아웃
// ============================================

/**
 * 로그아웃
 */
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// ============================================
// 토큰 관리
// ============================================

/**
 * Firebase ID 토큰 가져오기
 * @param forceRefresh 강제 갱신 여부
 */
export const getFirebaseIdToken = async (forceRefresh = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  return getIdToken(user, forceRefresh);
};

/**
 * Firebase ID 토큰 결과 가져오기 (클레임 포함)
 */
export const getFirebaseIdTokenResult = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  return getIdTokenResult(user);
};

// ============================================
// 비밀번호 관리
// ============================================

/**
 * 비밀번호 재설정 이메일 발송
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

// ============================================
// 이메일 인증
// ============================================

/**
 * 이메일 인증 발송
 */
export const sendVerificationEmail = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return sendEmailVerification(user);
};

// ============================================
// 프로필 관리
// ============================================

/**
 * 사용자 프로필 업데이트
 */
export const updateUserProfile = async (profile: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return updateProfile(user, profile);
};

// 기본 export
export { auth };
