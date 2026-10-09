"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api";
import type { AdminUser } from "@toolbox/api-client";
import { ApiError } from "@toolbox/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { MIN_PASSWORD_LENGTH } from "@/lib/settings/password-validation";
import { KeyRound, Search, Shield, UserCheck, UserX } from "lucide-react";

const PAGE_SIZE = 20;

type DialogState =
  | { kind: "reset-password"; user: AdminUser }
  | { kind: "toggle-role"; user: AdminUser }
  | { kind: "toggle-status"; user: AdminUser }
  | null;

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: me, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  // debounce search input → query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    if (!authLoading && (!me || me.role !== "admin")) router.replace("/");
  }, [authLoading, me, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search, roleFilter, statusFilter, page],
    queryFn: () =>
      api().admin.users.list({
        q: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        page_size: PAGE_SIZE,
      }),
    enabled: me?.role === "admin",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { role?: "user" | "admin"; status?: "active" | "disabled" } }) =>
      api().admin.users.update(id, patch),
    onSuccess: () => {
      invalidate();
      setDialog(null);
      showToast("已更新");
    },
    onError: (error) => showToast(error instanceof ApiError ? error.message : "操作失败"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api().admin.users.resetPassword(id, newPassword),
    onSuccess: () => {
      invalidate();
      setDialog(null);
      showToast("密码已重置，该用户需重新登录");
    },
    onError: (error) => showToast(error instanceof ApiError ? error.message : "重置失败"),
  });

  if (authLoading || me?.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-muted-text">
        Loading...
      </div>
    );
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="text-[22px] font-semibold text-foreground">用户管理</h1>
      <p className="mt-1 text-[13px] text-secondary-text">管理注册用户的角色与登录状态。</p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-[260px]">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-text" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索邮箱或昵称…"
            aria-label="搜索用户"
            className="pl-8"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as typeof roleFilter);
            setPage(1);
          }}
          aria-label="按角色过滤"
          className="h-9 rounded-sm border border-border bg-panel px-2 text-[13px] text-foreground"
        >
          <option value="all">全部角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(1);
          }}
          aria-label="按状态过滤"
          className="h-9 rounded-sm border border-border bg-panel px-2 text-[13px] text-foreground"
        >
          <option value="all">全部状态</option>
          <option value="active">正常</option>
          <option value="disabled">已禁用</option>
        </select>
        <span className="ml-auto text-[12px] text-muted-text">共 {total} 位用户</span>
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-[12px] text-secondary-text">
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">注册时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-text">
                  Loading...
                </td>
              </tr>
            ) : (
              (data?.items ?? []).map((user) => {
                const isSelf = user.id === me.id;
                return (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {user.display_name || user.email}
                        {isSelf && <span className="ml-2 text-[11px] text-muted-text">（当前账号）</span>}
                      </p>
                      <p className="text-[12px] text-muted-text">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === "admin" ? (
                        <Badge tone="accent">
                          <Shield className="size-3" aria-hidden />
                          管理员
                        </Badge>
                      ) : (
                        <span className="text-secondary-text">普通用户</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.status === "active" ? (
                        <span className="text-success">正常</span>
                      ) : (
                        <span className="text-muted-text">已禁用</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-text">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" onClick={() => setDialog({ kind: "reset-password", user })}>
                          <KeyRound className="size-3.5" aria-hidden />
                          重置密码
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={isSelf}
                          title={isSelf ? "不能修改自己的角色" : undefined}
                          onClick={() => setDialog({ kind: "toggle-role", user })}
                        >
                          {user.role === "admin" ? "取消管理员" : "设为管理员"}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={isSelf}
                          title={isSelf ? "不能禁用自己" : undefined}
                          onClick={() => setDialog({ kind: "toggle-status", user })}
                        >
                          {user.status === "active" ? (
                            <>
                              <UserX className="size-3.5" aria-hidden />
                              禁用
                            </>
                          ) : (
                            <>
                              <UserCheck className="size-3.5" aria-hidden />
                              启用
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3 text-[13px] text-secondary-text">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}

      {dialog && (
        <Dialog
          dialog={dialog}
          onClose={() => setDialog(null)}
          onConfirmRole={(role) =>
            updateMutation.mutate({ id: dialog.user.id, patch: { role } })
          }
          onConfirmStatus={(status) =>
            updateMutation.mutate({ id: dialog.user.id, patch: { status } })
          }
          onResetPassword={(newPassword) =>
            resetPasswordMutation.mutate({ id: dialog.user.id, newPassword })
          }
          pending={updateMutation.isPending || resetPasswordMutation.isPending}
        />
      )}
    </div>
  );
}

function Dialog({
  dialog,
  onClose,
  onConfirmRole,
  onConfirmStatus,
  onResetPassword,
  pending,
}: {
  dialog: NonNullable<DialogState>;
  onClose: () => void;
  onConfirmRole: (role: "user" | "admin") => void;
  onConfirmStatus: (status: "active" | "disabled") => void;
  onResetPassword: (newPassword: string) => void;
  pending: boolean;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const user = dialog.user;
  const target = user.display_name || user.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-[min(420px,92vw)] rounded-lg border border-border bg-panel p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {dialog.kind === "reset-password" && (
          <>
            <h2 className="text-[15px] font-medium text-foreground">重置 {target} 的密码</h2>
            <p className="mt-1 text-[13px] text-secondary-text">
              重置后该用户在所有设备上的登录状态都会失效，需使用新密码重新登录。
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`新密码（至少 ${MIN_PASSWORD_LENGTH} 位）`}
                aria-label="新密码"
                autoFocus
              />
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="确认新密码"
                aria-label="确认新密码"
              />
              {localError && <p className="text-[12px] text-error">{localError}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button
                variant="primary"
                loading={pending}
                onClick={() => {
                  if (newPassword.length < MIN_PASSWORD_LENGTH) {
                    setLocalError(`新密码至少 ${MIN_PASSWORD_LENGTH} 位`);
                    return;
                  }
                  if (newPassword !== confirm) {
                    setLocalError("两次输入的新密码不一致");
                    return;
                  }
                  onResetPassword(newPassword);
                }}
              >
                确认重置
              </Button>
            </div>
          </>
        )}

        {dialog.kind === "toggle-role" && (
          <>
            <h2 className="text-[15px] font-medium text-foreground">
              {user.role === "admin" ? "取消管理员权限" : "设为管理员"}
            </h2>
            <p className="mt-1 text-[13px] text-secondary-text">
              {user.role === "admin"
                ? `确认取消 ${target} 的管理员权限？其后将只能访问普通用户功能。`
                : `确认将 ${target} 设为管理员？管理员可以管理所有用户。`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button
                variant="primary"
                loading={pending}
                onClick={() => onConfirmRole(user.role === "admin" ? "user" : "admin")}
              >
                确认
              </Button>
            </div>
          </>
        )}

        {dialog.kind === "toggle-status" && (
          <>
            <h2 className="text-[15px] font-medium text-foreground">
              {user.status === "active" ? `禁用 ${target}` : `启用 ${target}`}
            </h2>
            <p className="mt-1 text-[13px] text-secondary-text">
              {user.status === "active"
                ? "禁用后该用户将无法登录，已有会话也会失效。"
                : "启用后该用户可以重新登录。"}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button
                variant={user.status === "active" ? "destructive" : "primary"}
                loading={pending}
                onClick={() => onConfirmStatus(user.status === "active" ? "disabled" : "active")}
              >
                确认
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
