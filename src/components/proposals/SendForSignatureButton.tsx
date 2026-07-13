"use client";

import { useState, useTransition } from "react";
import { sendProposalForSignature } from "@/lib/actions/pandadoc";

export default function SendForSignatureButton({ proposalId, status }: { proposalId: number; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(status === "sent" || status === "viewed" || status === "completed");

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await sendProposalForSignature(proposalId);
      if (result.error) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) {
    return <span className="text-sm text-slate-500">Sent for signature ({status})</span>;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send for signature (PandaDoc)"}
      </button>
      {error && <p className="text-sm text-red-600 mt-1 max-w-sm">{error}</p>}
    </div>
  );
}
