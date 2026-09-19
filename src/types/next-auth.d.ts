import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: Role;
      activeBranchId: string | null;
      accessibleBranchIds: string[];
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    organizationId: string;
    role: Role;
    branchId: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string;
    organizationId: string;
    role: Role;
    activeBranchId: string | null;
    accessibleBranchIds: string[];
  }
}
