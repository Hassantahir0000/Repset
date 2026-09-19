"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

export function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <>
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-2.5 pt-4 pb-1.5 font-mono text-[10px] tracking-[0.1em] text-[#5C5C64]">
            {group.label}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-[0_10px_22px_-14px_rgba(232,70,42,0.95)]"
                      : "text-[#A6A6AE] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
