import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  ClipboardList,
  Bell,
  Snowflake,
  Sprout,
  Zap,
  ArrowRight
} from "lucide-react";

interface ServiceCard {
  id: string;
  title: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgGradient: string;
  features: string[];
  disabled?: boolean;
  isExternal?: boolean;
}

// Susi 외부 서비스 URL (수시)
const SUSI_URL = import.meta.env.VITE_SUSI_URL || "http://localhost:3001";

// Jungsi 외부 서비스 URL (정시)
const JUNGSI_URL = import.meta.env.VITE_JUNGSI_URL || "http://localhost:3002";

// MyExam 외부 서비스 URL (ExamHub)
const MYEXAM_URL = import.meta.env.VITE_MYEXAM_URL || "http://localhost:3003";

// StudyPlanner 외부 서비스 URL
const STUDYPLANNER_URL = import.meta.env.VITE_STUDYPLANNER_URL || "http://localhost:3004";

// 현재 서비스 중
const currentServices: ServiceCard[] = [
  {
    id: "jungsi",
    title: "정시 예측 분석",
    price: "유료",
    description: "기존 정시 서비스랑은 차원이 다른, 초격차 정시 예측 서비스!",
    icon: <Calendar className="w-6 h-6" />,
    href: JUNGSI_URL,
    color: "text-orange-500",
    bgGradient: "from-orange-500 to-orange-600",
    features: [
      "대학별 유불리(특허)",
      "모의지원 상황 기반 정시 시뮬레이션",
      "단계별 프로세스식 진행",
      "정시 모의지원 앱",
      "계정연동으로 선생님과 앱 상담"
    ],
    isExternal: true,
  },
];

// 겨울방학부터 서비스
const winterServices: ServiceCard[] = [
  {
    id: "mock-exam",
    title: "Exam Hub",
    price: "무료",
    description: "내가 푼, 쪽지 시험의 단 한 문제도 이제는 버리는 일이 없도록!",
    icon: <BarChart3 className="w-6 h-6" />,
    href: MYEXAM_URL,
    color: "text-grape-500",
    bgGradient: "from-grape-500 to-grape-600",
    features: [
      "학원시험, 내신, 모의고사, 사설모의 모든 시험의",
      "성적 분석",
      "취약 부분 관리",
      "오답 관리"
    ],
    isExternal: true,
  },
  {
    id: "planner",
    title: "플래너",
    price: "무료",
    description: "제대로 만든 수험생 전용 학습 플래너",
    icon: <ClipboardList className="w-6 h-6" />,
    href: STUDYPLANNER_URL,
    color: "text-ultrasonic-500",
    bgGradient: "from-ultrasonic-500 to-ultrasonic-600",
    features: [
      "장기계획과 주간 루틴 자동 계획",
      "교과서, 참고서 분량 자동 생성"
    ],
    disabled: false,
    isExternal: true,
  },
  {
    id: "class-status",
    title: "수업 현황",
    price: "무료",
    description: "학원 수업이든 학교 수업이든 모든 수업 계획과 현황을 이곳에!",
    icon: <BookOpen className="w-6 h-6" />,
    href: "/class-status",
    color: "text-inferno-500",
    bgGradient: "from-inferno-500 to-inferno-600",
    features: [
      "수업 계획",
      "수업 진도",
      "과제 현황"
    ],
    disabled: true,
  },
  {
    id: "susi-2027",
    title: "2027 수시 예측 분석",
    price: "유료",
    description: "수시 예측 분석 서비스를 겨울방학때부터!",
    icon: <GraduationCap className="w-6 h-6" />,
    href: SUSI_URL,
    color: "text-olive-500",
    bgGradient: "from-olive-500 to-olive-600",
    features: [
      "AI 사정관의 생기부 평가",
      "대학별 유불리(특허)",
      "단계별 프로세스식 진행",
      "무료 수시 모의지원 앱",
      "계정연동 선생님 상담"
    ],
    isExternal: true,
  },
  {
    id: "account-link",
    title: "계정 연동",
    price: "무료",
    description: "조회하고 싶은 사람들 여기 다 부르자!",
    icon: <Users className="w-6 h-6" />,
    href: "/users/profile",
    color: "text-amethyst-500",
    bgGradient: "from-amethyst-500 to-amethyst-600",
    features: [
      "학부모와 연동",
      "선생님과 연동"
    ],
  },
];

// 3월 신학기부터 서비스
const springServices: ServiceCard[] = [
  {
    id: "admission-delivery",
    title: "맞춤 입시 정보 딜리버리",
    price: "Members",
    description: "이제 입시 정보를 찾으려고 시간 낭비하실 필요없습니다. 나에게 맞는 정보만 배달 서비스!",
    icon: <Bell className="w-6 h-6" />,
    href: "/admission-info",
    color: "text-golden-500",
    bgGradient: "from-golden-500 to-golden-600",
    features: [
      "맞춤형 입시 정보 제공",
      "개인화된 알림 서비스"
    ],
    disabled: true,
  },
];

interface ServiceSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  services: ServiceCard[];
  badgeColor: string;
  bgColor: string;
}

