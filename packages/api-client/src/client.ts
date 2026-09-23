import type {
  ApiErrorBody,
  Favorite,
  HistoryEntry,
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
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
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
