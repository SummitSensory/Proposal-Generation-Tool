import { db } from "@/db";
import { proposalLineItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { qboApiRequest } from "./client";
import { findOrCreateQboCustomer } from "./customers";

export type QboInvoiceResult = {
  qboInvoiceId: string;
  qboInvoiceNumber: string;
  totalAmount: number;
  balance: number;
};

/**
 * Creates a QuickBooks Online invoice for a proposal. `amount` is the dollar amount for
 * this specific invoice (deposit or final — see lib/actions/invoices.ts for how that's
 * computed from the proposal's depositPercentage), described generically as a single
 * line rather than itemizing every proposal line, since QBO items must be pre-mapped
 * per product (`products.qboItemId`) and not every install will have that configured yet.
 * If every line item DOES have a qboItemId, we itemize instead for better QBO-side reporting.
 */
export async function createQboInvoice(params: {
  customerId: number;
  proposalId: number;
  proposalNumber: string;
  description: string;
  amount: number;
}): Promise<QboInvoiceResult> {
  const qboCustomerId = await findOrCreateQboCustomer(params.customerId);

  const lineItems = await db.select().from(proposalLineItems).where(eq(proposalLineItems.proposalId, params.proposalId));

  // Check whether every line item's product has a QBO item mapped; if so, itemize
  // on the invoice instead of sending a single lump-sum line.
  let allMapped = lineItems.length > 0;
  const productMap = new Map<number, string>();
  for (const li of lineItems) {
    if (!li.productId) { allMapped = false; continue; }
    const [product] = await db.select().from(products).where(eq(products.id, li.productId)).limit(1);
    if (!product?.qboItemId) { allMapped = false; continue; }
    productMap.set(li.productId, product.qboItemId);
  }

  const Line = allMapped
    ? lineItems.map((li) => ({
        DetailType: "SalesItemLineDetail",
        Amount: Number(li.lineTotal),
        Description: li.description,
        SalesItemLineDetail: {
          ItemRef: { value: productMap.get(li.productId!) },
          Qty: Number(li.quantity),
          UnitPrice: Number(li.unitPrice),
        },
      }))
    : [
        {
          DetailType: "SalesItemLineDetail",
          Amount: params.amount,
          Description: params.description,
          SalesItemLineDetail: {
            // Falls back to QBO's default "Services" item when specific products
            // aren't mapped yet. Map products under Products > (product) > QBO item
            // once you've set up your QuickBooks item list, then re-run.
            ItemRef: { value: "1", name: "Services" },
            Qty: 1,
            UnitPrice: params.amount,
          },
        },
      ];

  const created = await qboApiRequest("invoice", {
    method: "POST",
    body: JSON.stringify({
      CustomerRef: { value: qboCustomerId },
      DocNumber: `${params.proposalNumber}`,
      PrivateNote: `Summit CPQ proposal ${params.proposalNumber}`,
      Line,
    }),
  });

  const invoice = created.Invoice;
  return {
    qboInvoiceId: invoice.Id,
    qboInvoiceNumber: invoice.DocNumber,
    totalAmount: invoice.TotalAmt,
    balance: invoice.Balance,
  };
}
