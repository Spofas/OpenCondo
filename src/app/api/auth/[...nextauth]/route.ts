import { type NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

export const GET = handlers.GET;

export async function POST(request: NextRequest, context: RouteContext) {
  // Rate limit login attempts (credentials callback)
  if (request.nextUrl.pathname.includes("/callback/credentials")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = checkRateLimit(`login:${ip}`, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 10 attempts per 15 minutes
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas tentativas. Tente novamente mais tarde." },
        { status: 429 }
      );
    }
  }

  return (handlers.POST as (req: NextRequest, ctx: RouteContext) => Promise<Response>)(request, context);
}
