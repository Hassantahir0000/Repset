import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rawPrisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(rawPrisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await rawPrisma.user.findFirst({
          where: { email, isActive: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
          branchId: user.branchId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string;
        token.organizationId = user.organizationId as string;
        token.role = user.role as never;

        if (user.branchId) {
          token.activeBranchId = user.branchId as string;
          token.accessibleBranchIds = [user.branchId as string];
        } else {
          const branches = await rawPrisma.branch.findMany({
            where: { organizationId: user.organizationId as string, isActive: true },
            select: { id: true },
          });
          token.activeBranchId = null;
          token.accessibleBranchIds = branches.map((b) => b.id);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.organizationId = token.organizationId;
      session.user.role = token.role;
      session.user.activeBranchId = token.activeBranchId;
      session.user.accessibleBranchIds = token.accessibleBranchIds;
      return session;
    },
  },
});
