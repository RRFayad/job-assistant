"use client";

// PROTOTYPE ONLY — throwaway UI-comparison tool, not part of the product.
// Do not ship this to production; drop it once a variant is chosen.

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn, tw } from "@/lib/utils";

type PrototypeVariant = {
  key: string;
  label: string;
};

type PrototypeSwitcherProps = {
  tag: string;
  paramName: string;
  variants: PrototypeVariant[];
  offsetClassName?: string;
};

const styles = {
  bar: tw(
    "fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-amber-400/60 bg-black/90 px-2 py-1.5 text-white shadow-lg backdrop-blur",
  ),
  tag: tw(
    "mr-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-300 uppercase",
  ),
  arrow: tw(
    "flex size-7 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white",
  ),
  label: tw("min-w-44 px-1 text-center text-xs font-medium"),
};

export const PrototypeSwitcher = ({
  tag,
  paramName,
  variants,
  offsetClassName,
}: PrototypeSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentKey = searchParams.get(paramName) ?? variants[0].key;
  const currentIndex = Math.max(
    variants.findIndex((v) => v.key === currentKey),
    0,
  );

  const go = useCallback(
    (nextIndex: number) => {
      const wrapped = (nextIndex + variants.length) % variants.length;
      const params = new URLSearchParams(searchParams.toString());
      params.set(paramName, variants[wrapped].key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, paramName, router, searchParams, variants],
  );

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTyping) return;
      if (event.key === "ArrowLeft") go(currentIndex - 1);
      if (event.key === "ArrowRight") go(currentIndex + 1);
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentIndex, go]);

  if (process.env.NODE_ENV === "production") return null;

  const current = variants[currentIndex];

  return (
    <div className={cn(styles.bar, offsetClassName)}>
      <span className={styles.tag}>{tag}</span>
      <button
        aria-label="Previous variant"
        className={styles.arrow}
        onClick={() => go(currentIndex - 1)}
        type="button"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <span className={styles.label}>
        {current.key} — {current.label}
      </span>
      <button
        aria-label="Next variant"
        className={styles.arrow}
        onClick={() => go(currentIndex + 1)}
        type="button"
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </div>
  );
};
