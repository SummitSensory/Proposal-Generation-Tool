import Link from "next/link";
import { db } from "@/db";
import { projects, customers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function ProjectsPage() {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      customerName: customers.legalName,
      targetInstallDate: projects.targetInstallDate,
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
        >
          + New project
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/projects/${p.id}`} className="font-medium text-slate-900 hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{p.customerName}</td>
                <td className="px-4 py-2">
                  <span className="text-xs uppercase tracking-wide text-slate-500">{p.status.replace("_", " ")}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
