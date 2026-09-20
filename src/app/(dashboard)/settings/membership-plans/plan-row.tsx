import { PlanActiveToggle } from "./plan-active-toggle";

type Plan = {
  id: string;
  name: string;
  branch: { name: string } | null;
  durationType: string;
  durationDays: number;
  price: { toString(): string };
  isActive: boolean;
};

export function PlanRow({ plan, currency, memberCount }: { plan: Plan; currency: string; memberCount: number }) {
  return (
    <tr className="hover:bg-muted/60">
      <td className="px-4.5 py-2.5 font-medium">{plan.name}</td>
      <td className="px-4.5 py-2.5 text-muted-foreground">{plan.branch?.name ?? "All branches"}</td>
      <td className="px-4.5 py-2.5 text-muted-foreground">
        {plan.durationDays} days ({plan.durationType.toLowerCase()})
      </td>
      <td className="px-4.5 py-2.5 font-mono text-xs">
        {currency} {plan.price.toString()}
      </td>
      <td className="px-4.5 py-2.5 text-muted-foreground">{memberCount}</td>
      <td className="px-4.5 py-2.5">
        <PlanActiveToggle planId={plan.id} isActive={plan.isActive} />
      </td>
    </tr>
  );
}
