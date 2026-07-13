import { db } from "@/db";
import { proposals, proposalLineItems, customers, projects } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProposalPdfDocument } from "@/components/proposals/ProposalPdfDocument";

/**
 * Renders the customer-facing proposal PDF as a Buffer. Shared by the download route
 * (/api/proposals/[id]/pdf) and the PandaDoc "send for signature" action so both always
 * produce the exact same document — only customer-facing fields are ever included here;
 * BOM/hardware data never reaches this function.
 */
export async function generateProposalPdfBuffer(proposalId: number): Promise<{ buffer: Buffer; proposalNumber: string }> {
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!proposal) throw new Error("Proposal not found.");

  const [customer] = await db.select().from(customers).where(eq(customers.id, proposal.customerId)).limit(1);
  const [project] = await db.select().from(projects).where(eq(projects.id, proposal.projectId)).limit(1);
  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))
    .orderBy(asc(proposalLineItems.sortOrder));

  const sections = Array.from(new Set(lineItems.map((li) => li.sectionName))).map((section) => ({
    name: section,
    items: lineItems
      .filter((li) => li.sectionName === section)
      .map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        lineTotal: li.lineTotal,
      })),
  }));

  const buffer = await renderToBuffer(
    ProposalPdfDocument({
      proposalNumber: proposal.proposalNumber,
      revisionNumber: proposal.revisionNumber,
      customerName: customer?.legalName || "",
      projectName: project?.name || "",
      sections,
      subtotal: proposal.subtotal,
      discountTotal: proposal.discountTotal,
      freightTotal: proposal.freightTotal,
      taxTotal: proposal.taxTotal,
      total: proposal.total,
      notes: proposal.notes,
      termsAndConditions: proposal.termsAndConditions,
    })
  );

  return { buffer, proposalNumber: proposal.proposalNumber };
}
