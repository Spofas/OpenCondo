import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Implement actual credential verification with Prisma
        // This is a placeholder for the auth foundation
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/registar",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/painel") ||
        nextUrl.pathname.startsWith("/financas") ||
        nextUrl.pathname.startsWith("/comunicacao") ||
        nextUrl.pathname.startsWith("/assembleia") ||
        nextUrl.pathname.startsWith("/contratos") ||
        nextUrl.pathname.startsWith("/definicoes");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      return true;
    },
  },
};
