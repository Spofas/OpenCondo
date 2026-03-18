import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    "/painel",
    "/painel/:path*",
    "/financas",
    "/financas/:path*",
    "/comunicacao",
    "/comunicacao/:path*",
    "/assembleia",
    "/assembleia/:path*",
    "/contratos",
    "/contratos/:path*",
    "/definicoes",
    "/definicoes/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/iniciar",
    "/iniciar/:path*",
  ],
};
