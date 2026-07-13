import { db } from "./index";
import { users, vendors } from "./schema";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const email = process.env.SEED_OWNER_EMAIL || "bryanshepherd@summitsensory.com";
  const password = process.env.SEED_OWNER_PASSWORD || "changeme123";

  const existing = await db.select().from(users);
  if (existing.length === 0) {
    await db.insert(users).values({
      name: "Bryan Shepherd",
      email,
      passwordHash: await hashPassword(password),
      role: "owner",
    });
    console.log(`Created owner user ${email} with a temporary password. Change it after first login.`);
  } else {
    console.log("Users already exist, skipping owner creation.");
  }

  const existingVendors = await db.select().from(vendors);
  if (existingVendors.length === 0) {
    await db.insert(vendors).values([
      { name: "Sample Freight Carrier", type: "freight", contactEmail: "quotes@example-carrier.com" },
      { name: "Sample Hardware Supplier", type: "sourcing", contactEmail: "orders@example-supplier.com" },
    ]);
    console.log("Seeded sample vendors.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
