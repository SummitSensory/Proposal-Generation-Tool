"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

const ROLE_VALUES = ["owner", "sales", "fulfillment", "installation", "accounting", "read_only"] as const;

export async function createUser(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Only an owner can create users.");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const role = formData.get("role") as (typeof ROLE_VALUES)[number];

  if (!email || !name || !password || password.length < 8) {
    throw new Error("Name, email, and an 8+ character password are required.");
  }

  const [created] = await db.insert(users).values({
    name, email, role, passwordHash: await hashPassword(password),
  }).returning();

  await logAudit({ userId: session.userId, action: "create", entityType: "user", entityId: created.id, newValue: { email, role } });
  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUserActive(userId: number, active: boolean) {
  const session = await getSession();
  if (!session || session.role !== "owner") throw new Error("Only an owner can manage users.");
  await db.update(users).set({ active: !active }).where(eq(users.id, userId));
  await logAudit({ userId: session.userId, action: active ? "deactivate" : "reactivate", entityType: "user", entityId: userId });
  revalidatePath("/users");
}
