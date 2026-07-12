"use client";

import { useState } from "react";
import { changePassword } from "@/lib/actions/account";

export default function SettingsPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const result = await changePassword(formData);
    if (result.error) setError(result.error);
    else setMessage("Password updated.");
  }

  return (
    <div className="max-w-md">
      <form action={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
          <input name="currentPassword" type="password" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New password (8+ characters)</label>
          <input name="newPassword" type="password" required minLength={8} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <div className="flex justify-end">
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}
