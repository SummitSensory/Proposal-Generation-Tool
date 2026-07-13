"use server";

import { db } from "@/db";
import { invoices, proposals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { createQboInvoice } from "@/lib/qbo/invoices";

/**
 * Creates a QuickBooks Online invoice for the given milestone (deposit/final/full) and
 * records it locally. Refuses to create a duplicate invoice for the same proposal +
 * milestone, per the spec's duplicate-prevention requirement (section 16).
 */
export async function createInvoiceForProposal(
  proposalId: number,
  type: "deposit" | "final" | "full"
): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();

  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!proposal) return { error: "Proposal not found." };
  if (proposal.status !== "accepted") return { error: "Only accepted proposals can be invoiced." };

  const existing = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.proposalId, proposalId), eq(invoices.type, type)));
  if (existing.length > 0) {
    return { error: `A ${type} invoice already exists for this proposal.` };
  }

  const total = Number(proposal.total);
  const depositPct = Number(proposal.depositPercentage) / 100;
  let amount: number;
  let description: string;

  if (type === "full") {
    amount = total;
    description = `Full payment — Proposal ${proposal.proposalNumber}`;
  } else if (type === "deposit") {
    amount = Math.round(total * depositPct * 100) / 100;
    description = `Deposit (${proposal.depositPercentage}%) — Proposal ${proposal.proposalNumber}`;
  } else {
    amount = Math.round(total * (1 - depositPct) * 100) / 100;
    description = `Final payment — Proposal ${proposal.proposalNumber}`;
  }

  try {
    const result = await createQboInvoice({
      customerId: proposal.customerId,
      proposalId,
      proposalNumber: proposal.proposalNumber,
      description,
      amount,
    });

    const [created] = await db.insert(invoices).values({
      proposalId,
      type,
      status: "created",
      amount: amount.toFixed(2),
      qboInvoiceId: result.qboInvoiceId,
      qboInvoiceNumber: result.qboInvoiceNumber,
      balanceDue: result.balance.toFixed(2),
      qboSyncedAt: new Date(),
      createdBy: session?.userId ?? null,
    }).returning();

    await logAudit({
      userId: session?.userId,
      action: "create_invoice",
      entityType: "invoice",
      entityId: created.id,
      newValue: { type, amount, qboInvoiceId: result.qboInvoiceId },
    });

    revalidatePath(`/proposals/${proposalId}`);
    return { ok: true };
  } catch (err) {
    console.error("Failed to create QBO invoice:", err);
    return { error: (err as Error).message };
  }
}

export async function refreshInvoiceStatus(invoiceId: number): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice?.qboInvoiceId) return { error: "Invoice has no QuickBooks reference." };

  try {
    const { qboApiRequest } = await import("@/lib/qbo/client");
    const result = await qboApiRequest(`invoice/${invoice.qboInvoiceId}`);
    const qboInvoice = result.Invoice;
    const balance = Number(qboInvoice.Balance);
    const status = balance <= 0 ? "paid" : balance < Number(invoice.amount) ? "partially_paid" : "sent";

    await db.update(invoices).set({
      balanceDue: balance.toFixed(2),
      status,
      qboSyncedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId));

    await logAudit({ userId: session?.userId, action: "refresh_invoice_status", entityType: "invoice", entityId: invoiceId, newValue: { balance, status } });
    revalidatePath(`/proposals/${invoice.proposalId}`);
    return { ok: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
