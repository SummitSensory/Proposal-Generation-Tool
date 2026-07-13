"use client";

import { useState } from "react";

type Product = { id: number; sku: string; name: string };
type Item = { productId: number | ""; quantity: string };

export default function OptionForm({
  action,
  products,
  defaults,
  isNew,
}: {
  action: (formData: FormData) => void;
  products: Product[];
  defaults?: {
    series?: string;
    key?: string;
    label?: string;
    description?: string | null;
    active?: boolean;
    items?: { productId: number; quantity: string }[];
  };
  isNew: boolean;
}) {
  const d = defaults || {};
  const [items, setItems] = useState<Item[]>(
    d.items && d.items.length > 0 ? d.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) : []
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} readOnly />

      {isNew && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Series *</label>
          <select name="series" defaultValue={d.series ?? "adventure"} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="adventure">Summit Adventure Series</option>
            <option value="soar">Summit Soar</option>
            <option value="flex">Summit Flex</option>
            <option value="scape">Summit Scape</option>
            <option value="safe">Summit Safe</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Label *</label>
        <input name="label" defaultValue={d.label} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <p className="text-xs text-slate-400 mt-1">Shown to sales as the toggle name, and as the proposal section title (e.g. &quot;Monkey Bars (Optional)&quot;).</p>
      </div>

      {isNew && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Key (internal)</label>
          <input name="key" defaultValue={d.key} placeholder="auto-generated from label if left blank" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea name="description" defaultValue={d.description ?? ""} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {!isNew && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked={d.active !== false} /> Active (selectable on new proposals)
        </label>
      )}

      <div className="border border-slate-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-800">Bundle items</h3>
          <button
            type="button"
            onClick={() => setItems([...items, { productId: "", quantity: "1" }])}
            className="text-xs text-slate-600 hover:underline"
          >
            + Add item
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          When this option is turned on for a proposal, these products/quantities are added as line items. Turning it off removes exactly these lines.
        </p>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_100px_32px] gap-2 mb-2">
            <select
              value={it.productId}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], productId: e.target.value ? Number(e.target.value) : "" };
                setItems(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="qty"
              value={it.quantity}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], quantity: e.target.value };
                setItems(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
            <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-500 text-sm">
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400">No items yet — add at least one before this option can be used on a proposal.</p>}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
          Save option
        </button>
      </div>
    </form>
  );
}
