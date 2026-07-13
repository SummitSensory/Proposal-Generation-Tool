import { db } from "@/db";
import { projects, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createProposal } from "@/lib/actions/proposals";
import Link from "next/link";

const SERIES_OPTIONS = [
  { value: "adventure", label: "Summit Adventure Series" },
  { value: "soar", label: "Summit Soar" },
  { value: "flex", label: "Summit Flex" },
  { value: "scape", label: "Summit Scape" },
  { value: "safe", label: "Summit Safe" },
];

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
      {rows.length === 0 && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          You don&apos;t have any projects yet. <Link href="/projects/new" className="underline">Create a project</Link> first
          (which needs a customer — <Link href="/customers/new" className="underline">create one</Link> if you don&apos;t have any).
        </p>
      )}
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Proposal type *</label>
          <div className="grid grid-cols-1 gap-2">
            {SERIES_OPTIONS.map((opt, i) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
              >
                <input type="radio" name="series" value={opt.value} required defaultChecked={i === 0} />
                {opt.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Determines which products are available when you build this proposal — you can't change it after creating the proposal.
          </p>
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
