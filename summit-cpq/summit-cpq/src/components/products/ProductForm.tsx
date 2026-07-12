"use client";

import { useState } from "react";
import type { DimensionField, BomFormulaEntry } from "@/lib/bom";

type Vendor = { id: number; name: string; type: string };
type ProductDefaults = {
  sku?: string;
  name?: string;
  customerFacingName?: string | null;
  category?: string | null;
  description?: string | null;
  customerFacingDescription?: string | null;
  unitPrice?: string;
  unitCost?: string;
  dimensionFields?: DimensionField[];
  bomFormula?: BomFormulaEntry[];
  thirdPartySourced?: boolean;
  sourcingVendorId?: number | null;
  requiresFreightQuote?: boolean;
  freightVendorId?: number | null;
  active?: boolean;
};

export default function ProductForm({
  action,
  vendors,
  defaults,
}: {
  action: (formData: FormData) => void;
  vendors: Vendor[];
  defaults?: ProductDefaults;
}) {
  const d = defaults || {};
  const [dimensionFields, setDimensionFields] = useState<DimensionField[]>(d.dimensionFields || []);
  const [bomFormula, setBomFormula] = useState<BomFormulaEntry[]>(d.bomFormula || []);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="dimensionFieldsJson" value={JSON.stringify(dimensionFields)} readOnly />
      <input type="hidden" name="bomFormulaJson" value={JSON.stringify(bomFormula)} readOnly />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
          <input name="sku" defaultValue={d.sku} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Internal name *</label>
          <input name="name" defaultValue={d.name} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Customer-facing name</label>
          <input name="customerFacingName" defaultValue={d.customerFacingName ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input name="category" defaultValue={d.category ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Internal description</label>
        <textarea name="description" defaultValue={d.description ?? ""} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Customer-facing description</label>
        <textarea name="customerFacingDescription" defaultValue={d.customerFacingDescription ?? ""} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unit price ($)</label>
          <input name="unitPrice" type="number" step="0.01" defaultValue={d.unitPrice ?? "0"} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unit cost ($)</label>
          <input name="unitCost" type="number" step="0.01" defaultValue={d.unitCost ?? "0"} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Dimension fields editor */}
      <div className="border border-slate-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-800">Dimensions used on a proposal line</h3>
          <button
            type="button"
            onClick={() => setDimensionFields([...dimensionFields, { key: "", label: "", unit: "" }])}
            className="text-xs text-slate-600 hover:underline"
          >
            + Add dimension
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          E.g. key <code>length_ft</code>, label &quot;Length (ft)&quot;. These become variables you can use in the BOM formulas below.
        </p>
        {dimensionFields.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 mb-2">
            <input
              placeholder="key (e.g. length_ft)"
              value={f.key}
              onChange={(e) => {
                const next = [...dimensionFields];
                next[i] = { ...next[i], key: e.target.value };
                setDimensionFields(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              placeholder="label"
              value={f.label}
              onChange={(e) => {
                const next = [...dimensionFields];
                next[i] = { ...next[i], label: e.target.value };
                setDimensionFields(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              placeholder="unit"
              value={f.unit || ""}
              onChange={(e) => {
                const next = [...dimensionFields];
                next[i] = { ...next[i], unit: e.target.value };
                setDimensionFields(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
            <button type="button" onClick={() => setDimensionFields(dimensionFields.filter((_, idx) => idx !== i))} className="text-red-500 text-sm">
              ✕
            </button>
          </div>
        ))}
        {dimensionFields.length === 0 && <p className="text-xs text-slate-400">No dimensions — this product uses a fixed quantity only.</p>}
      </div>

      {/* BOM formula editor */}
      <div className="border border-slate-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-800">Hardware / BOM formulas (hidden from customer)</h3>
          <button
            type="button"
            onClick={() => setBomFormula([...bomFormula, { componentName: "", unit: "each", formula: "" }])}
            className="text-xs text-slate-600 hover:underline"
          >
            + Add component
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Formula can use dimension keys above plus <code>quantity</code> (the line quantity), e.g. <code>ceil(length_ft * 2) + 4</code>. Fulfillment sees the computed result on each proposal.
        </p>
        {bomFormula.map((b, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_1fr_32px] gap-2 mb-2">
            <input
              placeholder="Component (e.g. 3/8 in bolt)"
              value={b.componentName}
              onChange={(e) => {
                const next = [...bomFormula];
                next[i] = { ...next[i], componentName: e.target.value };
                setBomFormula(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              placeholder="unit"
              value={b.unit}
              onChange={(e) => {
                const next = [...bomFormula];
                next[i] = { ...next[i], unit: e.target.value };
                setBomFormula(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              placeholder="formula, e.g. length_ft * 2 + 4"
              value={b.formula}
              onChange={(e) => {
                const next = [...bomFormula];
                next[i] = { ...next[i], formula: e.target.value };
                setBomFormula(next);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm font-mono"
            />
            <button type="button" onClick={() => setBomFormula(bomFormula.filter((_, idx) => idx !== i))} className="text-red-500 text-sm">
              ✕
            </button>
          </div>
        ))}
        {bomFormula.length === 0 && <p className="text-xs text-slate-400">No BOM components defined yet.</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="thirdPartySourced" defaultChecked={!!d.thirdPartySourced} /> Third-party sourced
          </label>
          <select name="sourcingVendorId" defaultValue={d.sourcingVendorId ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No sourcing vendor</option>
            {vendors.filter((v) => v.type !== "freight").map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="requiresFreightQuote" defaultChecked={!!d.requiresFreightQuote} /> Requires freight quote
          </label>
          <select name="freightVendorId" defaultValue={d.freightVendorId ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">No freight vendor</option>
            {vendors.filter((v) => v.type !== "sourcing").map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="active" defaultChecked={d.active !== false} /> Active
      </label>

      <div className="flex justify-end">
        <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
          Save product
        </button>
      </div>
    </form>
  );
}
