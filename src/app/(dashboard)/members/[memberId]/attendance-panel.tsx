"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordCheckIn, recordCheckOut } from "@/features/attendance/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AttendanceItem = {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AttendancePanel({
  memberId,
  openAttendanceId,
  recent,
}: {
  memberId: string;
  openAttendanceId: string | null;
  recent: AttendanceItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      const result = await recordCheckIn({ memberId });
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Checked in");
      router.refresh();
    });
  }

  function handleCheckOut() {
    if (!openAttendanceId) return;
    setError(null);
    startTransition(async () => {
      const result = await recordCheckOut(openAttendanceId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      toast.success("Checked out");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[14.5px] font-semibold">Attendance</div>
          {openAttendanceId ? (
            <Button size="sm" variant="outline" onClick={handleCheckOut} disabled={isPending}>
              Check out
            </Button>
          ) : (
            <Button size="sm" onClick={handleCheckIn} disabled={isPending}>
              Check in
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(a.checkInAt)}
                  {a.checkOutAt && ` → ${formatDateTime(a.checkOutAt)}`}
                </span>
                {!a.checkOutAt && <Badge variant="success">In gym</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
