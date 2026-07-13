"use server";

import { db } from "@/db";
import { sourcingItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

const STATUSES = ["not_ordered", "ordered", "confirmed", "received"] as const;

export async function updateSourcingStatus(sourcingItemId: number, formData: FormData) {
  const session = await getSession();
  const status = formData.get("status") as (typeof STATUSES)[number];
  const notes = String(formData.get("notes") || "").trim() || null;

  await db.update(sourcingItems).set({
    status,
    notes,
    orderedAt: status === "ordered" ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(sourcingItems.id, sourcingItemId));

  await logAudit({ userId: session?.userId, action: "update_sourcing_status", entityType: "sourcing_item", entityId: sourcingItemId, newValue: { status } });
  revalidatePath("/sourcing");
}
