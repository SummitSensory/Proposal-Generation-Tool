"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";

export async function changePassword(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return { error: "User not found." };

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, user.id));
  await logAudit({ userId: user.id, action: "change_password", entityType: "user", entityId: user.id });

  return { ok: true };
}
