import { ApiClient } from "@toolbox/api-client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

let client: ApiClient | null = null;

export function api(): ApiClient {
  if (!client) {
    client = new ApiClient({ baseUrl: API_URL });
  }
  return client;
}
