"use client";

import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui/primitives";
import { ApiError } from "@toolbox/api-client";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api().auth.login({ email, password });
      // Refresh the session cache so every consumer (sidebar, guards,
      // favorites) reflects the logged-in state immediately.
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      // Never lose the user's context after login (spec §36).
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-[360px] flex-col justify-center px-6 py-12">
      <h1 className="text-center text-[22px] font-semibold text-foreground">欢迎回来</h1>
      <p className="mt-1 text-center text-[13px] text-secondary-text">登录 ToolBox</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">邮箱</span>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">密码</span>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="text-[13px] text-error">{error}</p>}

        <Button variant="primary" type="submit" loading={loading} className="w-full">
          登录
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-text">
        还没有账号？
        <Link href="/register" className="text-accent hover:underline">
          注册新账号
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
