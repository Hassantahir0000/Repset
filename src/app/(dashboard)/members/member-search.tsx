export function MemberSearch({ defaultValue }: { defaultValue: string }) {
  return (
    <form method="GET" action="/members" className="max-w-sm">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search by name, phone, email, or code"
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      />
    </form>
  );
}
