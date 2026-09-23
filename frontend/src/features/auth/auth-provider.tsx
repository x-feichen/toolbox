"use client";

import { api } from "@/lib/api";
import type { User } from "@toolbox/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, isLoading: true });

/**
 * Session state is derived from GET /auth/me (HttpOnly cookie); the client
 * never touches the session itself. This is UX state only — the backend
 * re-verifies every protected request.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api().auth.me(),
    retry: false,
    staleTime: 60_000,
  });

  const user = data ?? null;
  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function useResetAuth() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
}
