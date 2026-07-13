import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
<<<<<<< HEAD
import { users, vendors, products } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { seedProducts, seedVendorNames } from "@/db/seedProducts";
import { seedOptions } from "@/db/seedOptions";
import { productOptions, productOptionItems } from "@/db/schema";

/**
 * One-time (but safe-to-repeat) setup endpoint: visit this URL in your browser after every
 * deploy that adds new seed data — it creates the initial Owner login if missing, seeds the
 * standard vendor list if missing, and seeds the starter product catalog if missing. Each of
 * the three steps independently checks "is this already there?" first, so revisiting this URL
 * after the owner account already exists will still pick up new vendor/product seeding.
 *
 * Protected by SETUP_TOKEN (set in Vercel env vars).
=======
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
>>>>>>> 0d4db38f0e95434716364cff81d3442876d0adb0
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

<<<<<<< HEAD
  const messages: string[] = [];

  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length === 0) {
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
    messages.push(`Created owner login for ${email}.`);
  } else {
    messages.push("Owner login already exists — skipped.");
  }

  const existingVendors = await db.select().from(vendors);
  const vendorByName = new Map(existingVendors.map((v) => [v.name, v.id]));
  const allVendorNames = Array.from(new Set([...seedVendorNames, "Southpaw", "TFH", "Rope and Rescue"]));
  const missingVendorNames = allVendorNames.filter((n) => !vendorByName.has(n));
  if (missingVendorNames.length > 0) {
    const inserted = await db
      .insert(vendors)
      .values(missingVendorNames.map((name) => ({ name, type: "sourcing" as const })))
      .returning();
    for (const v of inserted) vendorByName.set(v.name, v.id);
    messages.push(`Added ${missingVendorNames.length} vendor(s): ${missingVendorNames.join(", ")}.`);
  } else {
    messages.push("Standard vendor list already present — skipped.");
  }

  const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProducts.length === 0) {
    await db.insert(products).values(
      seedProducts.map((p) => ({
        sku: p.sku,
        name: p.name,
        category: p.category,
        series: p.series,
        unitCost: p.unitCost,
        unitPrice: p.unitPrice,
        weightLbs: p.weightLbs,
        thirdPartySourced: true,
        sourcingVendorId: p.vendorName ? vendorByName.get(p.vendorName) ?? null : null,
        active: true,
      }))
    );
    messages.push(
      `Seeded ${seedProducts.length} starter products pulled from your existing pricing workbook. ` +
        `Some (Soar/Flex/Safe/Scape items) have no vendor assigned yet — edit those on the Products page ` +
        `and assign Southpaw, TFH, Rope and Rescue, or whoever's correct.`
    );
  } else {
    messages.push("Products table already has data — skipped catalog seeding.");
  }

  const existingOptions = await db.select({ id: productOptions.id }).from(productOptions).limit(1);
  if (existingOptions.length === 0) {
    const allProducts = await db.select({ id: products.id, sku: products.sku }).from(products);
    const productIdBySku = new Map(allProducts.map((p) => [p.sku, p.id]));
    let missingSkuCount = 0;
    for (const opt of seedOptions) {
      const [createdOption] = await db
        .insert(productOptions)
        .values({
          series: opt.series,
          key: opt.key,
          label: opt.label,
          description: opt.description,
          sortOrder: opt.sortOrder,
        })
        .returning();
      const itemRows = opt.items
        .map((item, i) => {
          const productId = productIdBySku.get(item.sku);
          if (!productId) {
            missingSkuCount++;
            return null;
          }
          return { optionId: createdOption.id, productId, quantity: item.quantity, sortOrder: i };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      if (itemRows.length > 0) {
        await db.insert(productOptionItems).values(itemRows);
      }
    }
    messages.push(
      `Seeded ${seedOptions.length} proposal options (toggleable add-ons like "Monkey Bars"). ` +
        `Adventure Series options have real starter quantities from an actual proposal -- review ` +
        `and adjust on the Proposal Options page. Soar/Flex/Scape/Safe options were added as empty ` +
        `shells for you to fill in.` +
        (missingSkuCount > 0 ? ` (${missingSkuCount} option item(s) skipped — SKU not found.)` : "")
    );
  } else {
    messages.push("Proposal options already seeded — skipped.");
  }

  return new NextResponse(
    messages.join("\n\n") +
      "\n\nGo to your app's /login page to sign in (or you're already set up — just check the Products page for the new catalog).",
=======
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
>>>>>>> 0d4db38f0e95434716364cff81d3442876d0adb0
    { status: 200 }
  );
}
