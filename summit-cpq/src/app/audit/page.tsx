import { db } from "@/db";
import { auditLog, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    redirect("/");
  }

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      createdAt: auditLog.createdAt,
      userName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Audit Log</h1>
      <p className="text-slate-500 text-sm mb-6">Most recent 200 actions across the platform.</p>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-700">{r.userName || "System"}</td>
                <td className="px-4 py-2 text-slate-900 font-medium">{r.action}</td>
                <td className="px-4 py-2 text-slate-600">{r.entityType} #{r.entityId}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No activity recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
