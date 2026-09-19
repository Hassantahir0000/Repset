import { Badge } from "@/components/ui/badge";
import type { MemberStatus } from "@/generated/prisma/enums";

const VARIANT: Record<MemberStatus, "success" | "info" | "secondary"> = {
  ACTIVE: "success",
  FROZEN: "info",
  INACTIVE: "secondary",
};

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return <Badge variant={VARIANT[status]}>{status}</Badge>;
}
