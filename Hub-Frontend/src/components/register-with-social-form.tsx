import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import debounce from "lodash/debounce";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "./custom/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { HIGH_SCHOOL_LIST } from "@/constants/high-school";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useSendRegisterCode,
  useVerifyCode,
} from "@/stores/server/features/auth/mutations";
import { useSocialSignUp } from "@/stores/client/use-social-sign-up";
import { registerWithSocialFormSchema } from "@/lib/validations/auth";
import {
  UsersIcon,
  CheckIcon,
  GraduationCapIcon,
  UserIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { meQueryKeys } from "@/stores/server/features/me/queries";

interface Props {
  className?: string;
}

export function RegisterWithSocialForm({ className }: Props) {
  const [searchHighSchool, setSearchHighSchool] = useState(""); // 학교 검색어 (필터링때문에 form 외에 추가로 만듬)
  const [isFocused, setIsFocused] = useState(false); // 학교검색 포커스
  const [memberType, setMemberType] = useState<
    "student" | "teacher" | "parent"
  >("student"); // 회원 유형
  const socialType = useSocialSignUp((state) => state.socialType);
  const socialToken = useSocialSignUp((state) => state.token);
  const socialName = useSocialSignUp((state) => state.name);
  const socialEmail = useSocialSignUp((state) => state.email);
  const clearSocialData = useSocialSignUp((state) => state.clearData);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // 휴대폰 번호
  const [isAuthedPhone, setIsAuthedPhone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mutations
  const sendRegisterCode = useSendRegisterCode();
  const verifyCode = useVerifyCode();

  const form = useForm<z.infer<typeof registerWithSocialFormSchema>>({
    resolver: zodResolver(registerWithSocialFormSchema),
    defaultValues: {
      name: socialName || "",
      school: "",
      major: 0,
      graduateYear: 2025,
      phone: "",
      phoneToken: "",
    },
  });

  // 검색어 변경 시 필터링된 학교 목록 업데이트
  const debouncedSetSearchHighSchool = useMemo(
    () => debounce((term: string) => setSearchHighSchool(term), 200),
    [],
  );

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    form.setValue("school", term);
    debouncedSetSearchHighSchool(term);
  };

  // 검색어로 필터링된 학교 목록
  const filteredHighSchools = useMemo(() => {
    return HIGH_SCHOOL_LIST.filter((school) => {
      if (searchHighSchool === "") return true;
      return school.highschoolName.includes(searchHighSchool);
    });
  }, [searchHighSchool]);

  // 고등학교 리스트가 2000개가 넘어서 렌더링 최적화를 위해 virtual 처리 (tanstack/virtual 사용)
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredHighSchools.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // 약관동의 상태
  const [agreeToTerms, setAgreeToTerms] = useState([
    false,
    false,
    false,
    false,
  ]);

  // 약관 동의 버튼 클릭
  const handleAgreeClick = (idx: number) => {
    if (4 <= idx) {
      throw Error("잘못된 접근입니다.");
    }
    const copy = [...agreeToTerms];
    copy[idx] = !copy[idx];
    setAgreeToTerms(copy);
  };

  // 약관 전체 동의 버튼 클릭
  const handleAllAgreeClick = () => {
    if (agreeToTerms.some((n) => n === false)) {
      setAgreeToTerms([true, true, true, true]);
    } else {
      setAgreeToTerms([false, false, false, false]);
    }
  };

  // 회원가입 버튼 클릭
  async function onSubmit(
    values: z.infer<typeof registerWithSocialFormSchema>,
  ) {
    if (!socialType || !socialToken) {
      toast.error("소셜 로그인 정보가 잘못되었습니다.");
      clearSocialData();
      return;
    }

    setIsLoading(true);

    const school = HIGH_SCHOOL_LIST.find(
      (n) => n.highschoolName === values.school,
    );
    // 만약 학교 값이 존재하는데 학교 목록에 없으면 잘못된 학교임으로 에러처리
    if (values.school !== "" && !school) {
      toast.error(
        "잘못된 학교입니다. 리스트에 학교가 없다면 필드를 비워주세요.",
      );
      return;
    }
    const formattedPhone = values.phone.replace(/-/g, "");

    // Firebase 회원가입 API 호출
    const response = await fetch('/api-hub/auth/firebase/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: socialToken,
        nickname: values.name,
        hstTypeId: school?.id,
        isMajor: String(values.major),
        graduateYear: String(values.graduateYear),
        phone: formattedPhone,
        ckSmsAgree: agreeToTerms[3],
        memberType: memberType,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // 회원가입 성공 후 me 쿼리 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: meQueryKeys.all });
      clearSocialData(); // 소셜 로그인 임시 데이터 삭제
      toast.success("거북스쿨에 가입해주셔서 감사합니다! 😄");
      setIsLoading(false);
      navigate({ to: "/" });
    } else {
      toast.error(result.message || result.error || "회원가입에 실패했습니다.");
      setIsLoading(false);
    }
  }

  const handleSendCodeClick = async () => {
    const { phone } = form.getValues();

    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

    if (!phone) return toast.error("휴대폰 번호를 입력해주세요.");
    if (!phoneRegex.test(phone)) {
      toast.error("올바른 휴대폰 번호 형식이 아닙니다.");
      return;
    }

    try {
      const formattedPhone = phone.replace(/-/g, "");
      const result = await sendRegisterCode.mutateAsync({
        phone: formattedPhone,
      });
      if (result.success) {
        toast.success("인증번호가 발송되었습니다.");
        return;
      } else {
        toast.error(result.error);
        return;
      }
    } catch (error: any) {
      // 백엔드 에러 메시지를 전화번호 필드에 표시
      const errorMessage = error.response?.data?.message || "인증코드 발송 중 오류가 발생했습니다.";

      form.setError("phone", {
        type: "manual",
        message: errorMessage,
      });
    }
  };

  const handleVerifyCodeClick = async () => {
    const { phoneToken, phone } = form.getValues();

    if (!phone) return toast.error("휴대폰 번호를 입력해주세요.");
    if (!phoneToken) return toast.error("인증코드를 입력해주세요.");

    const formattedPhone = phone.replace(/-/g, "");
    const result = await verifyCode.mutateAsync({
      phone: formattedPhone,
      code: phoneToken,
    });

    if (result.success) {
      toast.success("인증번호가 확인되었습니다.");
      setIsAuthedPhone(true);
      return;
    } else {
      toast.error(result.error);
      return;
    }
  };

  return (
    <Form {...form}>
      <div className={cn("space-y-2", className)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름*</FormLabel>
                  <FormControl>
                    <Input placeholder="이름" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>학교</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="학교 검색(목록에 없으면 비워주세요)"
                        {...field}
                        onFocus={() => setIsFocused(true)}
                        onChange={handleSearchInputChange}
                        autoComplete="off"
                        onBlur={() =>
                          setTimeout(() => setIsFocused(false), 100)
                        }
                      />
                    </FormControl>
                    {isFocused && (
                      <div
                        ref={parentRef}
                        className={cn(
                          "absolute left-0 top-10 z-40 max-h-[400px] w-full overflow-y-auto rounded-b-md border bg-gray-100",
                          "scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-track-slate-300 scrollbar-thumb-primary",
                        )}
                      >
                        <div
                          className="relative w-full"
                          style={{ height: `${totalSize}px` }}
                        >
                          {virtualItems.map((virtualItem) => {
                            const school =
                              filteredHighSchools[virtualItem.index];
                            return (
                              <div
                                key={virtualItem.key}
                                className="absolute left-0 top-0 flex w-full cursor-pointer items-center px-2 text-sm hover:bg-gray-200"
                                style={{
                                  height: `${virtualItem.size}px`,
                                  transform: `translateY(${virtualItem.start}px)`,
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault(); // blur 이벤트 방지
                                  setSearchHighSchool(school.highschoolName);
                                  form.setValue(
                                    "school",
                                    school.highschoolName,
                                  );
                                  setIsFocused(false); // 선택 후 드롭다운 닫기
                                }}
                              >
                                {school.highschoolName} (
                                {school.highschoolRegion})
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>전공*</FormLabel>
                    <Select defaultValue={"0"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">문과</SelectItem>
                        <SelectItem value="1">이과</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="graduateYear"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>졸업예정연도*</FormLabel>
                    <FormControl>
                      <Input placeholder="예) 2025" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">회원유형</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={"outline"}
                  type="button"
                  onClick={() => setMemberType("student")}
                  className={cn(
                    "relative flex h-auto flex-col items-center gap-2",
                    memberType === "student" &&
                      "text-primary hover:text-primary",
                  )}
                >
                  {memberType === "student" && (
                    <CheckIcon className="absolute right-0 top-0 size-6 text-primary" />
                  )}
                  <UserIcon className="size-6" />
                  <span>학생</span>
                </Button>
                <Button
                  variant={"outline"}
                  type="button"
                  onClick={() => setMemberType("teacher")}
                  className={cn(
                    "relative flex h-auto flex-col items-center gap-2",
                    memberType === "teacher" &&
                      "text-primary hover:text-primary",
                  )}
                >
                  {memberType === "teacher" && (
                    <CheckIcon className="absolute right-0 top-0 size-6 text-primary" />
                  )}
                  <GraduationCapIcon className="size-6" />
                  <span>선생님</span>
                </Button>
                <Button
                  variant={"outline"}
                  type="button"
                  onClick={() => setMemberType("parent")}
                  className={cn(
                    "relative flex h-auto flex-col items-center gap-2",
                    memberType === "parent" &&
                      "text-primary hover:text-primary",
                  )}
                >
                  {memberType === "parent" && (
                    <CheckIcon className="absolute right-0 top-0 size-6 text-primary" />
                  )}
                  <UsersIcon className="size-6" />
                  <span>학부모</span>
                </Button>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>휴대폰 번호*</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isAuthedPhone}
                        placeholder="01012345678"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant={"outline"}
                onClick={handleSendCodeClick}
                disabled={isAuthedPhone}
              >
                인증번호 발송
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="phoneToken"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>인증번호*</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isAuthedPhone}
                        placeholder="인증번호"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant={"outline"}
                onClick={handleVerifyCodeClick}
                disabled={isAuthedPhone}
              >
                인증번호 확인
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={
                    agreeToTerms[0] &&
                    agreeToTerms[1] &&
                    agreeToTerms[2] &&
                    agreeToTerms[3]
                  }
                  onCheckedChange={handleAllAgreeClick}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>전체 동의</FormLabel>
              </div>
            </FormItem>
            {[
              { text: "이용약관 동의 (필수)", link: "/" },
              { text: "개인정보 수집 및 이용 동의 (필수)", link: "/" },
              { text: "만 14세 이상 사용자 (필수)", link: "" },
              { text: "SMS 광고성 수신동의 (선택)", link: "" },
            ].map((item, idx) => (
              <FormItem
                key={item.text}
                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
              >
                <FormControl>
                  <Checkbox
                    checked={agreeToTerms[idx]}
                    onCheckedChange={() => handleAgreeClick(idx)}
                  />
                </FormControl>
                <div className="flex w-full justify-between space-y-1 leading-none">
                  <FormLabel>{item.text}</FormLabel>
                  {item.link && (
                    <FormDescription>
                      <a href={item.link} target="_blank">
                        더보기
                      </a>
                    </FormDescription>
                  )}
                </div>
              </FormItem>
            ))}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !agreeToTerms[0] ||
              !agreeToTerms[1] ||
              !agreeToTerms[2]
            }
          >
            회원가입
          </Button>
        </form>
        <div className="flex justify-center pt-2">
          <Link
            to="/auth/login"
            className="text-sm text-blue-500 hover:underline"
          >
            이미 계정이 있으신가요? (간편 로그인)
          </Link>
        </div>
      </div>
    </Form>
  );
}
