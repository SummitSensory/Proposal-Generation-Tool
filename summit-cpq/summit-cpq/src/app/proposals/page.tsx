import Link from "next/link";
import { db } from "@/db";
import { proposals, customers, projects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function ProposalsPage() {
  const rows = await db
    .select({
      id: proposals.id,
      proposalNumber: proposals.proposalNumber,
      revisionNumber: proposals.revisionNumber,
      status: proposals.status,
      total: proposals.total,
      customerName: customers.legalName,
      projectName: projects.name,
    })
    .from(proposals)
    .leftJoin(customers, eq(proposals.customerId, customers.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .orderBy(desc(proposals.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Proposals</h1>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Number</th>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/proposals/${p.id}`} className="font-medium text-slate-900 hover:underline">
                    {p.proposalNumber} <span className="text-slate-400 font-normal">rev {p.revisionNumber}</span>
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{p.projectName}</td>
                <td className="px-4 py-2 text-slate-600">{p.customerName}</td>
                <td className="px-4 py-2"><span className="text-xs uppercase tracking-wide text-slate-500">{p.status.replace("_"," ")}</span></td>
                <td className="px-4 py-2 text-right text-slate-900">${Number(p.total).toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No proposals yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
