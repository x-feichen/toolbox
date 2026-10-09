"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

/** Circular avatar with a first-letter fallback when no image / load failure. */
export function Avatar({ src, name, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const initial = name.slice(0, 1).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-[12px] font-medium text-accent",
        className,
      )}
    >
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="头像"
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}
