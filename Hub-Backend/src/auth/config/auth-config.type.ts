export type AuthConfig = {
  secret?: string;
  expires?: number; // 밀리세컨드 (seconds * 1000)
  refreshSecret?: string;
  refreshExpires?: number; // 밀리세컨드 (seconds * 1000)
  webhookApiKey?: string; // Webhook API Key (외부 앱에서 결제 완료 알림용)
};
