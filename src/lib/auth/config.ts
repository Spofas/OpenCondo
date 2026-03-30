import type { NextAuthConfig } from "next-auth";

// Base config used by middleware (edge runtime - no Prisma/bcrypt)
export const authConfig: NextAuthConfig = {
  providers: [],  // Providers added in index.ts (server only)
  pages: {
    signIn: "/login",
    newUser: "/registar",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth }) {
      // Auth routing is handled by middleware.ts — this callback
      // only needs to confirm the user object exists for protected routes.
      return !!auth?.user;
    },
  },
};
