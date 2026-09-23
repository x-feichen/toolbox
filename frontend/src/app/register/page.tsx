"use client";

import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui/primitives";
import { ApiError } from "@toolbox/api-client";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api().auth.register({
        email,
        password,
        display_name: displayName || undefined,
      });
      // Auto-login after registration; refresh the session cache so the
      // whole UI reflects the logged-in state immediately.
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-[360px] flex-col justify-center px-6 py-12">
      <h1 className="text-center text-[22px] font-semibold text-foreground">创建账号</h1>
      <p className="mt-1 text-center text-[13px] text-secondary-text">开始使用 ToolBox</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">昵称（可选）</span>
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="你的昵称"
            maxLength={100}
          />
        </label>
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
          <span className="text-[13px] text-secondary-text">密码（至少 8 位）</span>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="text-[13px] text-error">{error}</p>}

        <Button variant="primary" type="submit" loading={loading} className="w-full">
          创建账号
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-text">
        已有账号？
        <Link href="/login" className="text-accent hover:underline">
          直接登录
        </Link>
      </p>
    </div>
  );
}
