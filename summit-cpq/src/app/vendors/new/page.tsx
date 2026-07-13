import { createVendor } from "@/lib/actions/vendors";

export default function NewVendorPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">New vendor</h1>
      <form action={createVendor} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vendor name *</label>
          <input name="name" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <select name="type" defaultValue="sourcing" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="sourcing">Sourcing (fulfillment)</option>
            <option value="freight">Freight (shipping quotes)</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contact name</label>
          <input name="contactName" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contact email</label>
          <input name="contactEmail" type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contact phone</label>
          <input name="contactPhone" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea name="notes" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Save vendor
          </button>
        </div>
      </form>
    </div>
  );
}
