import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";

export default async function ProductsPage() {
  const all = await db.select().from(products);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/products/new" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
          + New product
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {all.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.sku}</td>
                <td className="px-4 py-2">
                  <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{p.category || "—"}</td>
                <td className="px-4 py-2 text-slate-600">${Number(p.unitPrice).toFixed(2)}</td>
                <td className="px-4 py-2 text-slate-600">{p.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
            {all.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
