import Link from "next/link";
import { db } from "@/db";
import { productOptions, productOptionItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const SERIES_LABELS: Record<string, string> = {
  adventure: "Summit Adventure Series",
  soar: "Summit Soar",
  flex: "Summit Flex",
  scape: "Summit Scape",
  safe: "Summit Safe",
};
const SERIES_ORDER = ["adventure", "soar", "flex", "scape", "safe"];

export default async function OptionsPage() {
  const rows = await db
    .select({
      id: productOptions.id,
      series: productOptions.series,
      label: productOptions.label,
      description: productOptions.description,
      active: productOptions.active,
      itemCount: sql<number>`count(${productOptionItems.id})`,
    })
    .from(productOptions)
    .leftJoin(productOptionItems, eq(productOptionItems.optionId, productOptions.id))
    .groupBy(productOptions.id, productOptions.series, productOptions.label, productOptions.description, productOptions.active)
    .orderBy(productOptions.series, productOptions.sortOrder);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Proposal Options</h1>
        <Link href="/options/new" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
          + New option
        </Link>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        These are the toggleable add-ons (like &quot;Monkey Bars&quot;) shown when building a proposal. Turning one on
        for a proposal adds its bundle of products as line items; turning it off removes exactly those lines.
      </p>

      {SERIES_ORDER.map((series) => {
        const seriesOptions = rows.filter((r) => r.series === series);
        if (seriesOptions.length === 0) return null;
        return (
          <div key={series} className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{SERIES_LABELS[series]}</h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Label</th>
                    <th className="px-4 py-2 font-medium">Items</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesOptions.map((o) => (
                    <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link href={`/options/${o.id}`} className="font-medium text-slate-900 hover:underline">{o.label}</Link>
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {Number(o.itemCount) === 0 ? (
                          <span className="text-amber-700 bg-amber-50 rounded-full px-2 py-0.5 text-xs">No items yet</span>
                        ) : (
                          `${o.itemCount} item(s)`
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{o.active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {rows.length === 0 && <p className="text-slate-400">No options yet.</p>}
    </div>
  );
}
