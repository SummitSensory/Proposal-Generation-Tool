"use server";

import { db } from "@/db";
import { customers, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function createCustomer(formData: FormData) {
  const session = await getSession();

  const values = {
    legalName: String(formData.get("legalName") || "").trim(),
    dba: String(formData.get("dba") || "").trim() || null,
    customerType: String(formData.get("customerType") || "").trim() || null,
    industry: String(formData.get("industry") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    billingAddress: String(formData.get("billingAddress") || "").trim() || null,
    shippingAddress: String(formData.get("shippingAddress") || "").trim() || null,
    projectAddress: String(formData.get("projectAddress") || "").trim() || null,
    taxExempt: formData.get("taxExempt") === "on",
    notes: String(formData.get("notes") || "").trim() || null,
  };

  if (!values.legalName) {
    throw new Error("Legal name is required.");
  }

  const [created] = await db.insert(customers).values(values).returning();
  await logAudit({
    userId: session?.userId,
    action: "create",
    entityType: "customer",
    entityId: created.id,
    newValue: values,
  });

  revalidatePath("/customers");
  redirect(`/customers/${created.id}`);
}

export async function updateCustomer(customerId: number, formData: FormData) {
  const session = await getSession();
  const [before] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);

  const values = {
    legalName: String(formData.get("legalName") || "").trim(),
    dba: String(formData.get("dba") || "").trim() || null,
    customerType: String(formData.get("customerType") || "").trim() || null,
    industry: String(formData.get("industry") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    billingAddress: String(formData.get("billingAddress") || "").trim() || null,
    shippingAddress: String(formData.get("shippingAddress") || "").trim() || null,
    projectAddress: String(formData.get("projectAddress") || "").trim() || null,
    taxExempt: formData.get("taxExempt") === "on",
    notes: String(formData.get("notes") || "").trim() || null,
    updatedAt: new Date(),
  };

  await db.update(customers).set(values).where(eq(customers.id, customerId));
  await logAudit({
    userId: session?.userId,
    action: "update",
    entityType: "customer",
    entityId: customerId,
    previousValue: before,
    newValue: values,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function addContact(customerId: number, formData: FormData) {
  const session = await getSession();
  const values = {
    customerId,
    name: String(formData.get("name") || "").trim(),
    title: String(formData.get("title") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    isPrimary: formData.get("isPrimary") === "on",
    isBilling: formData.get("isBilling") === "on",
    isDecisionMaker: formData.get("isDecisionMaker") === "on",
    notes: String(formData.get("notes") || "").trim() || null,
  };
  if (!values.name) throw new Error("Contact name is required.");

  const [created] = await db.insert(contacts).values(values).returning();
  await logAudit({
    userId: session?.userId,
    action: "create",
    entityType: "contact",
    entityId: created.id,
    newValue: values,
  });

  revalidatePath(`/customers/${customerId}`);
}

export async function deleteContact(customerId: number, contactId: number) {
  const session = await getSession();
  await db.delete(contacts).where(eq(contacts.id, contactId));
  await logAudit({
    userId: session?.userId,
    action: "delete",
    entityType: "contact",
    entityId: contactId,
  });
  revalidatePath(`/customers/${customerId}`);
}
