import Link from "next/link";
import { cn } from "cn";

export type SegmentedLink = { label: string; href: string; active: boolean };

/** The pill-shaped segmented control used for period and filter switching. */
export function SegmentedLinks({ items, className }: { items: SegmentedLink[]; className?: string }) {
  return (
    <div className={cn("flex gap-1 rounded-full bg-secondary p-[3px]", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
            item.active
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
