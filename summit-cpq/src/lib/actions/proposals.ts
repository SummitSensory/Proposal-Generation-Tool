"use server";

import { db } from "@/db";
import {
  proposals, proposalLineItems, proposalVersions, products, customers, projects,
  sourcingItems, freightRequests,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { generateProposalNumber } from "@/lib/proposalNumber";
import { computeBom } from "@/lib/bom";

async function recalcTotals(proposalId: number) {
  const lineItems = await db.select().from(proposalLineItems).where(eq(proposalLineItems.proposalId, proposalId));
  const subtotal = lineItems.reduce((sum, li) => sum + Number(li.lineTotal), 0);
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  const discount = Number(proposal?.discountTotal || 0);
  const freight = Number(proposal?.freightTotal || 0);
  const tax = Number(proposal?.taxTotal || 0);
  const total = subtotal - discount + freight + tax;

  await db.update(proposals).set({
    subtotal: subtotal.toFixed(2),
    total: total.toFixed(2),
    updatedAt: new Date(),
  }).where(eq(proposals.id, proposalId));
}

export async function createProposal(formData: FormData) {
  const session = await getSession();
  const projectId = Number(formData.get("projectId"));
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("Project not found.");

  const proposalNumber = await generateProposalNumber();
  const [created] = await db.insert(proposals).values({
    proposalNumber,
    projectId,
    customerId: project.customerId,
    createdBy: session?.userId ?? null,
    status: "draft",
  }).returning();

  await logAudit({ userId: session?.userId, action: "create", entityType: "proposal", entityId: created.id, newValue: { proposalNumber } });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/proposals");
  redirect(`/proposals/${created.id}`);
}

export async function addLineItem(proposalId: number, formData: FormData) {
  const session = await getSession();
  const productId = formData.get("productId") ? Number(formData.get("productId")) : null;
  const quantity = Number(formData.get("quantity") || "1");
  const sectionName = String(formData.get("sectionName") || "Products").trim() || "Products";

  let description = String(formData.get("description") || "").trim();
  let unitPrice = Number(formData.get("unitPrice") || "0");
  let dimensions: Record<string, number> = {};
  let computedBom: ReturnType<typeof computeBom> = [];

  if (productId) {
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw new Error("Product not found.");
    if (!description) description = product.customerFacingName || product.name;
    if (!formData.get("unitPrice")) unitPrice = Number(product.unitPrice);

    const dimFields = (product.dimensionFields as { key: string }[]) || [];
    for (const f of dimFields) {
      const raw = formData.get(`dim_${f.key}`);
      if (raw !== null && raw !== "") dimensions[f.key] = Number(raw);
    }
    computedBom = computeBom(product.bomFormula as never, dimensions, quantity);
  }

  if (!description) throw new Error("Description is required.");

  const lineTotal = unitPrice * quantity;

  const [existingMax] = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))
    .orderBy(asc(proposalLineItems.sortOrder));
  const nextSort = (existingMax?.sortOrder ?? -1) + 1000;

  const [createdLine] = await db.insert(proposalLineItems).values({
    proposalId,
    productId,
    sectionName,
    description,
    quantity: String(quantity),
    dimensions,
    computedBom,
    unitPrice: unitPrice.toFixed(2),
    lineTotal: lineTotal.toFixed(2),
    sortOrder: nextSort,
  }).returning();

  // Auto-create sourcing / freight tracking rows per the product's flags.
  if (productId) {
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (product?.thirdPartySourced) {
      await db.insert(sourcingItems).values({
        proposalId,
        lineItemId: createdLine.id,
        vendorId: product.sourcingVendorId,
        status: "not_ordered",
      });
    }
    if (product?.requiresFreightQuote) {
      await db.insert(freightRequests).values({
        proposalId,
        lineItemId: createdLine.id,
        vendorId: product.freightVendorId,
        status: "not_sent",
      });
    }
  }

  await recalcTotals(proposalId);
  await logAudit({ userId: session?.userId, action: "add_line_item", entityType: "proposal", entityId: proposalId, newValue: createdLine });

  revalidatePath(`/proposals/${proposalId}`);
}

export async function removeLineItem(proposalId: number, lineItemId: number) {
  const session = await getSession();
  await db.delete(proposalLineItems).where(eq(proposalLineItems.id, lineItemId));
  await recalcTotals(proposalId);
  await logAudit({ userId: session?.userId, action: "remove_line_item", entityType: "proposal", entityId: proposalId, previousValue: { lineItemId } });
  revalidatePath(`/proposals/${proposalId}`);
}

