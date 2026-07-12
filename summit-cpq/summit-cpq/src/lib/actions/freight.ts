"use server";

import { db } from "@/db";
import { freightRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

const STATUSES = ["not_sent", "requested", "awaiting_response", "received", "expired"] as const;

export async function markFreightRequested(freightRequestId: number) {
  const session = await getSession();
  await db.update(freightRequests).set({
    status: "requested",
    requestedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(freightRequests.id, freightRequestId));
  await logAudit({ userId: session?.userId, action: "mark_freight_requested", entityType: "freight_request", entityId: freightRequestId });
  revalidatePath("/freight");
}

export async function updateFreightStatus(freightRequestId: number, formData: FormData) {
  const session = await getSession();
  const status = formData.get("status") as (typeof STATUSES)[number];
  const quotedAmount = formData.get("quotedAmount") ? String(formData.get("quotedAmount")) : null;
  const notes = String(formData.get("notes") || "").trim() || null;

  await db.update(freightRequests).set({
    status,
    quotedAmount,
    notes,
    respondedAt: status === "received" ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(freightRequests.id, freightRequestId));

  await logAudit({ userId: session?.userId, action: "update_freight_status", entityType: "freight_request", entityId: freightRequestId, newValue: { status, quotedAmount } });
  revalidatePath("/freight");
}
