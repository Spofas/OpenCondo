import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

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
