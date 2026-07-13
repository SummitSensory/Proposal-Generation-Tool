type Customer = {
  legalName?: string | null;
  dba?: string | null;
  customerType?: string | null;
  industry?: string | null;
  phone?: string | null;
  website?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  projectAddress?: string | null;
  taxExempt?: boolean | null;
  notes?: string | null;
};

export default function CustomerFormFields({ defaults }: { defaults?: Customer }) {
  const d = defaults || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Legal name *" name="legalName" defaultValue={d.legalName ?? ""} required />
        <Field label="DBA (if different)" name="dba" defaultValue={d.dba ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer type" name="customerType" defaultValue={d.customerType ?? ""} placeholder="School, hospital, gym..." />
        <Field label="Industry" name="industry" defaultValue={d.industry ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" name="phone" defaultValue={d.phone ?? ""} />
        <Field label="Website" name="website" defaultValue={d.website ?? ""} />
      </div>
      <TextArea label="Billing address" name="billingAddress" defaultValue={d.billingAddress ?? ""} />
      <TextArea label="Shipping address" name="shippingAddress" defaultValue={d.shippingAddress ?? ""} />
      <TextArea label="Project / site address" name="projectAddress" defaultValue={d.projectAddress ?? ""} />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="taxExempt" defaultChecked={!!d.taxExempt} className="rounded border-slate-300" />
        Tax-exempt customer
      </label>
      <TextArea label="Internal notes" name="notes" defaultValue={d.notes ?? ""} />
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}

function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={2}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </div>
  );
}
