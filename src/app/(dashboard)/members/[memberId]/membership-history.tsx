import { Badge } from "@/components/ui/badge";
import type { MembershipStatus } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/format";

const STATUS_VARIANT: Record<MembershipStatus, "success" | "info" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "success",
  FROZEN: "info",
  PENDING: "warning",
  EXPIRED: "secondary",
  CANCELLED: "destructive",
};

type HistoryItem = {
  id: string;
  status: MembershipStatus;
  startDate: Date;
  endDate: Date;
  priceAtPurchase: { toString(): string };
  plan: { name: string };
};

export function MembershipHistory({ history, currency }: { history: HistoryItem[]; currency: string }) {
  if (history.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(20,20,26,0.03)]">
      <div className="border-b border-border px-4.5 py-3 text-[14.5px] font-semibold">Membership history</div>
      <ul className="divide-y divide-border">
        {history.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-4.5 py-3 text-sm">
            <div>
              <div className="font-medium">{m.plan.name}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {m.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} &rarr;{" "}
                {m.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} &middot;{" "}
                {formatMoney(currency, Number(m.priceAtPurchase))}
              </div>
            </div>
            <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
