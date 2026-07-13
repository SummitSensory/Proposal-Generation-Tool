import { db } from "@/db";
import {
  freightRequests, proposalLineItems, proposals, projects, customers, vendors,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { markFreightRequested, updateFreightStatus } from "@/lib/actions/freight";

const STATUS_LABELS: Record<string, string> = {
  not_sent: "Not yet sent",
  requested: "Requested",
  awaiting_response: "Awaiting response",
  received: "Received",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  not_sent: "bg-red-100 text-red-800",
  requested: "bg-blue-100 text-blue-800",
  awaiting_response: "bg-amber-100 text-amber-800",
  received: "bg-emerald-100 text-emerald-800",
  expired: "bg-slate-200 text-slate-600",
};

export default async function FreightPage() {
  const rows = await db
    .select({
      id: freightRequests.id,
      status: freightRequests.status,
      quotedAmount: freightRequests.quotedAmount,
      itemDescription: proposalLineItems.description,
      proposalNumber: proposals.proposalNumber,
      projectName: projects.name,
      customerName: customers.legalName,
      vendorName: vendors.name,
      vendorEmail: vendors.contactEmail,
    })
    .from(freightRequests)
    .leftJoin(proposalLineItems, eq(freightRequests.lineItemId, proposalLineItems.id))
    .leftJoin(proposals, eq(freightRequests.proposalId, proposals.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .leftJoin(customers, eq(proposals.customerId, customers.id))
    .leftJoin(vendors, eq(freightRequests.vendorId, vendors.id))
    .orderBy(desc(freightRequests.updatedAt));

  const notSent = rows.filter((r) => r.status === "not_sent").length;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Freight Requests</h1>
      <p className="text-slate-500 text-sm mb-6">
        {notSent > 0 ? (
          <span className="text-red-700 font-medium">{notSent} item{notSent !== 1 ? "s" : ""} still need a freight request sent</span>
        ) : (
          "All freight requests have been sent."
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
              <th className="px-4 py-2 font-medium">Action</th>
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
                <td className="px-4 py-2 text-slate-600">
                  {r.vendorName || "—"}
                  {r.vendorEmail && <p className="text-xs text-slate-400">{r.vendorEmail}</p>}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs rounded-full px-2 py-1 ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                  {r.quotedAmount && <p className="text-xs text-slate-500 mt-1">${Number(r.quotedAmount).toFixed(2)}</p>}
                </td>
                <td className="px-4 py-2">
                  {r.status === "not_sent" ? (
                    <form action={markFreightRequested.bind(null, r.id)}>
                      <button type="submit" className="text-xs rounded-md bg-slate-900 text-white px-2 py-1">Mark sent</button>
                    </form>
                  ) : (
                    <form action={updateFreightStatus.bind(null, r.id)} className="flex flex-wrap gap-1 items-center">
                      <select name="status" defaultValue={r.status} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                        <option value="requested">Requested</option>
                        <option value="awaiting_response">Awaiting response</option>
                        <option value="received">Received</option>
                        <option value="expired">Expired</option>
                      </select>
                      <input name="quotedAmount" type="number" step="0.01" placeholder="Quote $" className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs" />
                      <button type="submit" className="text-xs rounded-md bg-slate-900 text-white px-2 py-1">Update</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No freight requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
