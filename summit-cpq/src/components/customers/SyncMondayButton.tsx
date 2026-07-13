"use client";

import { useState, useTransition } from "react";
import { syncMondayCustomersAction } from "@/lib/actions/customers";

export default function SyncMondayButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function sync() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await syncMondayCustomersAction();
        setMessage(
          `Synced from Monday.com: ${result.created} new, ${result.updated} updated (${result.total} total deals).`
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sync failed.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={sync}
        disabled={isPending}
        className="rounded-md border border-slate-300 text-sm font-medium px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
      >
        {isPending ? "Syncing…" : "Sync from Monday.com"}
      </button>
      {message && <p className="text-xs text-slate-500">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
