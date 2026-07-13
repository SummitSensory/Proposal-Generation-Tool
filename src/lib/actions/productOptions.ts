"use server";

import { db } from "@/db";
import { productOptions, productOptionItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export type OptionItemInput = { productId: number; quantity: string };

function parseItems(formData: FormData): OptionItemInput[] {
  try {
    const raw = JSON.parse(String(formData.get("itemsJson") || "[]"));
    return raw
      .map((r: { productId: string | number; quantity: string }) => ({
        productId: Number(r.productId),
        quantity: String(r.quantity || "1"),
      }))
      .filter((r: OptionItemInput) => r.productId);
  } catch {
    return [];
  }
}

export async function createOption(formData: FormData) {
  const session = await getSession();
  const series = String(formData.get("series") || "adventure") as "adventure" | "soar" | "flex" | "scape" | "safe";
  const label = String(formData.get("label") || "").trim();
  const key = String(formData.get("key") || "").trim() || label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const description = String(formData.get("description") || "").trim() || null;
  if (!label) throw new Error("Label is required.");

  const items = parseItems(formData);

  const [created] = await db.insert(productOptions).values({ series, key, label, description }).returning();
  if (items.length > 0) {
    await db.insert(productOptionItems).values(
      items.map((it, i) => ({ optionId: created.id, productId: it.productId, quantity: it.quantity, sortOrder: i }))
    );
  }
  await logAudit({ userId: session?.userId, action: "create", entityType: "product_option", entityId: created.id, newValue: { series, key, label, items } });

  revalidatePath("/options");
  redirect(`/options/${created.id}`);
}

export async function updateOption(optionId: number, formData: FormData) {
  const session = await getSession();
  const label = String(formData.get("label") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const active = formData.get("active") !== "off";
  const items = parseItems(formData);

  await db.update(productOptions).set({ label, description, active, updatedAt: new Date() }).where(eq(productOptions.id, optionId));
  await db.delete(productOptionItems).where(eq(productOptionItems.optionId, optionId));
  if (items.length > 0) {
    await db.insert(productOptionItems).values(
      items.map((it, i) => ({ optionId, productId: it.productId, quantity: it.quantity, sortOrder: i }))
    );
  }
  await logAudit({ userId: session?.userId, action: "update", entityType: "product_option", entityId: optionId, newValue: { label, items } });

  revalidatePath("/options");
  revalidatePath(`/options/${optionId}`);
}
