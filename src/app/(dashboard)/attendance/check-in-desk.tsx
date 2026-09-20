"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { checkInByMemberCode, type CheckInOutcome } from "@/features/attendance/actions";
import { MemberAvatar } from "@/components/member-avatar";
import { formatMoney } from "@/lib/format";

type DeskResult = { kind: "outcome"; outcome: CheckInOutcome } | { kind: "error"; message: string };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CheckInDesk({ currency }: { currency: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<DeskResult | null>(null);
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
      setResult({ kind: "error", message: response.error });
      toast.error(response.error);
      return;
    }

    setResult({ kind: "outcome", outcome: response.data });
    if (response.data.decision === "allowed") {
      toast.success(`${response.data.member.firstName} checked in`);
      router.refresh();
    } else {
      toast.error(response.data.reason ?? "Check-in denied");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#16161A] p-6 text-center text-white shadow-[0_1px_2px_rgba(20,20,26,0.06),0_24px_48px_-32px_rgba(20,20,26,1)]">
        <div className="flex aspect-square w-full max-w-[250px] items-center justify-center rounded-[18px] border-2 border-dashed border-[#3A3A42] bg-[repeating-linear-gradient(45deg,#1B1B20,#1B1B20_8px,#202026_8px,#202026_16px)]">
          <span className="px-6 font-mono text-[11px] leading-relaxed text-[#6B6B73]">
            SCANNER INPUT
          </span>
        </div>
        <div className="text-lg font-bold tracking-tight">Scan a member card</div>
        <p className="max-w-[280px] text-[13px] leading-relaxed text-[#9A9AA2]">
          Barcode and QR scanners type the code straight into the box below. You can also enter a
          member code by hand.
        </p>
        <form onSubmit={handleSubmit} className="flex w-full max-w-[330px] gap-2">
          <input
            ref={inputRef}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Member code, e.g. GM-00001"
            aria-label="Member code"
            className="min-w-0 flex-1 rounded-[10px] border border-[#2E2E35] bg-[#1B1B20] px-3.5 py-3 text-sm text-[#F2F1EF] outline-none placeholder:text-[#6B6B73] focus:border-[#5A5A64]"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-none rounded-[10px] bg-primary px-4.5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Check in
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3.5">
        {result === null && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            Scan a card to see whether the member is cleared to train.
          </div>
        )}

        {result?.kind === "error" && (
          <div className="rounded-2xl border border-[#F5CFC5] bg-[#FDF1EE] p-4.5">
            <div className="text-[17px] font-bold tracking-tight text-[#C23B22]">Not recognised</div>
            <div className="mt-1 text-[13px] text-[#96432C]">{result.message}</div>
          </div>
        )}

        {result?.kind === "outcome" && <OutcomeCard outcome={result.outcome} currency={currency} />}
      </div>
    </div>
  );
}

function OutcomeCard({ outcome, currency }: { outcome: CheckInOutcome; currency: string }) {
  const name = `${outcome.member.firstName} ${outcome.member.lastName}`;
  const allowed = outcome.decision === "allowed";

  if (allowed) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl border border-[#BFE0CC] bg-[#EAF5EE] p-4.5">
        <MemberAvatar
          firstName={outcome.member.firstName}
          lastName={outcome.member.lastName}
          photoUrl={outcome.member.photoUrl}
          size="lg"
        />
        <div className="min-w-0">
          <div className="text-[17px] font-bold tracking-tight">{name} — allowed</div>
          <div className="mt-1 text-[13px] text-[#1F7A4D]">
            {outcome.membership
              ? `${outcome.membership.planName} · valid to ${formatDate(outcome.membership.endDate)}`
              : "Checked in"}
            {" · "}
            {outcome.visitsThisWeek} visit{outcome.visitsThisWeek === 1 ? "" : "s"} this week
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F5CFC5] bg-[#FDF1EE] p-4.5">
      <div className="flex items-center gap-3.5">
        <MemberAvatar
          firstName={outcome.member.firstName}
          lastName={outcome.member.lastName}
          photoUrl={outcome.member.photoUrl}
          size="lg"
        />
        <div className="min-w-0">
          <div className="text-[17px] font-bold tracking-tight text-[#C23B22]">{name} — denied</div>
          <div className="mt-1 text-[13px] text-[#96432C]">
            {outcome.reason}
            {outcome.outstandingBalance > 0 &&
              ` · ${formatMoney(currency, outcome.outstandingBalance)} outstanding`}
          </div>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link
          href={`/members/${outcome.member.id}`}
          className="rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-semibold text-primary-foreground hover:opacity-90"
        >
          Renew membership
        </Link>
        {outcome.outstandingBalance > 0 && (
          <Link
            href={`/members/${outcome.member.id}`}
            className="rounded-[9px] border border-[#E5C4BA] bg-card px-3.5 py-2 text-[12.5px] font-semibold hover:border-[#C23B22]"
          >
            Take payment
          </Link>
        )}
      </div>
    </div>
  );
}
