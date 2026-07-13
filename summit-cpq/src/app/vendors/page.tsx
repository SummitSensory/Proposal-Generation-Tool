import Link from "next/link";
import { db } from "@/db";
import { vendors } from "@/db/schema";

export default async function VendorsPage() {
  const all = await db.select().from(vendors);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <Link href="/vendors/new" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
          + New vendor
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {all.map((v) => (
              <tr key={v.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{v.name}</td>
                <td className="px-4 py-2 text-slate-600 capitalize">{v.type}</td>
                <td className="px-4 py-2 text-slate-600">{v.contactEmail || v.contactName || "—"}</td>
              </tr>
            ))}
            {all.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No vendors yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
