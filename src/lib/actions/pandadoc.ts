"use server";

import { db } from "@/db";
import { proposals, customers, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { generateProposalPdfBuffer } from "@/lib/proposalPdf";
import { createPandaDocFromPdf, waitForDocumentDraft, sendPandaDocDocument } from "@/lib/pandadoc/client";

export async function sendProposalForSignature(proposalId: number): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();

  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!proposal) return { error: "Proposal not found." };

  const [customer] = await db.select().from(customers).where(eq(customers.id, proposal.customerId)).limit(1);
  if (!customer) return { error: "Customer not found." };

  const [primaryContact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.customerId, customer.id))
    .limit(1);

  if (!primaryContact?.email) {
    return { error: "This customer has no contact with an email address on file. Add one before sending for signature." };
  }

  try {
    const { buffer } = await generateProposalPdfBuffer(proposalId);
    const documentId = await createPandaDocFromPdf({
      name: `${proposal.proposalNumber} - ${customer.legalName}`,
      pdfBuffer: buffer,
      recipient: {
        email: primaryContact.email,
        firstName: primaryContact.name.split(" ")[0],
        lastName: primaryContact.name.split(" ").slice(1).join(" "),
      },
    });

    await waitForDocumentDraft(documentId);
    await sendPandaDocDocument(documentId);

    await db.update(proposals).set({
      pandadocDocumentId: documentId,
      pandadocStatus: "sent",
      updatedAt: new Date(),
    }).where(eq(proposals.id, proposalId));

    await logAudit({ userId: session?.userId, action: "send_for_signature", entityType: "proposal", entityId: proposalId, newValue: { documentId } });
    revalidatePath(`/proposals/${proposalId}`);
    return { ok: true };
  } catch (err) {
    console.error("Failed to send proposal for signature:", err);
    return { error: (err as Error).message };
  }
}
