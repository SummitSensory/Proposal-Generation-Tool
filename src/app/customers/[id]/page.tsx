import { db } from "@/db";
import { customers, contacts, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateCustomer, addContact, deleteContact } from "@/lib/actions/customers";
import CustomerFormFields from "@/components/customers/CustomerFormFields";
import Link from "next/link";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = Number(id);
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  if (!customer) notFound();

  const customerContacts = await db.select().from(contacts).where(eq(contacts.customerId, customerId));
  const customerProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.customerId, customerId))
    .orderBy(desc(projects.createdAt));

  const boundUpdate = updateCustomer.bind(null, customerId);
  const boundAddContact = addContact.bind(null, customerId);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-slate-400 mb-1">
          <Link href="/customers" className="hover:underline">Customers</Link> / {customer.legalName}
        </p>
        <h1 className="text-2xl font-semibold">{customer.legalName}</h1>
      </div>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Customer details</h2>
        <form action={boundUpdate} className="space-y-6">
          <CustomerFormFields defaults={customer} />
          <div className="flex justify-end">
            <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
              Save changes
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Contacts</h2>
        <div className="divide-y divide-slate-100 mb-6">
          {customerContacts.map((c) => (
            <div key={c.id} className="py-3 flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">
                  {c.name} {c.title ? <span className="text-slate-400 font-normal">— {c.title}</span> : null}
                </p>
                <p className="text-sm text-slate-500">
                  {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact info"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {[
                    c.isPrimary && "Primary",
                    c.isBilling && "Billing",
                    c.isDecisionMaker && "Decision-maker",
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              <form action={deleteContact.bind(null, customerId, c.id)}>
                <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
              </form>
            </div>
          ))}
          {customerContacts.length === 0 && <p className="text-sm text-slate-400 py-3">No contacts yet.</p>}
        </div>

        <details className="border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">+ Add a contact</summary>
          <form action={boundAddContact} className="grid grid-cols-2 gap-4 mt-4">
            <input name="name" placeholder="Name *" required className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="title" placeholder="Title" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="email" placeholder="Email" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="phone" placeholder="Phone" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <div className="flex items-center gap-4 col-span-2 text-sm text-slate-600">
              <label className="flex items-center gap-1"><input type="checkbox" name="isPrimary" /> Primary</label>
              <label className="flex items-center gap-1"><input type="checkbox" name="isBilling" /> Billing</label>
              <label className="flex items-center gap-1"><input type="checkbox" name="isDecisionMaker" /> Decision-maker</label>
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
                Add contact
              </button>
            </div>
          </form>
        </details>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Link href={`/projects/new?customerId=${customerId}`} className="text-sm text-slate-600 hover:underline">
            + New project
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {customerProjects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="py-3 flex items-center justify-between block hover:bg-slate-50 -mx-2 px-2 rounded">
              <span className="font-medium text-slate-900">{p.name}</span>
              <span className="text-xs uppercase tracking-wide text-slate-500">{p.status.replace("_", " ")}</span>
            </Link>
          ))}
          {customerProjects.length === 0 && <p className="text-sm text-slate-400 py-3">No projects yet.</p>}
        </div>
      </section>
    </div>
  );
}
