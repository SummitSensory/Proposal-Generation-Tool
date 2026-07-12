import { db } from "@/db";
import { projects, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createProposal } from "@/lib/actions/proposals";

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const rows = await db
    .select({ id: projects.id, name: projects.name, customerName: customers.legalName })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id));

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">New proposal</h1>
      <form action={createProposal} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Project *</label>
          <select name="projectId" defaultValue={projectId} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a project...</option>
            {rows.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.customerName}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Create draft proposal
          </button>
        </div>
      </form>
    </div>
  );
}
