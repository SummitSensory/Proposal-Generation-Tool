import { db } from "@/db";
import { proposals } from "@/db/schema";
import { sql } from "drizzle-orm";

const SERIES_PREFIX: Record<string, string> = {
  adventure: "ADV",
  soar: "SOAR",
  flex: "FLEX",
  scape: "SCAPE",
  safe: "SAFE",
};

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return (letters || "XX").slice(0, 3);
}

function yymmdd(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/**
 * Mirrors the legacy spreadsheet's convention, e.g. ADV-TR-260608-001
 * (series prefix - customer initials - date - sequence for that day).
 */
export async function generateProposalNumber(series: string | null, customerName: string): Promise<string> {
  const prefix = series ? SERIES_PREFIX[series] || "P" : "P";
  const date = yymmdd();
  const [{ value }] = await db
    .select({ value: sql<number>`count(*)` })
    .from(proposals)
    .where(sql`to_char(${proposals.createdAt}, 'YYMMDD') = ${date}`);
  const next = Number(value) + 1;
  return `${prefix}-${initials(customerName)}-${date}-${String(next).padStart(3, "0")}`;
}
