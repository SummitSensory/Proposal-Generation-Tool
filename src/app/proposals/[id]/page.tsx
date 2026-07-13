import { db } from "@/db";
import {
  proposals, proposalLineItems, proposalVersions, products, customers, projects, invoices,
  productOptions, productOptionItems,
} from "@/db/schema";
import { eq, asc, desc, and, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  addLineItem, removeLineItem, updateProposalMeta, sendProposal, markAccepted, markDeclined, createRevision,
} from "@/lib/actions/proposals";
import AddLineItemForm from "@/components/proposals/AddLineItemForm";
import ProposalOptionsPanel from "@/components/proposals/ProposalOptionsPanel";
import InvoiceActions from "@/components/proposals/InvoiceActions";
import SendForSignatureButton from "@/components/proposals/SendForSignatureButton";
import { getSession } from "@/lib/auth/session";
import { roleCan, CAN_VIEW_BOM } from "@/lib/auth/roles";

const seriesLabels: Record<string, string> = {
  adventure: "Summit Adventure Series",
  soar: "Summit Soar",
  flex: "Summit Flex",
  scape: "Summit Scape",
  safe: "Summit Safe",
};

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposalId = Number(id);
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  if (!proposal) notFound();

  const [customer] = await db.select().from(customers).where(eq(customers.id, proposal.customerId)).limit(1);
  const [project] = await db.select().from(projects).where(eq(projects.id, proposal.projectId)).limit(1);
  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))
    .orderBy(asc(proposalLineItems.sortOrder));
  const versions = await db
    .select()
    .from(proposalVersions)
    .where(eq(proposalVersions.proposalId, proposalId))
    .orderBy(desc(proposalVersions.versionNumber));
  const allProducts = proposal.series
    ? await db.select().from(products).where(and(eq(products.active, true), eq(products.series, proposal.series)))
    : await db.select().from(products).where(eq(products.active, true));

  const enabledOptionIds = new Set(
    lineItems.map((li) => li.sourceOptionId).filter((v): v is number => v !== null)
  );
  const optionRows = proposal.series
    ? await db
        .select({
          id: productOptions.id,
          label: productOptions.label,
          description: productOptions.description,
          itemCount: sql<number>`count(${productOptionItems.id})`,
        })
        .from(productOptions)
        .leftJoin(productOptionItems, eq(productOptionItems.optionId, productOptions.id))
        .where(and(eq(productOptions.series, proposal.series), eq(productOptions.active, true)))
        .groupBy(productOptions.id, productOptions.label, productOptions.description, productOptions.sortOrder)
        .orderBy(productOptions.sortOrder)
    : [];
  const optionsForPanel = optionRows.map((o) => ({
    id: o.id,
    label: o.label,
    description: o.description,
    itemCount: Number(o.itemCount),
    enabled: enabledOptionIds.has(o.id),
  }));
  const proposalInvoices = await db.select().from(invoices).where(eq(invoices.proposalId, proposalId));

  const session = await getSession();
  const canViewBom = session ? roleCan(session.role, CAN_VIEW_BOM) : false;
  const isDraft = proposal.status === "draft";

  const sections = Array.from(new Set(lineItems.map((li) => li.sectionName)));

  const boundAdd = addLineItem.bind(null, proposalId);
  const boundRemove = removeLineItem.bind(null, proposalId);
  const boundMeta = updateProposalMeta.bind(null, proposalId);
  const boundSend = sendProposal.bind(null, proposalId);
  const boundAccept = markAccepted.bind(null, proposalId);
  const boundDecline = markDeclined.bind(null, proposalId);
  const boundRevise = createRevision.bind(null, proposalId);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-sm text-slate-400 mb-1">
          <Link href="/proposals" className="hover:underline">Proposals</Link> / {proposal.proposalNumber}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {proposal.proposalNumber} <span className="text-slate-400 font-normal text-lg">rev {proposal.revisionNumber}</span>
            </h1>
            {proposal.series && (
              <span className="inline-block mt-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full px-3 py-1">
                {seriesLabels[proposal.series]}
              </span>
            )}
            <p className="text-slate-500 text-sm mt-1">
              <Link href={`/projects/${proposal.projectId}`} className="hover:underline">{project?.name}</Link>
              {" · "}
              <Link href={`/customers/${proposal.customerId}`} className="hover:underline">{customer?.legalName}</Link>
            </p>
          </div>
          <span className="text-xs uppercase tracking-wide bg-slate-100 text-slate-600 rounded-full px-3 py-1">
            {proposal.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/proposals/${proposalId}/pdf`}
          target="_blank"
          className="rounded-md border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50"
        >
          Download PDF
        </a>
        {isDraft && (
          <form action={boundSend}>
            <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
              Send proposal
            </button>
          </form>
        )}
        {proposal.status === "sent" && (
          <>
            <form action={boundAccept}>
              <button type="submit" className="rounded-md bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700">
                Mark accepted
              </button>
            </form>
            <form action={boundDecline}>
              <button type="submit" className="rounded-md border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50">
                Mark declined
              </button>
            </form>
          </>
        )}
        {!isDraft && (
          <form action={boundRevise}>
            <button type="submit" className="rounded-md border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50">
              Create revision
            </button>
          </form>
        )}
        {!isDraft && <SendForSignatureButton proposalId={proposalId} status={proposal.pandadocStatus} />}
      </div>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Line items</h2>
        {sections.map((section) => (
          <div key={section} className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{section}</h3>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-1 font-normal">Description</th>
                  <th className="py-1 font-normal text-right">Qty</th>
                  <th className="py-1 font-normal text-right">Unit price</th>
                  <th className="py-1 font-normal text-right">Total</th>
                  {isDraft && <th className="py-1"></th>}
                </tr>
              </thead>
              <tbody>
                {lineItems.filter((li) => li.sectionName === section).map((li) => (
                  <tr key={li.id} className="border-t border-slate-100 align-top">
                    <td className="py-2">
                      {li.description}
                      {canViewBom && Array.isArray(li.computedBom) && (li.computedBom as never[]).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-slate-400 cursor-pointer">Hardware / BOM (fulfillment only)</summary>
                          <ul className="text-xs text-slate-500 mt-1 list-disc list-inside">
                            {(li.computedBom as { componentName: string; totalQuantity: number; unit: string }[]).map((b, i) => (
                              <li key={i}>{b.componentName}: {b.totalQuantity} {b.unit}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td className="py-2 text-right">{li.quantity}</td>
                    <td className="py-2 text-right">${Number(li.unitPrice).toFixed(2)}</td>
                    <td className="py-2 text-right">${Number(li.lineTotal).toFixed(2)}</td>
                    {isDraft && (
                      <td className="py-2 text-right">
                        <form action={boundRemove.bind(null, li.id)}>
                          <button className="text-xs text-red-500 hover:underline">Remove</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {lineItems.length === 0 && <p className="text-sm text-slate-400 mb-4">No line items yet.</p>}

        {isDraft && optionsForPanel.length > 0 && (
          <div className="mb-4">
            <ProposalOptionsPanel proposalId={proposalId} options={optionsForPanel} />
          </div>
        )}

        {isDraft && (
          <AddLineItemForm
            action={boundAdd}
            products={allProducts as never}
            seriesLabel={proposal.series ? seriesLabels[proposal.series] : undefined}
          />
        )}
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Totals &amp; terms</h2>
        {isDraft ? (
          <form action={boundMeta} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <MoneyField label="Discount" name="discountTotal" defaultValue={proposal.discountTotal} />
              <MoneyField label="Freight" name="freightTotal" defaultValue={proposal.freightTotal} />
              <MoneyField label="Tax" name="taxTotal" defaultValue={proposal.taxTotal} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deposit %</label>
                <input type="number" step="1" min="0" max="100" name="depositPercentage" defaultValue={proposal.depositPercentage} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (customer-facing)</label>
              <textarea name="notes" defaultValue={proposal.notes ?? ""} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Terms &amp; conditions</label>
              <textarea name="termsAndConditions" defaultValue={proposal.termsAndConditions ?? ""} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
                Save totals &amp; terms
              </button>
            </div>
          </form>
        ) : null}
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-1 text-sm max-w-xs ml-auto">
          <Row label="Subtotal" value={proposal.subtotal} />
          <Row label="Discount" value={`-${proposal.discountTotal}`} />
          <Row label="Freight" value={proposal.freightTotal} />
          <Row label="Tax" value={proposal.taxTotal} />
          <Row label="Total" value={proposal.total} bold />
        </div>
      </section>

      {proposal.status === "accepted" && (
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Invoicing (QuickBooks Online)</h2>
          <InvoiceActions proposalId={proposalId} invoices={proposalInvoices} depositPercentage={proposal.depositPercentage} />
        </section>
      )}

      {versions.length > 0 && (
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Version history</h2>
          <ul className="text-sm space-y-2">
            {versions.map((v) => (
              <li key={v.id} className="flex justify-between border-b border-slate-100 pb-2">
                <span>Version {v.versionNumber}</span>
                <span className="text-slate-400">{new Date(v.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function MoneyField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type="number" step="0.01" name={name} defaultValue={defaultValue} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-slate-900 text-base" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>${Number(value).toFixed(2)}</span>
    </div>
  );
}
