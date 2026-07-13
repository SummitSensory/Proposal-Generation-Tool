import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/qbo/client";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const code = req.nextUrl.searchParams.get("code");
  const realmId = req.nextUrl.searchParams.get("realmId");

  if (!code || !realmId) {
    return NextResponse.redirect(new URL("/settings?qbo=error", req.url));
  }

  try {
    await exchangeCodeForTokens(code, realmId, session?.userId ?? null);
    await logAudit({ userId: session?.userId, action: "connect", entityType: "qbo_connection", newValue: { realmId } });
    return NextResponse.redirect(new URL("/settings?qbo=connected", req.url));
  } catch (err) {
    console.error("QuickBooks OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/settings?qbo=error", req.url));
  }
}
