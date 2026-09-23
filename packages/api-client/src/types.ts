/**
 * ToolBox API types — mirrors the FastAPI Pydantic schemas.
 *
 * Long-term these should be generated from /openapi.json (openapi-typescript);
 * they are hand-maintained for the MVP and kept structurally identical.
 */

export type ToolAccess = "public" | "authenticated";
export type ToolExecution = "client" | "server" | "hybrid";
export type ToolUI = "form" | "editor" | "upload" | "viewer" | "custom";
export type ToolCategory = "developer" | "text" | "data" | "image" | "ai" | "other";

export interface User {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  status: "active" | "disabled";
  created_at: string;
}

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  tags: string[];
  icon: string | null;
  version: string;
  status: "draft" | "beta" | "stable" | "deprecated";
  access: ToolAccess;
  execution: ToolExecution;
  ui: ToolUI;
  requires_auth: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string;
  category: string;
  is_pinned: boolean;
  pinned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptInput {
  title: string;
  content?: string;
  description?: string;
  category?: string;
}

export interface PromptPatch {
  title?: string;
  content?: string;
  description?: string;
  category?: string;
  is_pinned?: boolean;
}

export interface Favorite {
  tool_slug: string;
  created_at: string;
}

export interface HistoryEntry {
  tool_slug: string;
  executed_at: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
