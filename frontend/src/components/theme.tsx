"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "toolbox-theme";

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    applyTheme(stored);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme((localStorage.getItem(STORAGE_KEY) as Theme) ?? "system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

const THEME_ORDER: Theme[] = ["light", "dark", "system"];
const THEME_LABELS: Record<Theme, string> = { light: "浅色", dark: "深色", system: "跟随系统" };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const cycle = () => setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]);
  return (
    <button
      onClick={cycle}
      title={`主题：${THEME_LABELS[theme]}`}
      aria-label={`主题：${THEME_LABELS[theme]}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-secondary-text hover:bg-muted hover:text-foreground"
    >
      <span className="text-xs font-medium">{THEME_LABELS[theme].slice(0, 1)}</span>
    </button>
  );
}
