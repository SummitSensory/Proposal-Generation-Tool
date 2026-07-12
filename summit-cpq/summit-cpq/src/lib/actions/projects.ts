"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

const STATUS_VALUES = ["lead", "quoted", "sold", "in_production", "installed", "closed", "cancelled"] as const;

export async function createProject(formData: FormData) {
  const session = await getSession();
  const customerId = Number(formData.get("customerId"));
  const values = {
    customerId,
    name: String(formData.get("name") || "").trim(),
    location: String(formData.get("location") || "").trim() || null,
    status: (formData.get("status") as (typeof STATUS_VALUES)[number]) || "lead",
    notes: String(formData.get("notes") || "").trim() || null,
    salespersonId: session?.userId ?? null,
  };
  if (!values.name || !customerId) throw new Error("Project name and customer are required.");

  const [created] = await db.insert(projects).values(values).returning();
  await logAudit({ userId: session?.userId, action: "create", entityType: "project", entityId: created.id, newValue: values });

  revalidatePath("/projects");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/projects/${created.id}`);
}

export async function updateProject(projectId: number, formData: FormData) {
  const session = await getSession();
  const [before] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

  const values = {
    name: String(formData.get("name") || "").trim(),
    location: String(formData.get("location") || "").trim() || null,
    status: (formData.get("status") as (typeof STATUS_VALUES)[number]) || "lead",
    notes: String(formData.get("notes") || "").trim() || null,
    updatedAt: new Date(),
  };

  await db.update(projects).set(values).where(eq(projects.id, projectId));
  await logAudit({
    userId: session?.userId,
    action: "update",
    entityType: "project",
    entityId: projectId,
    previousValue: before,
    newValue: values,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}
