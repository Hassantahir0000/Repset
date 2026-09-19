import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/generated/prisma/enums";

const VARIANT: Record<InvoiceStatus, "success" | "info" | "secondary" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  ISSUED: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={VARIANT[status]}>{status.replace("_", " ")}</Badge>;
}
