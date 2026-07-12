import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, vendors } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

/**
 * One-time setup endpoint: visit this URL once in your browser after your first deploy to
 * create the initial Owner login, instead of running a script from a terminal. Safe to visit
 * more than once — it only ever creates the owner account if no users exist yet.
 *
 * Protected by SETUP_TOKEN (set in Vercel env vars) so a stranger can't call this before you do.
 * Once you've used it, you can remove SEED_OWNER_EMAIL/PASSWORD/SETUP_TOKEN from your env vars
 * if you'd like — this route always double-checks "no users yet" regardless.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expectedToken = process.env.SETUP_TOKEN;

  if (!expectedToken) {
    return new NextResponse(
      "SETUP_TOKEN is not set in your environment variables. Add one in Vercel (Settings → Environment Variables) — any random string — then redeploy and visit this link again with ?token=that-value.",
      { status: 500 }
    );
  }
  if (token !== expectedToken) {
    return new NextResponse("Invalid or missing setup token.", { status: 403 });
  }

  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    return new NextResponse(
      "Setup already complete — a user already exists. Go to your app's /login page to sign in.",
      { status: 200 }
    );
  }

  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!email || !password) {
    return new NextResponse(
      "Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in your environment variables, redeploy, then visit this link again.",
      { status: 500 }
    );
  }

  await db.insert(users).values({
    name: "Bryan Shepherd",
    email: email.toLowerCase().trim(),
    passwordHash: await hashPassword(password),
    role: "owner",
  });

  const existingVendors = await db.select().from(vendors).limit(1);
  if (existingVendors.length === 0) {
    await db.insert(vendors).values([
      { name: "Sample Freight Carrier", type: "freight", contactEmail: "quotes@example-carrier.com" },
      { name: "Sample Hardware Supplier", type: "sourcing", contactEmail: "orders@example-supplier.com" },
    ]);
  }

  return new NextResponse(
    `Setup complete! Go to your app's /login page and sign in with ${email} and the password you set in SEED_OWNER_PASSWORD. Change your password from Account Settings right after logging in.`,
    { status: 200 }
  );
}
