import { db } from "@/db";
import { productOptions, productOptionItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateOption } from "@/lib/actions/productOptions";
import OptionForm from "@/components/options/OptionForm";
import Link from "next/link";

export default async function OptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const optionId = Number(id);
  const [option] = await db.select().from(productOptions).where(eq(productOptions.id, optionId)).limit(1);
  if (!option) notFound();

  const items = await db
    .select({ productId: productOptionItems.productId, quantity: productOptionItems.quantity })
    .from(productOptionItems)
    .where(eq(productOptionItems.optionId, optionId))
    .orderBy(productOptionItems.sortOrder);

  const allProducts = await db
    .select({ id: products.id, sku: products.sku, name: products.name })
    .from(products)
    .where(eq(products.series, option.series));

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-slate-400 mb-1">
        <Link href="/options" className="hover:underline">Proposal Options</Link> / {option.label}
      </p>
      <h1 className="text-2xl font-semibold mb-6">{option.label}</h1>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <OptionForm
          action={updateOption.bind(null, optionId)}
          products={allProducts}
          isNew={false}
          defaults={{ ...option, items }}
        />
      </div>
    </div>
  );
}
