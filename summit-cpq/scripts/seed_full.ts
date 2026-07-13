import { db } from "../src/db";
import { proposals, proposalLineItems, products, projects, customers, vendors, sourcingItems, freightRequests } from "../src/db/schema";
import { computeBom } from "../src/lib/bom";
import { eq } from "drizzle-orm";

async function main() {
  let [customer] = await db.select().from(customers).where(eq(customers.legalName, "Lincoln Elementary School")).limit(1);
  if (!customer) {
    [customer] = await db.insert(customers).values({ legalName: "Lincoln Elementary School", phone: "555-1234" }).returning();
  }
  let [project] = await db.select().from(projects).where(eq(projects.customerId, customer.id)).limit(1);
  if (!project) {
    [project] = await db.insert(projects).values({ customerId: customer.id, name: "Lincoln Sensory Room", status: "quoted" }).returning();
  }
  let [vendor] = await db.select().from(vendors).where(eq(vendors.name, "Acme Hardware")).limit(1);
  if (!vendor) {
    [vendor] = await db.insert(vendors).values({ name: "Acme Hardware", type: "both", contactEmail: "orders@acme.test" }).returning();
  }
  let [product] = await db.select().from(products).where(eq(products.sku, "FRAME-A")).limit(1);
  if (!product) {
    [product] = await db.insert(products).values({
      sku: "FRAME-A", name: "Frame Model A", unitPrice: "1200.00", unitCost: "600.00",
      dimensionFields: [{ key: "length_ft", label: "Length (ft)", unit: "ft" }],
      bomFormula: [{ componentName: "3/8in bolt", unit: "each", formula: "ceil(length_ft * 2) + 4" }],
      thirdPartySourced: true, sourcingVendorId: vendor.id,
      requiresFreightQuote: true, freightVendorId: vendor.id,
    }).returning();
  }

  const [proposal] = await db.insert(proposals).values({
    proposalNumber: `P-TEST-${Date.now()}`,
    projectId: project.id,
    customerId: customer.id,
    status: "draft",
  }).returning();

  const dims = { length_ft: 9.5 };
  const bom = computeBom(product.bomFormula as never, dims, 2);
  const [lineItem] = await db.insert(proposalLineItems).values({
    proposalId: proposal.id,
    productId: product.id,
    sectionName: "Products",
    description: product.name,
    quantity: "2",
    dimensions: dims,
    computedBom: bom,
    unitPrice: product.unitPrice,
    lineTotal: (Number(product.unitPrice) * 2).toFixed(2),
    sortOrder: 0,
  }).returning();
  await db.update(proposals).set({ subtotal: (Number(product.unitPrice)*2).toFixed(2), total: (Number(product.unitPrice)*2).toFixed(2) }).where(eq(proposals.id, proposal.id));

  await db.insert(sourcingItems).values({ proposalId: proposal.id, lineItemId: lineItem.id, vendorId: vendor.id, status: "not_ordered" });
  await db.insert(freightRequests).values({ proposalId: proposal.id, lineItemId: lineItem.id, vendorId: vendor.id, status: "not_sent" });

  console.log("PROPOSAL_ID=" + proposal.id);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
