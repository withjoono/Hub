import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "./custom/button";
import { loginFormSchema } from "@/lib/validations/auth";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLoginWithEmail } from "@/stores/server/features/auth/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { meQueryKeys } from "@/stores/server/features/me/queries";
import { USER_API } from "@/stores/server/features/me/apis";

interface Props {
  className?: string;
}

export function LoginFormSimple({ className }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loginWithEmail = useLoginWithEmail();

  // URL에서 return_url 파라미터 확인 (OAuth 리디렉트용)
  const returnUrl = new URLSearchParams(window.location.search).get('return_url');

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    if (loginWithEmail.isPending) return;
    const result = await loginWithEmail.mutateAsync({
      email: values.email,
      password: values.password,
    });

    if (result.success) {
      toast.success("환영합니다. 거북스쿨입니다. 😄");

      // OAuth return_url이 있으면 해당 URL로 리디렉트
      if (returnUrl) {
        window.location.href = returnUrl;
        return;
      }

      // 사용자 정보를 가져와서 memberType에 따라 리다이렉트
      // fetchQuery를 사용하여 캐시 업데이트와 데이터 조회를 한 번에 처리 (중복 API 호출 방지)
      try {
        const user = await queryClient.fetchQuery({
          queryKey: meQueryKeys.all,
          queryFn: USER_API.fetchCurrentUserAPI,
          staleTime: 0, // 강제로 새로 가져오기
        });
        if (user?.memberType === "teacher") {
          navigate({ to: "/mentor" });
        } else if (user?.memberType === "parent") {
          navigate({ to: "/family" });
        } else {
          navigate({ to: "/" });
        }
      } catch {
        navigate({ to: "/" });
      }
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Form {...form}>
      <div className={cn("space-y-2", className)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input placeholder="이메일 주소" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>패스워드</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="패스워드"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={loginWithEmail.isPending}
          >
            로그인
          </Button>
        </form>
        {/* TODO: 소셜 로그인 기능 복구 시 아래 주석 해제 */}
        {/* <div className="space-y-2 pt-4">
          <GoogleLoginButton isPending={loginWithEmail.isPending} />
          <NaverLoginButton isPending={loginWithEmail.isPending} />
        </div> */}

        <div className="flex justify-center pt-4">
          <Link
            to="/auth/register"
            className="text-sm text-blue-500 hover:underline"
          >
            회원가입
          </Link>
        </div>
      </div>
    </Form>
  );
}