export async function updateProposalMeta(proposalId: number, formData: FormData) {
  const session = await getSession();
  const depositPercentage = Math.min(100, Math.max(0, Number(formData.get("depositPercentage") || "50")));
  const values = {
    discountTotal: String(formData.get("discountTotal") || "0"),
    freightTotal: String(formData.get("freightTotal") || "0"),
    taxTotal: String(formData.get("taxTotal") || "0"),
    depositPercentage: depositPercentage.toFixed(2),
    notes: String(formData.get("notes") || "").trim() || null,
    termsAndConditions: String(formData.get("termsAndConditions") || "").trim() || null,
    updatedAt: new Date(),
  };
  await db.update(proposals).set(values).where(eq(proposals.id, proposalId));
  await recalcTotals(proposalId);
  await logAudit({ userId: session?.userId, action: "update", entityType: "proposal", entityId: proposalId, newValue: values });
  revalidatePath(`/proposals/${proposalId}`);
}

export async function sendProposal(proposalId: number) {
  const session = await getSession();
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!proposal) throw new Error("Proposal not found.");

  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))
    .orderBy(asc(proposalLineItems.sortOrder));

  if (lineItems.length === 0) throw new Error("Add at least one line item before sending.");

  const [customer] = await db.select().from(customers).where(eq(customers.id, proposal.customerId)).limit(1);

  const existingVersions = await db.select().from(proposalVersions).where(eq(proposalVersions.proposalId, proposalId));
  const versionNumber = existingVersions.length + 1;

  // Historical snapshot: this is what the customer actually saw, frozen at time of send,
  // so later price/description changes never rewrite what was already sent (per spec section 5.9.1).
  const snapshot = {
    proposalNumber: proposal.proposalNumber,
    revisionNumber: proposal.revisionNumber,
    customer: customer ? { legalName: customer.legalName, billingAddress: customer.billingAddress, shippingAddress: customer.shippingAddress } : null,
    lineItems: lineItems.map((li) => ({
      sectionName: li.sectionName,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      lineTotal: li.lineTotal,
    })),
    subtotal: proposal.subtotal,
    discountTotal: proposal.discountTotal,
    freightTotal: proposal.freightTotal,
    taxTotal: proposal.taxTotal,
    total: proposal.total,
    notes: proposal.notes,
    termsAndConditions: proposal.termsAndConditions,
    sentAt: new Date().toISOString(),
  };

  await db.insert(proposalVersions).values({
    proposalId,
    versionNumber,
    snapshot,
    createdBy: session?.userId ?? null,
  });

  await db.update(proposals).set({
    status: "sent",
    sentAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(proposals.id, proposalId));

  await logAudit({ userId: session?.userId, action: "send", entityType: "proposal", entityId: proposalId, newValue: { versionNumber } });

  revalidatePath(`/proposals/${proposalId}`);
}

export async function markAccepted(proposalId: number) {
  const session = await getSession();
  await db.update(proposals).set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() }).where(eq(proposals.id, proposalId));
  await logAudit({ userId: session?.userId, action: "mark_accepted", entityType: "proposal", entityId: proposalId });
  revalidatePath(`/proposals/${proposalId}`);
}

export async function markDeclined(proposalId: number) {
  const session = await getSession();
  await db.update(proposals).set({ status: "declined", updatedAt: new Date() }).where(eq(proposals.id, proposalId));
  await logAudit({ userId: session?.userId, action: "mark_declined", entityType: "proposal", entityId: proposalId });
  revalidatePath(`/proposals/${proposalId}`);
}

export async function createRevision(proposalId: number) {
  const session = await getSession();
  const [original] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!original) throw new Error("Proposal not found.");
  const originalLineItems = await db.select().from(proposalLineItems).where(eq(proposalLineItems.proposalId, proposalId));

  const proposalNumber = await generateProposalNumber();
  const [revision] = await db.insert(proposals).values({
    proposalNumber,
    revisionNumber: original.revisionNumber + 1,
    parentProposalId: original.id,
    projectId: original.projectId,
    customerId: original.customerId,
    createdBy: session?.userId ?? null,
    status: "draft",
    notes: original.notes,
    termsAndConditions: original.termsAndConditions,
    discountTotal: original.discountTotal,
    freightTotal: original.freightTotal,
    taxTotal: original.taxTotal,
  }).returning();

  for (const li of originalLineItems) {
    await db.insert(proposalLineItems).values({
      proposalId: revision.id,
      productId: li.productId,
      sectionName: li.sectionName,
      description: li.description,
      quantity: li.quantity,
      dimensions: li.dimensions,
      computedBom: li.computedBom,
      unitPrice: li.unitPrice,
      lineTotal: li.lineTotal,
      sortOrder: li.sortOrder,
    });
  }

  await recalcTotals(revision.id);
  await logAudit({ userId: session?.userId, action: "create_revision", entityType: "proposal", entityId: revision.id, previousValue: { parentProposalId: original.id } });

  redirect(`/proposals/${revision.id}`);
}
