import Link from "next/link";
import { db } from "@/db";
import { products, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";

const SERIES_LABELS: Record<string, string> = {
  adventure: "Adventure",
  soar: "Soar",
  flex: "Flex",
  scape: "Scape",
  safe: "Safe",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ series?: string }>;
}) {
  const { series } = await searchParams;
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      category: products.category,
      series: products.series,
      unitPrice: products.unitPrice,
      active: products.active,
      vendorName: vendors.name,
    })
    .from(products)
    .leftJoin(vendors, eq(products.sourcingVendorId, vendors.id));

  const filtered = series ? rows.filter((p) => p.series === series) : rows;
  const missingVendorCount = rows.filter((p) => !p.vendorName).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/products/new" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
          + New product
        </Link>
      </div>

      {missingVendorCount > 0 && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {missingVendorCount} product(s) have no vendor assigned yet — open each and set a vendor so vendor order
          reports generate correctly.
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/products"
          className={`text-xs font-medium rounded-full px-3 py-1 border ${!series ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
        >
          All ({rows.length})
        </Link>
        {Object.entries(SERIES_LABELS).map(([value, label]) => {
          const count = rows.filter((p) => p.series === value).length;
          return (
            <Link
              key={value}
              href={`/products?series=${value}`}
              className={`text-xs font-medium rounded-full px-3 py-1 border ${series === value ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
            >
              {label} ({count})
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">SKU</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Series</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Vendor</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{p.sku}</td>
                <td className="px-4 py-2">
                  <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{SERIES_LABELS[p.series] || p.series}</td>
                <td className="px-4 py-2 text-slate-600">{p.category || "—"}</td>
                <td className="px-4 py-2">
                  {p.vendorName ? (
                    <span className="text-slate-600">{p.vendorName}</span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 text-xs">Needs vendor</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">${Number(p.unitPrice).toFixed(2)}</td>
                <td className="px-4 py-2 text-slate-600">{p.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
