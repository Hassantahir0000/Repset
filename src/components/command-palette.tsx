"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { cn } from "cn";

type NavTarget = { href: string; label: string; group: string };

export function CommandPalette({ targets }: { targets: NavTarget[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return targets;
    return targets.filter(
      (t) => t.label.toLowerCase().includes(q) || t.group.toLowerCase().includes(q),
    );
  }, [targets, query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) go(target.href);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="mb-3.5 flex w-full items-center justify-between gap-2 rounded-[10px] border border-sidebar-border bg-sidebar-accent/40 px-2.75 py-2.25 text-[13px] text-[#9A9AA2] transition-colors hover:border-[#3A3A42] hover:text-[#F2F1EF]"
        >
          <span>Search anything</span>
          <span className="rounded-[5px] bg-[#26262C] px-1.5 py-0.5 font-mono text-[11px]">⌘K</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#121215]/42 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[18%] left-1/2 z-50 w-[92%] max-w-[480px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_50px_-28px_rgba(20,20,26,0.6)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">Quick navigation</Dialog.Title>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Jump to a page…"
            className="w-full border-b border-border bg-transparent px-4.5 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="max-h-[300px] overflow-y-auto p-1.5">
            {results.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</div>
            )}
            {results.map((t, i) => (
              <button
                key={t.href}
                type="button"
                onClick={() => go(t.href)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm",
                  i === activeIndex ? "bg-muted" : "",
                )}
              >
                <span className="font-medium">{t.label}</span>
                <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                  {t.group}
                </span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
