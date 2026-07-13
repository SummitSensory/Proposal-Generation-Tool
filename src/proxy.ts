import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me");
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/setup",
  "/api/qbo/callback",
  "/api/pandadoc/webhook",
  "/api/cron",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("summit_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  try {
    await jwtVerify(token, secretKey());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
