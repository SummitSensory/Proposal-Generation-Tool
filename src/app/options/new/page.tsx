import { db } from "@/db";
import { products } from "@/db/schema";
import { createOption } from "@/lib/actions/productOptions";
import OptionForm from "@/components/options/OptionForm";

export default async function NewOptionPage() {
  const allProducts = await db.select({ id: products.id, sku: products.sku, name: products.name }).from(products);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">New proposal option</h1>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <OptionForm action={createOption} products={allProducts} isNew />
      </div>
    </div>
  );
}
