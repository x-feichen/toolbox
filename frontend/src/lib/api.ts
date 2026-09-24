import { ApiClient } from "@toolbox/api-client";

/**
 * API base URL.
 *
 * Defaults to a RELATIVE path (""), i.e. same-origin: the browser calls
 * /api/v1/* on whatever host serves the app, and the reverse proxy (nginx)
 * forwards it to the backend. This makes any deployment host/IP work without
 * a rebuild.
 *
 * Set NEXT_PUBLIC_API_URL only when the API lives on a different origin
 * (e.g. a CDN-hosted frontend with a standalone API domain).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

let client: ApiClient | null = null;

export function api(): ApiClient {
  if (!client) {
    client = new ApiClient({ baseUrl: API_URL });
  }
  return client;
}
