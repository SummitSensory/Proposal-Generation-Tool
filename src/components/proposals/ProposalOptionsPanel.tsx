"use client";

import { useState, useTransition } from "react";
import { toggleProposalOption } from "@/lib/actions/proposals";

type Option = {
  id: number;
  label: string;
  description: string | null;
  itemCount: number;
  enabled: boolean;
};

export default function ProposalOptionsPanel({
  proposalId,
  options,
}: {
  proposalId: number;
  options: Option[];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(optionId: number, enable: boolean) {
    setError(null);
    setPendingId(optionId);
    startTransition(async () => {
      try {
        await toggleProposalOption(proposalId, optionId, enable);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't update that option.");
      }
    });
  }

  if (options.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-800 mb-1">Options</h2>
      <p className="text-xs text-slate-500 mb-3">
        Turn these on to automatically add their line items. Turn off to remove exactly those lines.
      </p>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={`flex items-start gap-3 rounded-md border px-3 py-2 text-sm cursor-pointer ${
              o.enabled ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
            } ${o.itemCount === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="checkbox"
              checked={o.enabled}
              disabled={isPending || o.itemCount === 0}
              onChange={(e) => toggle(o.id, e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">{o.label}</span>
              {isPending && pendingId === o.id && <span className="text-slate-400 text-xs ml-2">updating…</span>}
              {o.itemCount === 0 && <span className="text-amber-700 text-xs ml-2">(no items set up yet)</span>}
              {o.description && <span className="block text-slate-500 text-xs mt-0.5">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
