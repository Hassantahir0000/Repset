import { useId } from "react";
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
