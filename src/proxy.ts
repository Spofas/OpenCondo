import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login", "/registar", "/recuperar-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Authenticated users visiting public/landing pages → dashboard
  if (isLoggedIn && (pathname === "/" || publicPaths.some((p) => pathname.startsWith(p)))) {
    return NextResponse.redirect(new URL("/painel", req.url));
  }

  // Unauthenticated users visiting protected pages → login
  if (!isLoggedIn && !publicPaths.some((p) => pathname.startsWith(p)) && pathname !== "/") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes including NextAuth)
     * - _next/static, _next/image (Next.js internals)
     * - static assets
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
