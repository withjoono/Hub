import { registerAs } from '@nestjs/config';
import { IsOptional, IsInt, Min, Max, IsString, IsBoolean } from 'class-validator';
import { validateConfig } from '../../common/utils/validate-config';
import { DatabaseConfig } from './database-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  DB_TYPE: string;

  @IsString()
  @IsOptional()
  DB_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  DB_PORT: number;

  @IsString()
  @IsOptional()
  DB_PASSWORD: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  @IsOptional()
  DB_USER: string;

  @IsBoolean()
  @IsOptional()
  DB_SYNCHRONIZE: boolean;
}

export default registerAs<DatabaseConfig>('database', () => {
  // DATABASE_URL이 존재하면 (운영 환경), 파싱하여 사용
  if (process.env.DATABASE_URL) {
    try {
      const databaseUrl = process.env.DATABASE_URL;

      // DATABASE_URL 형식 로깅 (비밀번호 마스킹)
      const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
      console.log('🔗 DATABASE_URL 감지:', maskedUrl);

      // Cloud SQL Unix Socket 연결 형식 체크
      // postgresql://user:password@/database?host=/cloudsql/PROJECT:REGION:INSTANCE
      if (databaseUrl.includes('?host=/cloudsql/')) {
        const url = new URL(databaseUrl);
        const socketPath = url.searchParams.get('host');

        console.log('✅ Cloud SQL Unix Socket 연결:', {
          socket: socketPath,
          database: url.pathname.slice(1),
          username: url.username,
        });

        return {
          type: 'postgres',
          host: socketPath, // Unix 소켓 경로
          port: undefined, // Unix 소켓은 포트 불필요
          password: decodeURIComponent(url.password),
          name: url.pathname.slice(1),
          username: decodeURIComponent(url.username),
          synchronize: false,
        };
      }

      // 일반 PostgreSQL URL: postgresql://user:password@host:port/database
      const url = new URL(databaseUrl);

      console.log('✅ PostgreSQL 일반 연결:', {
        host: url.hostname,
        port: url.port || 5432,
        database: url.pathname.slice(1),
        username: url.username,
      });

      return {
        type: 'postgres',
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 5432,
        password: decodeURIComponent(url.password),
        name: url.pathname.slice(1),
        username: decodeURIComponent(url.username),
        synchronize: false,
      };
    } catch (error) {
      // 에러 상세 정보 출력
      console.error('❌ DATABASE_URL 파싱 실패:', {
        error: error.message,
        stack: error.stack,
        urlLength: process.env.DATABASE_URL?.length,
        urlStart: process.env.DATABASE_URL?.substring(0, 20),
      });
      throw new Error(
        `Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database. Error: ${error.message}`,
      );
    }
  }

  // DATABASE_URL이 없으면 개별 변수 사용 (개발 환경)
  validateConfig(process.env, EnvironmentVariablesValidator);

  // 실수로 동기화를 킬 경우를 대비해 config를 구성할 때 사전 차단
  // 로컬 개발 환경(development)이나 SQLite 사용 시에는 동기화 허용
  if (
    process.env.DB_SYNCHRONIZE === 'true' &&
    process.env.NODE_ENV !== 'development' &&
    process.env.DB_TYPE !== 'better-sqlite3'
  ) {
    throw new Error(
      'DB 동기화 설정이 켜져있습니다. DB의 데이터가 날아갈 수 있음으로 서버를 실행시킬 수 없습니다.',
    );
  }

  return {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    username: process.env.DB_USER,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  };
});
