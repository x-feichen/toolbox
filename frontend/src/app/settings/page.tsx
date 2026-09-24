"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { useTools } from "@/features/tools/use-tools";
import { api } from "@/lib/api";
import { isValidPasswordForm, validatePasswordForm } from "@/lib/settings/password-validation";
import type { PasswordFormErrors } from "@/lib/settings/password-validation";
import { compressAvatarImage } from "@/lib/images/avatar";
import { Button, Card, Input } from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { ApiError } from "@toolbox/api-client";
import { useEffect } from "react";

const TABS = [
  { key: "profile", label: "资料" },
  { key: "security", label: "安全" },
  { key: "tools", label: "工具" },
  { key: "ai", label: "AI" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function SettingsShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const tabParam = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam) ? tabParam! : "profile";

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/settings");
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-muted-text">
        Loading...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="mx-auto max-w-[860px] px-6 py-10">
      <h1 className="text-[22px] font-semibold text-foreground">设置</h1>

      <nav className="mt-6 flex gap-1 border-b border-border" role="tablist" aria-label="设置分类">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => router.replace(`/settings?tab=${tab.key}`)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] ${
              activeTab === tab.key
                ? "border-accent font-medium text-foreground"
                : "border-transparent text-secondary-text hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "tools" && <ToolsTab />}
        {activeTab === "ai" && <AiTab />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-muted-text">
          Loading...
        </div>
      }
    >
      <SettingsShell />
    </Suspense>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const avatarUrl = user?.avatar_url ?? null;
  const hasUploadedAvatar = Boolean(avatarUrl?.startsWith("/api/v1/avatars/"));

  const save = async () => {
    setSaving(true);
    try {
      await api().users.updateMe({ display_name: displayName.trim() || null });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      showToast("资料已保存");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setImageBroken(false);
    try {
      const compressed = await compressAvatarImage(file);
      await api().avatars.upload(compressed, avatarFilename(compressed.type));
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      showToast("头像已更新");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "头像上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      await api().avatars.remove();
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      showToast("已恢复默认头像");
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : "操作失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-medium text-foreground">个人资料</h2>
      <p className="mt-1 text-[13px] text-secondary-text">修改昵称与头像，这些信息会显示在侧边栏。</p>

      <div className="mt-5 flex max-w-md flex-col gap-4">
        {/* Avatar upload: compressed in the browser, never stored locally */}
        <div className="flex items-center gap-4">
          <Avatar
            src={imageBroken ? null : avatarUrl}
            name={user?.display_name ?? user?.email ?? "?"}
            className="size-14 text-[18px]"
          />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button loading={uploading} onClick={() => fileRef.current?.click()}>
                {avatarUrl && !imageBroken ? "更换头像" : "上传头像"}
              </Button>
              {hasUploadedAvatar && !imageBroken && (
                <Button variant="ghost" onClick={removeAvatar}>
                  恢复默认
                </Button>
              )}
            </div>
            <p className="text-[12px] text-muted-text">
              支持 JPG / PNG / WebP，上传前在浏览器内压缩到 512px（图片不会以原图上传）
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => onPickAvatar(event.target.files?.[0])}
              aria-label="选择头像图片"
            />
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">昵称</span>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.email}
            maxLength={100}
          />
        </label>

        <div>
          <Button variant="primary" loading={saving} onClick={save}>
            保存
          </Button>
        </div>
      </div>
    </Card>
  );
}

function avatarFilename(contentType: string): string {
  if (contentType === "image/png") return "avatar.png";
  if (contentType === "image/jpeg") return "avatar.jpg";
  return "avatar.webp";
}

function SecurityTab() {
  const { showToast } = useToast();
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validatePasswordForm(values);
    setErrors(nextErrors);
    if (!isValidPasswordForm(nextErrors)) return;

    setSaving(true);
    try {
      await api().auth.changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("密码已修改，其他设备的登录已退出");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "修改失败";
      setErrors({ currentPassword: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-medium text-foreground">修改密码</h2>
      <p className="mt-1 text-[13px] text-secondary-text">
        修改成功后，其他设备上的登录状态会被清除（当前设备保留）。
      </p>

      <form onSubmit={submit} className="mt-5 flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">当前密码</span>
          <Input
            type="password"
            value={values.currentPassword}
            onChange={(e) => setValues((v) => ({ ...v, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
          {errors.currentPassword && <span className="text-[12px] text-error">{errors.currentPassword}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">新密码（至少 8 位）</span>
          <Input
            type="password"
            value={values.newPassword}
            onChange={(e) => setValues((v) => ({ ...v, newPassword: e.target.value }))}
            autoComplete="new-password"
          />
          {errors.newPassword && <span className="text-[12px] text-error">{errors.newPassword}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">确认新密码</span>
          <Input
            type="password"
            value={values.confirmPassword}
            onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <span className="text-[12px] text-error">{errors.confirmPassword}</span>}
        </label>

        <div>
          <Button variant="primary" type="submit" loading={saving}>
            更新密码
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ToolsTab() {
  const { data: tools = [], isLoading } = useTools();
  const { user } = useAuth();

  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-medium text-foreground">工具配置</h2>
      <p className="mt-1 text-[13px] text-secondary-text">
        部分工具（如 AI 类）将支持按用户配置参数。配置能力即将上线。
      </p>

      <ul className="mt-5 divide-y divide-border">
        {isLoading ? (
          <li className="py-3 text-[13px] text-muted-text">Loading...</li>
        ) : (
          tools.map((tool) => (
            <li key={tool.slug} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{tool.name}</p>
                <p className="truncate text-[12px] text-muted-text">{tool.description}</p>
              </div>
              <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-text">
                即将支持配置
              </span>
            </li>
          ))
        )}
      </ul>

      {user?.role === "admin" && (
        <div className="mt-6 border-t border-border pt-4">
          <Link href="/admin/users" className="text-[13px] text-accent hover:underline">
            前往用户管理 →
          </Link>
        </div>
      )}
    </Card>
  );
}

function AiTab() {
  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-medium text-foreground">AI 供应商</h2>
      <p className="mt-1 text-[13px] text-secondary-text">
        未来可在此配置 AI 供应商与 API Key。功能即将上线，暂不保存任何内容。
      </p>

      <div className="mt-5 flex max-w-md flex-col gap-4 opacity-60">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">供应商</span>
          <select
            disabled
            aria-label="AI 供应商"
            className="h-9 rounded-sm border border-border bg-panel px-2 text-[13px] text-foreground"
          >
            <option>OpenAI（即将支持）</option>
            <option>Anthropic（即将支持）</option>
            <option>自定义兼容接口（即将支持）</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-secondary-text">API Key</span>
          <Input type="password" disabled placeholder="即将支持" />
        </label>
        <div>
          <Button disabled>保存配置</Button>
        </div>
      </div>
    </Card>
  );
}
