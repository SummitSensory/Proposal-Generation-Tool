"use client";

import { useMemo, useState } from "react";

type DimensionField = { key: string; label: string; unit?: string };
type Product = {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  customerFacingName: string | null;
  unitPrice: string;
  dimensionFields: DimensionField[];
};

export default function AddLineItemForm({
  action,
  products,
  seriesLabel,
}: {
  action: (formData: FormData) => void;
  products: Product[];
  seriesLabel?: string;
}) {
  const [productId, setProductId] = useState<string>("");
  const [customMode, setCustomMode] = useState(false);
  const [query, setQuery] = useState("");

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === productId),
    [productId, products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [query, products]);

  return (
    <form action={action} className="border-t border-slate-100 pt-4 space-y-3">
      {seriesLabel && (
        <p className="text-xs text-slate-500">
          Showing {seriesLabel} products only ({products.length} available).
        </p>
      )}

      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" checked={!customMode} onChange={() => setCustomMode(false)} /> From product catalog
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={customMode} onChange={() => setCustomMode(true)} /> Custom line item
        </label>
      </div>

      <input type="text" name="sectionName" placeholder="Section (e.g. Products, Installation)" defaultValue="Products" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />

      {!customMode ? (
        <>
          {selectedProduct ? (
            <div className="flex items-center justify-between rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{selectedProduct.sku}</span> — {selectedProduct.name}
                <span className="text-slate-500"> · ${Number(selectedProduct.unitPrice).toFixed(2)}</span>
              </span>
              <button type="button" onClick={() => { setProductId(""); setQuery(""); }} className="text-xs text-slate-500 hover:underline">
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search by SKU, name, or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
                {filtered.slice(0, 60).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(String(p.id))}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>
                      <span className="font-medium">{p.sku}</span> — {p.name}
                      {p.category && <span className="text-slate-400 text-xs ml-2">{p.category}</span>}
                    </span>
                    <span className="text-slate-500 text-xs shrink-0 ml-2">${Number(p.unitPrice).toFixed(2)}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="px-3 py-4 text-center text-slate-400 text-sm">No matching products.</p>
                )}
                {filtered.length > 60 && (
                  <p className="px-3 py-2 text-center text-slate-400 text-xs">Showing first 60 — keep typing to narrow it down.</p>
                )}
              </div>
              <input type="hidden" name="productId" value={productId} required />
            </>
          )}

          {selectedProduct && selectedProduct.dimensionFields?.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {selectedProduct.dimensionFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-500 mb-1">{f.label} {f.unit ? `(${f.unit})` : ""}</label>
                  <input
                    type="number"
                    step="0.01"
                    name={`dim_${f.key}`}
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          )}
          {selectedProduct && <input type="hidden" name="productId" value={productId} />}
        </>
      ) : (
        <>
          <input type="text" name="description" placeholder="Description" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" step="0.01" name="unitPrice" placeholder="Unit price" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </>
      )}

      <div className="grid grid-cols-[120px_1fr] gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Quantity</label>
          <input type="number" step="1" min="1" name="quantity" defaultValue="1" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={!customMode && !productId} className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50">
            Add line item
          </button>
        </div>
      </div>
    </form>
  );
}
