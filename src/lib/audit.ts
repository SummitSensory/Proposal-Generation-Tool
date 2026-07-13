import { db } from "@/db";
import { auditLog } from "@/db/schema";

export async function logAudit(entry: {
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  previousValue?: unknown;
  newValue?: unknown;
}) {
  try {
    await db.insert(auditLog).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      previousValue: entry.previousValue ? JSON.parse(JSON.stringify(entry.previousValue)) : null,
      newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : null,
    });
  } catch (err) {
    // Auditing must never block the primary action; log and move on.
    console.error("Failed to write audit log entry:", err);
  }
}
