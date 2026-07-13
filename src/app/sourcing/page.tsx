import { db } from "@/db";
import {
  sourcingItems, proposalLineItems, proposals, projects, customers, vendors,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateSourcingStatus } from "@/lib/actions/sourcing";

const STATUS_LABELS: Record<string, string> = {
  not_ordered: "Not ordered",
  ordered: "Ordered",
  confirmed: "Confirmed",
  received: "Received",
};

const STATUS_COLORS: Record<string, string> = {
  not_ordered: "bg-amber-100 text-amber-800",
  ordered: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  received: "bg-emerald-100 text-emerald-800",
};

export default async function SourcingPage() {
  const rows = await db
    .select({
      id: sourcingItems.id,
      status: sourcingItems.status,
      notes: sourcingItems.notes,
      itemDescription: proposalLineItems.description,
      proposalNumber: proposals.proposalNumber,
      projectName: projects.name,
      customerName: customers.legalName,
      vendorName: vendors.name,
    })
    .from(sourcingItems)
    .leftJoin(proposalLineItems, eq(sourcingItems.lineItemId, proposalLineItems.id))
    .leftJoin(proposals, eq(sourcingItems.proposalId, proposals.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .leftJoin(customers, eq(proposals.customerId, customers.id))
    .leftJoin(vendors, eq(sourcingItems.vendorId, vendors.id))
    .orderBy(desc(sourcingItems.updatedAt));

  const outstanding = rows.filter((r) => r.status === "not_ordered").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Third-Party Sourcing</h1>
      <p className="text-slate-500 text-sm mb-6">
        {outstanding > 0 ? (
          <span className="text-amber-700 font-medium">{outstanding} item{outstanding !== 1 ? "s" : ""} not yet ordered</span>
        ) : (
          "All sourced items are ordered or beyond."
        )}
      </p>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <p className="font-medium text-slate-900">{r.itemDescription}</p>
                  <p className="text-xs text-slate-400">{r.proposalNumber}</p>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {r.projectName}
                  <p className="text-xs text-slate-400">{r.customerName}</p>
                </td>
                <td className="px-4 py-2 text-slate-600">{r.vendorName || "—"}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs rounded-full px-2 py-1 ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                </td>
                <td className="px-4 py-2">
                  <form action={updateSourcingStatus.bind(null, r.id)} className="flex gap-2">
                    <select name="status" defaultValue={r.status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                      <option value="not_ordered">Not ordered</option>
                      <option value="ordered">Ordered</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="received">Received</option>
                    </select>
                    <button type="submit" className="text-xs rounded-md bg-slate-900 text-white px-2 py-1">Update</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No third-party sourced items yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
