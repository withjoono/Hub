/**
 * Firebase 설정 및 초기화
 *
 * Firebase Auth를 중앙 IDP로 사용하여 모든 앱에서 SSO 지원
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
  connectAuthEmulator
} from 'firebase/auth';
import { env } from '@/lib/config/env';

// Firebase 설정
const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  measurementId: env.firebase.measurementId,
};

// Firebase 앱 초기화 (중복 초기화 방지)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase Auth 인스턴스
const auth: Auth = getAuth(app);

// 개발 환경에서 에뮬레이터 연결 (선택적)
if (env.isDevelopment && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

// Google OAuth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// 한국어 설정
auth.languageCode = 'ko';

export { app, auth, googleProvider };
export default app;
