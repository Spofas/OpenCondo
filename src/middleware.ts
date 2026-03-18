import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/painel/:path*",
    "/financas/:path*",
    "/comunicacao/:path*",
    "/assembleia/:path*",
    "/contratos/:path*",
    "/definicoes/:path*",
    "/onboarding/:path*",
  ],
};
