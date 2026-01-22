import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { AppPermissionDto, LicenseCheckResponseDto, PermissionsDto } from './dto/app-permission.dto';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';
import { WebhookSubscriptionDto } from './dto/webhook-subscription.dto';
import { CreateProductMappingDto, UpdateProductMappingDto } from './dto/product-mapping.dto';
import { AppEntity } from 'src/database/entities/subscription/app.entity';
import { AppSubscriptionEntity } from 'src/database/entities/subscription/app-subscription.entity';
import { ProductPermissionMappingEntity } from 'src/database/entities/subscription/product-permission-mapping.entity';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';

@ApiTags('Subscription - 앱 구독 관리')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  // ==================== 앱 관련 ====================

  @Get('apps')
  @Public()
  @ApiOperation({ summary: '모든 앱 목록 조회' })
  @ApiResponse({ status: 200, description: '앱 목록' })
  async getAllApps(): Promise<AppEntity[]> {
    return this.subscriptionService.getAllApps();
  }

  @Get('apps/:appId')
  @Public()
  @ApiOperation({ summary: '특정 앱 정보 조회' })
  @ApiParam({ name: 'appId', example: 'examhub' })
  @ApiResponse({ status: 200, description: '앱 정보' })
  async getApp(@Param('appId') appId: string): Promise<AppEntity> {
    return this.subscriptionService.getAppById(appId);
  }

  // ==================== 내 구독 관련 ====================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 구독 목록 조회' })
  @ApiResponse({ status: 200, description: '내 구독 목록' })
  async getMySubscriptions(@Request() req): Promise<AppSubscriptionEntity[]> {
    return this.subscriptionService.getMemberSubscriptions(req.user.memberId);
  }

  @Get('my/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 권한 정보 조회 (JWT 토큰에 포함되는 정보)' })
  @ApiResponse({ status: 200, description: '앱별 권한 정보' })
  async getMyPermissions(@Request() req): Promise<PermissionsDto> {
    return this.subscriptionService.getMemberPermissions(req.user.memberId);
  }

  @Get('my/:appId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 앱에 대한 내 구독 정보' })
  @ApiParam({ name: 'appId', example: 'examhub' })
  @ApiResponse({ status: 200, description: '구독 정보' })
  async getMyAppSubscription(
    @Request() req,
    @Param('appId') appId: string,
  ): Promise<AppSubscriptionEntity | null> {
    return this.subscriptionService.getMemberAppSubscription(req.user.memberId, appId);
  }

  // ==================== 라이선스 확인 API (각 독립 앱에서 호출) ====================

  @Get('license/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '라이선스 확인 API',
    description: '각 독립 앱에서 사용자의 앱 접근 권한을 확인할 때 호출'
  })
  @ApiQuery({ name: 'appId', example: 'examhub', description: '확인할 앱 ID' })
  @ApiResponse({ status: 200, type: LicenseCheckResponseDto })
  async checkLicense(
    @Request() req,
    @Query('appId') appId: string,
  ): Promise<LicenseCheckResponseDto> {
    return this.subscriptionService.checkLicense(req.user.memberId, appId);
  }

  @Post('license/use')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용 횟수 증가 (티켓제)',
    description: '티켓제 구독에서 사용 시 호출하여 사용 횟수 차감'
  })
  @ApiQuery({ name: 'appId', example: 'examhub' })
  @ApiResponse({ status: 200, description: '사용 성공 여부' })
  async useTicket(
    @Request() req,
    @Query('appId') appId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.subscriptionService.incrementUsage(req.user.memberId, appId);
    return { success };
  }

  // ==================== Webhook API (외부 앱에서 결제 완료 시 호출) ====================

  @Post('webhook')
  @Public()
  @ApiOperation({
    summary: 'Webhook: 외부 앱 결제 완료 알림',
    description: 'Susi 등 외부 앱에서 결제 완료 시 Hub에 구독 정보를 등록/갱신. externalProductId로 DB 매핑 자동 적용 (권장)'
  })
  @ApiResponse({ status: 201, description: '구독 생성/갱신 성공' })
  @ApiResponse({ status: 401, description: 'API Key 인증 실패' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  async handleWebhook(@Body() dto: WebhookSubscriptionDto): Promise<{ success: boolean; subscription: AppSubscriptionEntity; mapping?: ProductPermissionMappingEntity }> {
    // API Key 검증
    const authConfig = this.configService.get('auth', { infer: true });
    const webhookApiKey = authConfig?.webhookApiKey;
    if (!webhookApiKey || dto.apiKey !== webhookApiKey) {
      throw new UnauthorizedException('Invalid webhook API key');
    }

    try {
      let plan = dto.plan;
      let features = dto.features;
      let expiresAt = dto.expiresAt;
      let usageLimit = dto.usageLimit;
      let mapping: ProductPermissionMappingEntity | null = null;

      // 방법 1: externalProductId 제공 시 DB에서 매핑 조회 (권장)
      if (dto.externalProductId) {
        mapping = await this.subscriptionService.getProductMappingByExternalId(
          dto.appId,
          dto.externalProductId
        );

        if (mapping) {
          // DB 매핑 정보로 덮어쓰기
          plan = mapping.plan;
          features = mapping.features;
          usageLimit = mapping.usage_limit ?? dto.usageLimit;

          // 만료일 계산 (DTO에서 제공하지 않았을 경우)
          if (!dto.expiresAt && mapping.duration_days) {
            const calculatedExpiresAt = mapping.calculateExpiresAt();
            expiresAt = calculatedExpiresAt?.toISOString();
          }
        } else {
          throw new BadRequestException(
            `상품 매핑을 찾을 수 없습니다: ${dto.appId}/${dto.externalProductId}. ` +
            `관리자 페이지에서 상품-권한 매핑을 먼저 등록해주세요.`
          );
        }
      }

      // 방법 2: plan + features 직접 제공 (fallback)
      if (!plan || !features) {
        throw new BadRequestException(
          'externalProductId 또는 (plan + features)를 제공해야 합니다.'
        );
      }

      // 구독 생성/갱신
      const subscription = await this.subscriptionService.createOrUpdateSubscription({
        memberId: dto.memberId,
        appId: dto.appId,
        plan,
        expiresAt,
        paymentOrderId: dto.paymentOrderId,
        features,
        usageLimit,
        autoRenew: dto.autoRenew,
      });

      return {
        success: true,
        subscription,
        mapping: mapping || undefined,
      };
    } catch (error) {
      throw new BadRequestException(`구독 생성/갱신 실패: ${error.message}`);
    }
  }

  // ==================== 관리자용 API ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 생성/갱신 (관리자용)' })
  @ApiResponse({ status: 201, description: '구독 생성됨' })
  async createSubscription(@Body() dto: CreateSubscriptionDto): Promise<AppSubscriptionEntity> {
    return this.subscriptionService.createOrUpdateSubscription(dto);
  }

  @Put(':memberId/:appId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 업데이트 (관리자용)' })
  @ApiParam({ name: 'memberId', example: 1 })
  @ApiParam({ name: 'appId', example: 'examhub' })
  @ApiResponse({ status: 200, description: '구독 업데이트됨' })
  async updateSubscription(
    @Param('memberId') memberId: number,
    @Param('appId') appId: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<AppSubscriptionEntity> {
    return this.subscriptionService.updateSubscription(memberId, appId, dto);
  }

  @Delete(':memberId/:appId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '구독 취소 (관리자용)' })
  @ApiParam({ name: 'memberId', example: 1 })
  @ApiParam({ name: 'appId', example: 'examhub' })
  @ApiResponse({ status: 200, description: '구독 취소됨' })
  async cancelSubscription(
    @Param('memberId') memberId: number,
    @Param('appId') appId: string,
  ): Promise<AppSubscriptionEntity> {
    return this.subscriptionService.cancelSubscription(memberId, appId);
  }

  // ==================== 상품-권한 매핑 관리 (관리자용) ====================

  @Get('product-mappings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모든 상품-권한 매핑 조회 (관리자용)' })
  @ApiQuery({ name: 'appId', example: 'susi', required: false, description: '특정 앱으로 필터링' })
  @ApiResponse({ status: 200, description: '상품-권한 매핑 목록' })
  async getAllProductMappings(@Query('appId') appId?: string): Promise<ProductPermissionMappingEntity[]> {
    return this.subscriptionService.getAllProductMappings(appId);
  }

  @Get('product-mappings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 상품-권한 매핑 조회 (관리자용)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: '상품-권한 매핑 정보' })
  async getProductMapping(@Param('id') id: number): Promise<ProductPermissionMappingEntity> {
    return this.subscriptionService.getProductMappingById(id);
  }

  @Post('product-mappings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '상품-권한 매핑 생성 (관리자용)',
    description: '새 상품의 권한 매핑을 등록합니다. Webhook에서 자동으로 참조됩니다.'
  })
  @ApiResponse({ status: 201, description: '상품-권한 매핑 생성됨' })
  async createProductMapping(@Body() dto: CreateProductMappingDto): Promise<ProductPermissionMappingEntity> {
    return this.subscriptionService.createProductMapping(dto);
  }

  @Put('product-mappings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품-권한 매핑 수정 (관리자용)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: '상품-권한 매핑 수정됨' })
  async updateProductMapping(
    @Param('id') id: number,
    @Body() dto: UpdateProductMappingDto,
  ): Promise<ProductPermissionMappingEntity> {
    return this.subscriptionService.updateProductMapping(id, dto);
  }

  @Delete('product-mappings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품-권한 매핑 삭제 (관리자용)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: '상품-권한 매핑 삭제됨' })
  async deleteProductMapping(@Param('id') id: number): Promise<{ success: boolean }> {
    await this.subscriptionService.deleteProductMapping(id);
    return { success: true };
  }
}
