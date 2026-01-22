import { registerAs } from '@nestjs/config';
import { IsInt, IsString, IsOptional } from 'class-validator';
import { validateConfig } from '../../common/utils/validate-config';
import { AuthConfig } from './auth-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  AUTH_JWT_SECRET: string;

  @IsInt()
  AUTH_JWT_TOKEN_EXPIRES_IN: number; // 밀리세컨드 (seconds * 1000)

  @IsString()
  AUTH_REFRESH_SECRET: string;

  @IsInt()
  AUTH_REFRESH_TOKEN_EXPIRES_IN: number; // 밀리세컨드 (seconds * 1000)

  @IsOptional()
  @IsString()
  AUTH_WEBHOOK_API_KEY?: string; // Webhook API Key (외부 앱에서 결제 완료 알림용)
}

export default registerAs<AuthConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    secret: process.env.AUTH_JWT_SECRET,
    expires: parseInt(process.env.AUTH_JWT_TOKEN_EXPIRES_IN, 10),
    refreshSecret: process.env.AUTH_REFRESH_SECRET,
    refreshExpires: parseInt(process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN, 10),
    webhookApiKey: process.env.AUTH_WEBHOOK_API_KEY,
  };
});
