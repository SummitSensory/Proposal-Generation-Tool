import Link from "next/link";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function CustomersPage() {
  const allCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link
          href="/customers/new"
          className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
        >
          + New customer
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Legal name</th>
              <th className="px-4 py-2 font-medium">DBA</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">Tax-exempt</th>
            </tr>
          </thead>
          <tbody>
            {allCustomers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/customers/${c.id}`} className="text-slate-900 font-medium hover:underline">
                    {c.legalName}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{c.dba || "—"}</td>
                <td className="px-4 py-2 text-slate-600">{c.phone || "—"}</td>
                <td className="px-4 py-2 text-slate-600">{c.taxExempt ? "Yes" : "No"}</td>
              </tr>
            ))}
            {allCustomers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
