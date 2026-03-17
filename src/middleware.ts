export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/painel/:path*",
    "/financas/:path*",
    "/comunicacao/:path*",
    "/assembleia/:path*",
    "/contratos/:path*",
    "/definicoes/:path*",
  ],
};
