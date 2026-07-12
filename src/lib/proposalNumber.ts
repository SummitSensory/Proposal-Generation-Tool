import { db } from "@/db";
import { proposals } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ value }] = await db
    .select({ value: sql<number>`count(*)` })
    .from(proposals)
    .where(sql`extract(year from ${proposals.createdAt}) = ${year}`);
  const next = Number(value) + 1;
  return `P-${year}-${String(next).padStart(4, "0")}`;
}