function ServiceSection({ title, subtitle, icon, services, badgeColor, bgColor }: ServiceSectionProps) {
  // 개발 환경에서는 disabled 무시 (로컬에서 모든 서비스 접근 가능)
  const isDev = import.meta.env.DEV;

  return (
    <div className={cn("py-12", bgColor)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className={cn("p-3 rounded-xl", badgeColor)}>
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-500 text-sm">{subtitle}</p>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {services.map((service) => {
            // 프로덕션에서만 disabled 적용, 개발 환경에서는 모두 활성화
            const isDisabled = service.disabled && !isDev;

            const cardContent = (
              <>
                {isDisabled && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5">
                    <span className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
                      곧 오픈
                    </span>
                  </div>
                )}

                {/* Card Header with Gradient */}
                <div className={cn(
                  "relative px-5 py-6 text-white",
                  "bg-gradient-to-r",
                  service.bgGradient
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                          {service.price}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold">{service.title}</h3>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      {service.icon}
                    </div>
                  </div>
                  <p className="mt-3 text-white/90 text-sm line-clamp-2">
                    {service.description}
                  </p>
                </div>

                {/* Card Body */}
                <div className="px-5 py-4 flex-1">
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className={cn("mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0", service.color.replace('text-', 'bg-'))} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 border-t border-gray-100">
                  <div className={cn(
                    "flex items-center gap-2 text-sm font-semibold",
                    isDisabled ? "text-gray-400" : service.color,
                    !isDisabled && "group-hover:gap-3 transition-all"
                  )}>
                    {isDisabled ? "곧 오픈" : "바로가기"}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </>
            );

            if (isDisabled) {
              return (
                <div
                  key={service.id}
                  className={cn(
                    "group relative flex flex-col rounded-2xl overflow-hidden",
                    "bg-white border border-gray-100",
                    "shadow-sm transition-all duration-300",
                    "opacity-70 cursor-not-allowed"
                  )}
                >
                  {cardContent}
                </div>
              );
            }

            const cardClassName = cn(
              "group relative flex flex-col rounded-2xl overflow-hidden",
              "bg-white border border-gray-100",
              "shadow-sm transition-all duration-300",
              "hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            );

            // 외부 링크인 경우 (Firebase Auth SSO - 동일한 Firebase 프로젝트 사용으로 자동 SSO)
            if (service.isExternal) {
              return (
                <a
                  key={service.id}
                  href={service.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClassName}
                >
                  {cardContent}
                </a>
              );
            }

            // 내부 링크는 제거되었으므로 disabled 처리
            return (
              <div
                key={service.id}
                className={cn(
                  "group relative flex flex-col rounded-2xl overflow-hidden",
                  "bg-white border border-gray-100",
                  "shadow-sm transition-all duration-300",
                  "opacity-70 cursor-not-allowed"
                )}
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ServiceCardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-12 pb-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium ">
            <Zap className="w-4 h-4" />
            거북스쿨의 AI 앱 서비스
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 ">
            입시의 모든 것을 거북스쿨에서!
          </h1>
        </div>
      </div>

      {/* 거북쌤 소개 섹션 */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
          {/* 거북쌤 이미지 */}
          <div className="flex-shrink-0">
            <img
              src="/images/geobuk-ssam.png"
              alt="거북쌤"
              className="w-32 h-32 md:w-40 md:h-40 object-contain"
            />
          </div>

          {/* 말풍선 */}
          <div className="relative bg-white rounded-2xl shadow-lg p-6 border border-gray-100 max-w-xl">
            {/* 말풍선 꼬리 (모바일: 위쪽, 데스크탑: 왼쪽) */}
            <div className="hidden md:block absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white drop-shadow-sm" />
            <div className="md:hidden absolute top-0 left-1/2 -translate-y-2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white drop-shadow-sm" />

            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              <span className="font-bold text-blue-600">입시전문가 겸 AI 개발자</span>, 거북쌤이 만든 앱은 다릅니다!
              사용해 보시면 기존의 것과는 많이 다르다는 것을 느끼실 것입니다.
              아래 앱들은 <span className="font-semibold">거북쌤이 직접, 나홀로 만든 AI 앱들</span>입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 현재 서비스 중 */}
      <ServiceSection
        title="현재 서비스 중"
        subtitle="지금 바로 이용 가능한 서비스"
        icon={<Zap className="w-6 h-6 text-blue-600" />}
        services={currentServices}
        badgeColor="bg-blue-100"
        bgColor="bg-white"
      />

      {/* 겨울방학부터 서비스 */}
      <ServiceSection
        title="겨울방학부터 서비스"
        subtitle="2025년 겨울방학부터 만나볼 수 있어요"
        icon={<Snowflake className="w-6 h-6 text-sky-600" />}
        services={winterServices}
        badgeColor="bg-sky-100"
        bgColor="bg-slate-50"
      />

      {/* 3월 신학기부터 서비스 */}
      <ServiceSection
        title="3월 신학기부터 서비스"
        subtitle="2026년 3월 새학기부터 만나볼 수 있어요"
        icon={<Sprout className="w-6 h-6 text-green-600" />}
        services={springServices}
        badgeColor="bg-green-100"
        bgColor="bg-white"
      />

      {/* Footer padding */}
      <div className="pb-16" />
    </div>
  );
}
