/**
 * Firebase Auth Context Provider
 *
 * 앱 전체에서 Firebase 인증 상태를 공유하기 위한 Context Provider
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  getFirebaseIdToken,
  sendPasswordReset,
} from './auth';
import { authClient } from '@/lib/api';

interface FirebaseAuthContextType {
  // 상태
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;

  // 액션
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  clearError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null);

interface FirebaseAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Firebase Auth Context Provider
 *
 * 사용법:
 * ```tsx
 * // App.tsx
 * <FirebaseAuthProvider>
 *   <App />
 * </FirebaseAuthProvider>
 *
 * // 컴포넌트에서 사용
 * const { user, loginWithEmail, logout } = useFirebaseAuthContext();
 * ```
 */
export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 인증 상태 변경 리스너
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Firebase 토큰을 백엔드 요청 헤더에 설정
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        // authClient 인터셉터에서 사용할 수 있도록 저장
        localStorage.setItem('firebase_id_token', idToken);
      } else {
        localStorage.removeItem('firebase_id_token');
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase 토큰 자동 갱신 (50분마다)
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const idToken = await user.getIdToken(true);
        localStorage.setItem('firebase_id_token', idToken);
      } catch (err) {
        console.error('Failed to refresh Firebase token:', err);
      }
    }, 50 * 60 * 1000); // 50분

    return () => clearInterval(refreshInterval);
  }, [user]);

  // 이메일 로그인
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmail(email, password);

      // 백엔드에 Firebase 사용자 동기화
      const idToken = await userCredential.user.getIdToken();
      await syncUserWithBackend(idToken);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, []);

  // 이메일 회원가입
  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setLoading(true);
      setError(null);
      try {
        const userCredential = await signUpWithEmail(email, password, displayName);

        // 백엔드에 새 사용자 생성
        const idToken = await userCredential.user.getIdToken();
        await syncUserWithBackend(idToken, true);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
        throw err;
      }
    },
    []
  );

  // Google 로그인
  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithGoogle();

      // 백엔드에 Firebase 사용자 동기화
      const idToken = await userCredential.user.getIdToken();
      await syncUserWithBackend(idToken);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut();
      localStorage.removeItem('firebase_id_token');
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, []);

  // 비밀번호 재설정
  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  }, []);

  // ID 토큰 가져오기
  const getIdToken = useCallback(
    async (forceRefresh = false) => {
      return getFirebaseIdToken(forceRefresh);
    },
    []
  );

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: FirebaseAuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    getIdToken,
    clearError,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

/**
 * Firebase Auth Context 사용 훅
 */
export function useFirebaseAuthContext(): FirebaseAuthContextType {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuthContext must be used within FirebaseAuthProvider');
  }
  return context;
}

/**
 * 백엔드와 Firebase 사용자 동기화
 */
async function syncUserWithBackend(idToken: string, isNewUser = false) {
  try {
    // Firebase ID 토큰을 백엔드로 전송하여 사용자 정보 동기화
    const endpoint = isNewUser ? '/auth/firebase/register' : '/auth/firebase/login';
    await authClient.post(endpoint, { idToken });
  } catch (err) {
    console.error('Failed to sync user with backend:', err);
    // 백엔드 동기화 실패해도 Firebase 인증은 유지
  }
}

export default FirebaseAuthProvider;
