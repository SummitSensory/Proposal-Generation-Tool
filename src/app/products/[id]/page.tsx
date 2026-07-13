import { db } from "@/db";
import { products, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateProduct } from "@/lib/actions/products";
import ProductForm from "@/components/products/ProductForm";
import Link from "next/link";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) notFound();
  const allVendors = await db.select().from(vendors);

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-slate-400 mb-1">
        <Link href="/products" className="hover:underline">Products</Link> / {product.name}
      </p>
      <h1 className="text-2xl font-semibold mb-6">{product.name}</h1>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <ProductForm
          action={updateProduct.bind(null, productId)}
          vendors={allVendors}
          defaults={{
            ...product,
            dimensionFields: product.dimensionFields as never,
            bomFormula: product.bomFormula as never,
            sourcingVendorId: product.sourcingVendorId,
            freightVendorId: product.freightVendorId,
          }}
        />
      </div>
    </div>
  );
}
