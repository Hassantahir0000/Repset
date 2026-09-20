import { cookies } from "next/headers";

// An org-wide role (activeBranchId === null in the session) can narrow
// their view to a single branch via this cookie. It only ever narrows —
// getTenantContext() still validates the value against the session's own
// accessibleBranchIds, so this cookie can never grant access beyond what
// the session already permits, only hide some of it from the current view.
export const BRANCH_FILTER_COOKIE = "gms_branch_filter";

export async function getBranchFilterValue(): Promise<string | null> {
  const store = await cookies();
  return store.get(BRANCH_FILTER_COOKIE)?.value ?? null;
}
