"use client";

import { useState, useTransition } from "react";
import { createInvoiceForProposal, refreshInvoiceStatus } from "@/lib/actions/invoices";

type Invoice = {
  id: number;
  type: string;
  status: string;
  amount: string;
  qboInvoiceNumber: string | null;
  balanceDue: string | null;
};

export default function InvoiceActions({
  proposalId,
  invoices,
  depositPercentage,
}: {
  proposalId: number;
  invoices: Invoice[];
  depositPercentage: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasType = (type: string) => invoices.some((i) => i.type === type);

  function create(type: "deposit" | "final" | "full") {
    setError(null);
    startTransition(async () => {
      const result = await createInvoiceForProposal(proposalId, type);
      if (result.error) setError(result.error);
    });
  }

  function refresh(invoiceId: number) {
    startTransition(async () => {
      await refreshInvoiceStatus(invoiceId);
    });
  }

  return (
    <div className="space-y-3">
      {invoices.length > 0 && (
        <table className="w-full text-sm mb-2">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="font-normal py-1">Type</th>
              <th className="font-normal py-1">QBO #</th>
              <th className="font-normal py-1 text-right">Amount</th>
              <th className="font-normal py-1 text-right">Balance</th>
              <th className="font-normal py-1">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100">
                <td className="py-1 capitalize">{inv.type}</td>
                <td className="py-1">{inv.qboInvoiceNumber || "—"}</td>
                <td className="py-1 text-right">${Number(inv.amount).toFixed(2)}</td>
                <td className="py-1 text-right">{inv.balanceDue ? `$${Number(inv.balanceDue).toFixed(2)}` : "—"}</td>
                <td className="py-1 capitalize">{inv.status.replace("_", " ")}</td>
                <td className="py-1">
                  <button onClick={() => refresh(inv.id)} disabled={isPending} className="text-xs text-slate-500 hover:underline">
                    Refresh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {!hasType("deposit") && !hasType("full") && (
          <button
            onClick={() => create("deposit")}
            disabled={isPending}
            className="rounded-md border border-slate-300 text-sm font-medium px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
          >
            Create deposit invoice ({depositPercentage}%)
          </button>
        )}
        {!hasType("final") && !hasType("full") && (
          <button
            onClick={() => create("final")}
            disabled={isPending}
            className="rounded-md border border-slate-300 text-sm font-medium px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
          >
            Create final invoice ({100 - Number(depositPercentage)}%)
          </button>
        )}
        {!hasType("deposit") && !hasType("final") && !hasType("full") && (
          <button
            onClick={() => create("full")}
            disabled={isPending}
            className="rounded-md border border-slate-300 text-sm font-medium px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
          >
            Create full invoice (100%)
          </button>
        )}
      </div>
    </div>
  );
}
