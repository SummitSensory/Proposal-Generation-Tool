"use client";

import { useMemo, useState } from "react";

type DimensionField = { key: string; label: string; unit?: string };
type Product = {
  id: number;
  sku: string;
  name: string;
  customerFacingName: string | null;
  unitPrice: string;
  dimensionFields: DimensionField[];
};

export default function AddLineItemForm({
  action,
  products,
}: {
  action: (formData: FormData) => void;
  products: Product[];
}) {
  const [productId, setProductId] = useState<string>("");
  const [customMode, setCustomMode] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === productId),
    [productId, products]
  );

  return (
    <form action={action} className="border-t border-slate-100 pt-4 space-y-3">
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
          <select
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required={!customMode}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
            ))}
          </select>

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
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Add line item
          </button>
        </div>
      </div>
    </form>
  );
}
