import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmConfigService } from './database/typeorm-config.service';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AppApiKeyGuard } from './auth/guards/app-api-key.guard';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';

import appConfig from './config/app-config';
import databaseConfig from './database/config/database-config';
import authConfig from './auth/config/auth-config';

import { AuthModule } from './auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { AdminModule } from './admin/admin.module';
import { CommonCodeModule } from './modules/common-code/common-code.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { CommonModule } from './common/common.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { SchoolRecordModule } from './modules/schoolrecord/schoolrecord.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { MockexamModule } from './modules/mock-exam/mock-exam.module';
import { StoreModule } from './modules/store/store.module';
import payConfig from './modules/pay/config/pay-config';
import { PaymentModule } from './modules/pay/pay.module';
import { HttpExceptionFilter } from './common/filters/http-exception-filter';
import smsConfig from './modules/sms/config/sms-config';
import { SmsModule } from './modules/sms/sms.module';
import { BoardModule } from './modules/board/board.module';
// import awsUploadConfig from './aws-upload/config/aws-upload-config';
// import { AwsUploadModule } from './aws-upload/aws-upload.module';
import gcsUploadConfig from './gcs-upload/config/gcs-upload-config';
import { GcsUploadModule } from './gcs-upload/gcs-upload.module';
import { CoreModule } from './modules/core/core.module';
import { StaticDataModule } from './modules/static-data/static-data.module';
import { ExplorationModule } from './modules/exploration/exploration.module';
import { MentoringModule } from './modules/mentoring/mentoring.module';
import { PlannerModule } from './modules/planner/planner.module';
import { MyclassModule } from './modules/myclass/myclass.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { winstonConfig } from './common/utils/winston.utils';
import { WinstonModule } from 'nest-winston';
import { OAuthModule } from './oauth/oauth.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        payConfig,
        smsConfig,
        gcsUploadConfig,
        // awsUploadConfig,
      ],
      envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.development',
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        const dataSource = new DataSource(options);
        await dataSource.initialize();
        return dataSource;
      },
    }),
    WinstonModule.forRoot(winstonConfig),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
          },
          keyPrefix: 'hub-',
          ttl: 300000, // 5분
        });
        console.log('✅ Hub: Redis 연결됨 (localhost:6379, prefix: hub-)');
        return { store, ttl: 300000 };
      },
    }),
    // Rate Limiting - DDoS/브루트포스 공격 방지
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1초
        limit: 3, // 초당 최대 3회 (빠른 연속 요청 차단)
      },
      {
        name: 'medium',
        ttl: 10000, // 10초
        limit: 20, // 10초당 최대 20회
      },
      {
        name: 'long',
        ttl: 60000, // 1분
        limit: 100, // 분당 최대 100회
      },
    ]),
    CommonModule, // 공통모듈(JWT, Bcrypt)
    EncryptionModule, // 민감정보 암호화 모듈
    AuthModule, // 인증모듈 (SSO)
    OAuthModule, // OAuth 2.0 + OIDC 모듈
    MembersModule, // 유저모듈
    AdminModule, // 어드민 모듈
    CommonCodeModule, // 공통코드 모듈
    SchoolRecordModule, // 생기부 모듈
    MockexamModule, // 모의고사 모듈
    StoreModule, // 상점 모듈
    PaymentModule, // 결제 모듈 (SSO)
    SmsModule, // SMS 모듈(Aligo 사용중)
    BoardModule, // 게시판 모듈 (게시판, 게시글, 댓글)
    // AwsUploadModule, // aws 업로드 모듈
    GcsUploadModule, // GCS 파일 업로드 모듈
    CoreModule,
    StaticDataModule, // 정적데이터 모듈(교과 코드, 계열 등)
    ExplorationModule,
    MentoringModule, // 멘토링 모듈 (계정 연동)
    PlannerModule, // 플래너 모듈 (학습계획, 일정, 루틴)
    MyclassModule, // 마이클래스 모듈 (건강관리, 상담, 출결, 시험)
    ChatbotModule, // 챗봇 모듈 (FAQ, 용어사전, 매뉴얼 기반 Q&A)
    SubscriptionModule, // 앱 구독/권한 관리 모듈 (JWT에 앱별 권한 포함)
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // 컨트롤러에 @Public()이 없다면 작동
      // 요청헤더의 authorization의 jwt토큰을 검증하고 요청에 memberId 값을 추가시켜줌(req.memberId)
      // 없다면 401(인증필요) 에러
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      // 컨트롤러에 @Roles(['ROLE_ADMIN', "ROLE_USER"...])이 붙으면 작동
      // jwt토큰으로 멤버를 조회하여 해당유저의 권한을 체크하여 배열에 속한 권한을 가지는지 체크
      // 없다면 403(권한없음) 에러
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      // Rate Limiting Guard - DDoS/브루트포스 공격 방지
      // localhost는 제외되어 개발 환경에서 제한 없이 사용 가능
      // 초과 시 429 (Too Many Requests) 에러
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      // 앱 API Key Guard - @RequireAppAuth() 데코레이터가 있는 엔드포인트에서 앱 인증 검증
      // 하이브리드 앱 전용 보안 레이어
      provide: APP_GUARD,
      useClass: AppApiKeyGuard,
    },
    {
      // 응답에 성공시 {success: true, data: any}
      provide: APP_INTERCEPTOR,
      useClass: SuccessResponseInterceptor,
    },
    {
      // http 예외 발생 시 {success: false, message: "text", statusCode: xxx} 값을 추가
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
