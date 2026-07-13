import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { qboApiRequest } from "./client";

/**
 * Finds an existing QuickBooks Online customer by display name, or creates one.
 * Stores the resulting QBO customer id on our own customer record so future
 * proposals for this customer never risk creating a duplicate QBO customer
 * (per the spec's "prevent duplicate customer records" requirement).
 */
export async function findOrCreateQboCustomer(customerId: number): Promise<string> {
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer) throw new Error("Customer not found.");
  if (customer.qboCustomerId) return customer.qboCustomerId;

  const escapedName = customer.legalName.replace(/'/g, "\\'");
  const query = `select * from Customer where DisplayName = '${escapedName}'`;
  const searchResult = await qboApiRequest(`query?query=${encodeURIComponent(query)}`);
  const existing = searchResult?.QueryResponse?.Customer?.[0];

  if (existing) {
    await db.update(customers).set({ qboCustomerId: existing.Id }).where(eq(customers.id, customerId));
    return existing.Id;
  }

  const created = await qboApiRequest("customer", {
    method: "POST",
    body: JSON.stringify({
      DisplayName: customer.legalName,
      CompanyName: customer.legalName,
      PrimaryPhone: customer.phone ? { FreeFormNumber: customer.phone } : undefined,
      BillAddr: customer.billingAddress ? { Line1: customer.billingAddress } : undefined,
      ShipAddr: customer.shippingAddress ? { Line1: customer.shippingAddress } : undefined,
    }),
  });

  const qboId = created.Customer.Id;
  await db.update(customers).set({ qboCustomerId: qboId }).where(eq(customers.id, customerId));
  return qboId;
}
