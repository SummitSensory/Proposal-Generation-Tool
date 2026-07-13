import { createCustomer } from "@/lib/actions/customers";
import CustomerFormFields from "@/components/customers/CustomerFormFields";

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">New customer</h1>
      <form action={createCustomer} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <CustomerFormFields />
        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Save customer
          </button>
        </div>
      </form>
    </div>
  );
}
