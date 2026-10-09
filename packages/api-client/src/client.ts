import type {
  AdminUser,
  AdminUserQuery,
  ApiErrorBody,
  DailySummariesResponse,
  DailySummary,
  Favorite,
  HistoryEntry,
  Paginated,
  Prompt,
  PromptInput,
  PromptPatch,
  Tool,
  User,
} from "./types";

export * from "./types";

/** Machine-readable API error; branch on `code`, never on message text. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor({ baseUrl, fetch: fetchImpl = fetch.bind(globalThis) }: ApiClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    // Bind the fetch implementation: window.fetch invoked as a method loses
    // its `window` receiver and throws "Illegal invocation".
    this.fetchImpl = fetchImpl.bind(globalThis);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    // FormData bodies must NOT carry a Content-Type header — the browser
    // adds it together with the multipart boundary.
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const err = (body as ApiErrorBody | null)?.error;
      throw new ApiError(
        err?.code ?? "INTERNAL_ERROR",
        err?.message ?? "服务暂时不可用",
        response.status,
      );
    }
    return body as T;
  }

  // ── Auth ────────────────────────────────────────────────────────────────
  auth = {
    register: (input: { email: string; password: string; display_name?: string }) =>
      this.request<User>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(input) }),
    login: (input: { email: string; password: string }) =>
      this.request<User>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) }),
    logout: () => this.request<void>("/api/v1/auth/logout", { method: "POST" }),
    me: () => this.request<User>("/api/v1/auth/me"),
    changePassword: (input: { current_password: string; new_password: string }) =>
      this.request<void>("/api/v1/auth/me/password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  };

  // ── Users (self) ───────────────────────────────────────────────────────
  users = {
    updateMe: (input: { display_name?: string | null; avatar_url?: string | null }) =>
      this.request<User>("/api/v1/me", { method: "PATCH", body: JSON.stringify(input) }),
  };

  // ── Avatars ─────────────────────────────────────────────────────────────
  avatars = {
    /** Upload a compressed image (JPG/PNG/WebP) and return the updated user. */
    upload: (file: Blob, filename = "avatar.webp") => {
      const form = new FormData();
      form.append("file", file, filename);
      return this.request<User>("/api/v1/avatars", { method: "POST", body: form });
    },
    remove: () => this.request<void>("/api/v1/avatars", { method: "DELETE" }),
  };

  // ── Daily News（只读 Horizon 库；未配置数据源时后端返回 503）───────────
  dailyNews = {
    list: (opts: { language?: string; limit?: number; offset?: number } = {}) => {
      const params = new URLSearchParams();
      if (opts.language) params.set("language", opts.language);
      if (opts.limit != null) params.set("limit", String(opts.limit));
      if (opts.offset != null) params.set("offset", String(opts.offset));
      const qs = params.toString();
      return this.request<DailySummariesResponse>(
        `/api/v1/daily-news/summaries${qs ? `?${qs}` : ""}`,
      );
    },
    get: (id: number) => this.request<DailySummary>(`/api/v1/daily-news/summary/${id}`),
  };

  // ── Admin (admin role only) ────────────────────────────────────────────
  admin = {
    users: {
      list: (query: AdminUserQuery = {}) => {
        const search = new URLSearchParams();
        if (query.q) search.set("q", query.q);
        if (query.role) search.set("role", query.role);
        if (query.status) search.set("status", query.status);
        if (query.page) search.set("page", String(query.page));
        if (query.page_size) search.set("page_size", String(query.page_size));
        const qs = search.toString();
        return this.request<Paginated<AdminUser>>(`/api/v1/admin/users${qs ? `?${qs}` : ""}`);
      },
      get: (id: string) => this.request<AdminUser>(`/api/v1/admin/users/${id}`),
      update: (id: string, patch: { role?: "user" | "admin"; status?: "active" | "disabled" }) =>
        this.request<AdminUser>(`/api/v1/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        }),
      resetPassword: (id: string, newPassword: string) =>
        this.request<void>(`/api/v1/admin/users/${id}/password`, {
          method: "POST",
          body: JSON.stringify({ new_password: newPassword }),
        }),
    },
  };

  // ── Tools ───────────────────────────────────────────────────────────────
  tools = {
    list: () => this.request<Tool[]>("/api/v1/tools"),
    get: (slug: string) => this.request<Tool>(`/api/v1/tools/${slug}`),
    execute: (slug: string, action: string, payload: Record<string, unknown> = {}) =>
      this.request<{ result: Record<string, unknown> }>(`/api/v1/tools/${slug}/execute`, {
        method: "POST",
        body: JSON.stringify({ action, payload }),
      }),
  };

  // ── Prompts ─────────────────────────────────────────────────────────────
  prompts = {
    list: (params: { q?: string; category?: string; favorite?: boolean } = {}) => {
      const search = new URLSearchParams();
      if (params.q) search.set("q", params.q);
      if (params.category) search.set("category", params.category);
      if (params.favorite !== undefined) search.set("favorite", String(params.favorite));
      const qs = search.toString();
      return this.request<Prompt[]>(`/api/v1/prompts${qs ? `?${qs}` : ""}`);
    },
    categories: () => this.request<string[]>("/api/v1/prompts/categories"),
    create: (input: PromptInput) =>
      this.request<Prompt>("/api/v1/prompts", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, patch: PromptPatch) =>
      this.request<Prompt>(`/api/v1/prompts/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) =>
      this.request<void>(`/api/v1/prompts/${id}`, { method: "DELETE" }),
  };

  // ── Favorites ───────────────────────────────────────────────────────────
  favorites = {
    list: () => this.request<Favorite[]>("/api/v1/favorites"),
    add: (toolSlug: string) =>
      this.request<Favorite>("/api/v1/favorites", {
        method: "POST",
        body: JSON.stringify({ tool_slug: toolSlug }),
      }),
    remove: (toolSlug: string) =>
      this.request<void>(`/api/v1/favorites/${toolSlug}`, { method: "DELETE" }),
  };

  // ── History ─────────────────────────────────────────────────────────────
  history = {
    list: (limit = 20) => this.request<HistoryEntry[]>(`/api/v1/history?limit=${limit}`),
    recent: (limit = 8) => this.request<string[]>(`/api/v1/history/recent?limit=${limit}`),
    record: (toolSlug: string) =>
      this.request<HistoryEntry>("/api/v1/history", {
        method: "POST",
        body: JSON.stringify({ tool_slug: toolSlug }),
      }),
    clear: () => this.request<void>("/api/v1/history", { method: "DELETE" }),
  };
}
