import { NextRequest, NextResponse } from "next/server";
import { syncCustomersFromMonday } from "@/lib/monday/sync";

/**
 * Called on a schedule by Vercel Cron (see vercel.json). Vercel automatically sends
 * "Authorization: Bearer <CRON_SECRET>" on cron-triggered requests when CRON_SECRET is set
 * in your environment variables — set one (any random string) in Vercel and redeploy.
 * You can also hit this manually with that same header to force a sync outside the schedule.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncCustomersFromMonday();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Sync failed." },
      { status: 500 }
    );
  }
}
