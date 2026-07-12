import { db } from "@/db";
import { vendors } from "@/db/schema";
import { createProduct } from "@/lib/actions/products";
import ProductForm from "@/components/products/ProductForm";

export default async function NewProductPage() {
  const allVendors = await db.select().from(vendors);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">New product</h1>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <ProductForm action={createProduct} vendors={allVendors} />
      </div>
    </div>
  );
}
