import { Input } from "@/components/ui/input";

export function MemberSearch({ defaultValue, status }: { defaultValue: string; status: string }) {
  return (
    <form method="GET" action="/members" className="min-w-[220px] flex-1 sm:max-w-xs">
      {status && <input type="hidden" name="status" value={status} />}
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search name, phone, email, or code"
      />
    </form>
  );
}
