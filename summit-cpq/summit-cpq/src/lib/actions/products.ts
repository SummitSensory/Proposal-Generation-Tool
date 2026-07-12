"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { DimensionField, BomFormulaEntry } from "@/lib/bom";

function parseValues(formData: FormData) {
  let dimensionFields: DimensionField[] = [];
  let bomFormula: BomFormulaEntry[] = [];
  try {
    dimensionFields = JSON.parse(String(formData.get("dimensionFieldsJson") || "[]"));
  } catch {
    dimensionFields = [];
  }
  try {
    bomFormula = JSON.parse(String(formData.get("bomFormulaJson") || "[]"));
  } catch {
    bomFormula = [];
  }

  const sourcingVendorId = formData.get("sourcingVendorId");
  const freightVendorId = formData.get("freightVendorId");

  return {
    sku: String(formData.get("sku") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    customerFacingName: String(formData.get("customerFacingName") || "").trim() || null,
    category: String(formData.get("category") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    customerFacingDescription: String(formData.get("customerFacingDescription") || "").trim() || null,
    unitPrice: String(formData.get("unitPrice") || "0"),
    unitCost: String(formData.get("unitCost") || "0"),
    dimensionFields,
    bomFormula,
    thirdPartySourced: formData.get("thirdPartySourced") === "on",
    sourcingVendorId: sourcingVendorId ? Number(sourcingVendorId) : null,
    requiresFreightQuote: formData.get("requiresFreightQuote") === "on",
    freightVendorId: freightVendorId ? Number(freightVendorId) : null,
    active: formData.get("active") !== "off",
  };
}

export async function createProduct(formData: FormData) {
  const session = await getSession();
  const values = parseValues(formData);
  if (!values.sku || !values.name) throw new Error("SKU and name are required.");

  const [created] = await db.insert(products).values(values).returning();
  await logAudit({ userId: session?.userId, action: "create", entityType: "product", entityId: created.id, newValue: values });

  revalidatePath("/products");
  redirect(`/products/${created.id}`);
}

export async function updateProduct(productId: number, formData: FormData) {
  const session = await getSession();
  const [before] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  const values = parseValues(formData);

  await db.update(products).set({ ...values, updatedAt: new Date() }).where(eq(products.id, productId));
  await logAudit({
    userId: session?.userId,
    action: "update",
    entityType: "product",
    entityId: productId,
    previousValue: before,
    newValue: values,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}
