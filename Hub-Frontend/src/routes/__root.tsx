import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JungsiHeader } from "@/components/jungsi-header";
import { SusiHeader } from "@/components/susi-header";
import { MockAnalysisHeader } from "@/components/mock-analysis-header";
import { GradeAnalysisHeader } from "@/components/grade-analysis-header";
import ScrollToTop from "@/components/scroll-to-top";
import { Toaster } from "@/components/ui/sonner";
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
// SSO 초기화
import { useSSOInit } from "@shared/sso-client/index.ts";
import { setTokens as setTokensToManager } from "@/lib/api/token-manager";
import { useTokenStore } from "@/stores/atoms/tokens";
import { useAuthStore } from "@/stores/client/use-auth-store";

function isJungsiPath(pathname: string): boolean {
  return pathname.startsWith("/jungsi") || pathname.startsWith("/j");
}

function isSusiPath(pathname: string): boolean {
  return pathname.startsWith("/susi");
}

function isMockAnalysisPath(pathname: string): boolean {
  return pathname.startsWith("/mock-analysis");
}

function isGradeAnalysisPath(pathname: string): boolean {
  return pathname.startsWith("/grade-analysis");
}

function RootLayout() {
  const location = useLocation();
  const isTestPage = location.pathname === "/test/auth-me" || location.pathname === "/test/login-debug";
  const isAuthPage = location.pathname.startsWith("/auth/");
  const isHybridAppPage = location.pathname.startsWith("/mock-apply") ||
    location.pathname.startsWith("/score-analysis");

  // SSO 토큰 초기화 (URL 파라미터에서 토큰 확인)
  const { setTokens: setTokenStoreTokens } = useTokenStore();
  const { setTokens: setAuthStoreTokens } = useAuthStore();

  useSSOInit((tokens) => {
    console.log('🔐 SSO 토큰 수신 - 자동 로그인 처리');
    // token-manager에 저장 (single source of truth)
    setTokensToManager(tokens.accessToken, tokens.refreshToken);
    // Zustand 스토어들 동기화
    setTokenStoreTokens(tokens.accessToken, tokens.refreshToken);
    setAuthStoreTokens(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.tokenExpiry ?? Math.floor(Date.now() / 1000) + 7200
    );
  });

  const isJungsiMode = isJungsiPath(location.pathname);
  const isSusiMode = isSusiPath(location.pathname);
  const isMockAnalysisMode = isMockAnalysisPath(location.pathname);
  const isGradeAnalysisMode = isGradeAnalysisPath(location.pathname);

  const renderHeader = () => {
    if (isTestPage || isAuthPage || isHybridAppPage) return null;
    if (isJungsiMode) return <JungsiHeader />;
    if (isSusiMode) return <SusiHeader />;
    if (isMockAnalysisMode) return <MockAnalysisHeader />;
    if (isGradeAnalysisMode) return <GradeAnalysisHeader />;
    return <Header />;
  };

  return (
    <>
      {renderHeader()}
      <div className={isHybridAppPage ? "h-full min-h-screen" : "h-full min-h-screen py-4"}>
        <Outlet />
      </div>
      {!isTestPage && !isHybridAppPage && (
        <>
          <Toaster richColors position={"top-right"} duration={1200} />
          <Footer />
          <ScrollToTop />
        </>
      )}
      {isHybridAppPage && (
        <Toaster richColors position={"top-right"} duration={1200} />
      )}
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});


