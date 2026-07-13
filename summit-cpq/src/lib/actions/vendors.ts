"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function createVendor(formData: FormData) {
  const session = await getSession();
  const values = {
    name: String(formData.get("name") || "").trim(),
    type: (String(formData.get("type") || "sourcing") as "sourcing" | "freight" | "both"),
    contactName: String(formData.get("contactName") || "").trim() || null,
    contactEmail: String(formData.get("contactEmail") || "").trim() || null,
    contactPhone: String(formData.get("contactPhone") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };
  if (!values.name) throw new Error("Vendor name is required.");

  const [created] = await db.insert(vendors).values(values).returning();
  await logAudit({ userId: session?.userId, action: "create", entityType: "vendor", entityId: created.id, newValue: values });

  revalidatePath("/vendors");
  redirect("/vendors");
}
