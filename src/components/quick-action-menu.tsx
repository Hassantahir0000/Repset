"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function QuickActionMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#16161A] text-white shadow-[0_8px_20px_-12px_rgba(22,22,26,0.9)] hover:bg-[#16161A]/90">
          Quick action
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href="/members/new">+ Add member</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/attendance">Check in a member</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
