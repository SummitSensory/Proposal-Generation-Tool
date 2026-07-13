import { db } from "@/db";
import { customers } from "@/db/schema";
import { createProject } from "@/lib/actions/projects";
import Link from "next/link";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const allCustomers = await db.select().from(customers);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">New project</h1>
      {allCustomers.length === 0 && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          You don&apos;t have any customers yet. <Link href="/customers/new" className="underline">Create one manually</Link>, or
          go to the <Link href="/customers" className="underline">Customers page</Link> and click &quot;Sync from Monday.com&quot;.
        </p>
      )}
      <form action={createProject} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
          <select name="customerId" defaultValue={customerId} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select a customer...</option>
            {allCustomers.map((c) => (
              <option key={c.id} value={c.id}>{c.legalName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Project name *</label>
          <input name="name" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location / site address</label>
          <textarea name="location" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select name="status" defaultValue="lead" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="lead">Lead</option>
            <option value="quoted">Quoted</option>
            <option value="sold">Sold</option>
            <option value="in_production">In production</option>
            <option value="installed">Installed</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea name="notes" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Save project
          </button>
        </div>
      </form>
    </div>
  );
}
