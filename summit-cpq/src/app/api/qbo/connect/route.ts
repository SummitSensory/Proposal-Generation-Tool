import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/qbo/client";
import { getSession } from "@/lib/auth/session";
import { nanoid } from "nanoid";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Only an owner can connect QuickBooks Online." }, { status: 403 });
  }

  try {
    const state = nanoid();
    const url = buildAuthorizeUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
