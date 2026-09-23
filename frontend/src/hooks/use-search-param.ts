"use client";

import { useEffect, useState } from "react";

/** Read a query param after mount (avoids useSearchParams Suspense requirements). */
export function useSearchParam(key: string): string {
  const [value, setValue] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key) ?? "");
  }, [key]);

  return value;
}
