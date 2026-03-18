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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = [
        "/painel",
        "/financas",
        "/comunicacao",
        "/assembleia",
        "/contratos",
        "/definicoes",
        "/onboarding",
        "/iniciar",
        "/entrar",
      ];
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      );

      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      return true;
    },
  },
};
