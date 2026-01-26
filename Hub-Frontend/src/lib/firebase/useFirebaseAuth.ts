/**
 * Firebase Auth React Hook
 *
 * Firebase 인증 상태를 React 컴포넌트에서 사용하기 위한 커스텀 훅
 */
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  getFirebaseIdToken,
  sendPasswordReset,
  getCurrentUser,
} from './auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface UseFirebaseAuth {
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

/**
 * Firebase 인증 상태 관리 훅
 */
export function useFirebaseAuth(): UseFirebaseAuth {
  const [state, setState] = useState<AuthState>({
    user: getCurrentUser(),
    loading: true,
    error: null,
  });

  // 인증 상태 변경 리스너
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
      }));
    });

    return () => unsubscribe();
  }, []);

  // 이메일 로그인
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  // 이메일 회원가입
  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await signUpWithEmail(email, password, displayName);
      } catch (error) {
        setState((prev) => ({ ...prev, error: error as Error, loading: false }));
        throw error;
      }
    },
    []
  );

  // Google 로그인
  const loginWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithGoogle();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signOut();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  // 비밀번호 재설정
  const resetPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await sendPasswordReset(email);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  // ID 토큰 가져오기
  const getIdToken = useCallback(async (forceRefresh = false) => {
    return getFirebaseIdToken(forceRefresh);
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    getIdToken,
    clearError,
  };
}

export default useFirebaseAuth;
