import { db } from "../src/db";
import { customers, contacts, projects, products, vendors } from "../src/db/schema";
import { computeBom } from "../src/lib/bom";

async function main() {
  const [vendor] = await db.insert(vendors).values({ name: "Acme Hardware", type: "sourcing", contactEmail: "a@acme.test" }).returning();
  const [customer] = await db.insert(customers).values({ legalName: "Lincoln Elementary School", phone: "555-1234" }).returning();
  await db.insert(contacts).values({ customerId: customer.id, name: "Jane Doe", title: "Principal", isPrimary: true });
  const [project] = await db.insert(projects).values({ customerId: customer.id, name: "Lincoln Sensory Room", status: "quoted" }).returning();
  const [product] = await db.insert(products).values({
    sku: "FRAME-A",
    name: "Frame Model A",
    unitPrice: "1200.00",
    unitCost: "600.00",
    dimensionFields: [{ key: "length_ft", label: "Length (ft)", unit: "ft" }],
    bomFormula: [
      { componentName: "3/8in bolt", unit: "each", formula: "ceil(length_ft * 2) + 4" },
      { componentName: "L-bracket", unit: "each", formula: "ceil(length_ft)" },
    ],
    thirdPartySourced: true,
    sourcingVendorId: vendor.id,
    requiresFreightQuote: true,
  }).returning();

  const bom = computeBom(product.bomFormula as never, { length_ft: 9.5 }, 2);
  console.log("Customer:", customer.legalName);
  console.log("Project:", project.name, project.status);
  console.log("Product:", product.sku, product.name);
  console.log("Computed BOM for length_ft=9.5, qty=2:", JSON.stringify(bom, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error("SMOKETEST FAILED:", e);
  process.exit(1);
});
