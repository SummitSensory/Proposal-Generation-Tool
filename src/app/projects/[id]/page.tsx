import { db } from "@/db";
import { projects, customers, proposals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateProject } from "@/lib/actions/projects";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) notFound();
  const [customer] = await db.select().from(customers).where(eq(customers.id, project.customerId)).limit(1);
  const projectProposals = await db
    .select()
    .from(proposals)
    .where(eq(proposals.projectId, projectId))
    .orderBy(desc(proposals.createdAt));

  const boundUpdate = updateProject.bind(null, projectId);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-slate-400 mb-1">
          <Link href="/projects" className="hover:underline">Projects</Link> / {project.name}
        </p>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-slate-500 text-sm mt-1">
          <Link href={`/customers/${project.customerId}`} className="hover:underline">{customer?.legalName}</Link>
        </p>
      </div>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Project details</h2>
        <form action={boundUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project name *</label>
            <input name="name" defaultValue={project.name} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location / site address</label>
            <textarea name="location" defaultValue={project.location ?? ""} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select name="status" defaultValue={project.status} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
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
            <textarea name="notes" defaultValue={project.notes ?? ""} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Proposals</h2>
          <Link href={`/proposals/new?projectId=${projectId}`} className="text-sm text-slate-600 hover:underline">
            + New proposal
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {projectProposals.map((p) => (
            <Link key={p.id} href={`/proposals/${p.id}`} className="py-3 flex items-center justify-between block hover:bg-slate-50 -mx-2 px-2 rounded">
              <span className="font-medium text-slate-900">{p.proposalNumber} <span className="text-slate-400 font-normal">rev {p.revisionNumber}</span></span>
              <span className="text-xs uppercase tracking-wide text-slate-500">{p.status.replace("_", " ")}</span>
            </Link>
          ))}
          {projectProposals.length === 0 && <p className="text-sm text-slate-400 py-3">No proposals yet.</p>}
        </div>
      </section>
    </div>
  );
}
