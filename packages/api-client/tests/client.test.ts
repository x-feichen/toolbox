import { describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "../src/client";

function clientWith(responses: Array<{ status: number; body: unknown }>) {
  const calls: RequestInit[] = [];
  const impl = vi.fn(async (_url: string, init: RequestInit = {}) => {
    calls.push(init);
    const next = responses.shift() ?? { status: 500, body: null };
    // A 204 response must not carry a body per the fetch spec.
    const payload = next.status === 204 ? null : JSON.stringify(next.body);
    return new Response(payload, {
      status: next.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { client: new ApiClient({ baseUrl: "http://api.test", fetch: impl }), calls };
}

describe("ApiClient", () => {
  it("parses structured API errors with stable codes", async () => {
    const { client } = clientWith([
      { status: 401, body: { error: { code: "AUTH_REQUIRED", message: "请登录" } } },
    ]);
    const err = await client.auth.me().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("AUTH_REQUIRED");
    expect(err.status).toBe(401);
  });

  it("sends credentials and JSON content type on POST", async () => {
    const { client, calls } = clientWith([
      { status: 200, body: { id: "u1", email: "a@b.c" } },
    ]);
    await client.auth.login({ email: "a@b.c", password: "pw" });
    expect(calls[0].credentials).toBe("include");
    expect((calls[0].headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("resolves 204 responses to undefined without parsing", async () => {
    const { client } = clientWith([{ status: 204, body: null }]);
    await expect(client.auth.logout()).resolves.toBeUndefined();
  });

  it("normalizes unknown failures to INTERNAL_ERROR", async () => {
    const { client } = clientWith([{ status: 502, body: null }]);
    const err = await client.tools.list().catch((e) => e);
    expect(err.code).toBe("INTERNAL_ERROR");
  });
});
