import Link from "next/link";
import { listMembers } from "@/features/members/queries";
import { MemberSearch } from "./member-search";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const members = await listMembers(q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">{members.length} shown</p>
        </div>
        <Link
          href="/members/new"
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Add member
        </Link>
      </div>

      <MemberSearch defaultValue={q ?? ""} />

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Member</th>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/members/${member.id}`} className="flex items-center gap-2">
                    {member.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </span>
                    )}
                    <span className="font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-500">{member.memberCode}</td>
                <td className="px-4 py-2 text-gray-500">{member.branch.name}</td>
                <td className="px-4 py-2 text-gray-500">{member.phone}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={member.status} />
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "ACTIVE" | "INACTIVE" | "FROZEN" }) {
  const styles: Record<typeof status, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-gray-100 text-gray-500",
    FROZEN: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{status}</span>
  );
}
