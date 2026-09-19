"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { checkInByMemberCode } from "@/features/attendance/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Result = { allowed: boolean; message: string } | null;

export function CheckInDesk() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setIsSubmitting(true);

    const response = await checkInByMemberCode({ memberCode: code.trim() });

    setIsSubmitting(false);
    setCode("");
    inputRef.current?.focus();

    if (!response.success) {
      setResult({ allowed: false, message: response.error });
      return;
    }
    setResult({ allowed: true, message: `${response.data.memberName} — checked in` });
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            autoFocus
            placeholder="Scan or type member code (e.g. GM-00001)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" disabled={isSubmitting}>
            Check in
          </Button>
        </form>

        {result && (
          <div
            className={
              result.allowed
                ? "rounded-xl border border-[#BFE0CC] bg-[#EAF5EE] p-4 text-[#1F7A4D]"
                : "rounded-xl border border-[#F5CFC5] bg-[#FDF1EE] p-4 text-[#C23B22]"
            }
          >
            <div className="text-[15px] font-semibold">
              {result.allowed ? "Allowed" : "Denied"} — {result.message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
