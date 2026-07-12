import { getSession } from "@/lib/auth/session";
import { getActiveConnection } from "@/lib/qbo/client";
import SettingsPasswordForm from "@/components/SettingsPasswordForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ qbo?: string }>;
}) {
  const { qbo } = await searchParams;
  const session = await getSession();

  let connection = null;
  let connectionError: string | null = null;
  if (session?.role === "owner") {
    try {
      connection = await getActiveConnection();
    } catch (err) {
      connectionError = (err as Error).message;
    }
  }

  return (
    <div className="max-w-md space-y-8">
      <h1 className="text-2xl font-semibold">Account settings</h1>

      {session?.role === "owner" && (
        <section className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-2">QuickBooks Online</h2>
          {qbo === "connected" && <p className="text-sm text-emerald-600 mb-3">QuickBooks connected successfully.</p>}
          {qbo === "error" && <p className="text-sm text-red-600 mb-3">Something went wrong connecting QuickBooks. See server logs for details.</p>}
          {connectionError && <p className="text-sm text-amber-600 mb-3">{connectionError}</p>}
          {connection ? (
            <div className="text-sm text-slate-600">
              <p>Connected to company {connection.realmId} ({connection.environment}).</p>
              <a href="/api/qbo/connect" className="text-slate-900 underline text-sm">Reconnect / switch company</a>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500 mb-3">
                Not connected yet. You&apos;ll need a QuickBooks Online developer app — see the README for setup steps.
              </p>
              <a
                href="/api/qbo/connect"
                className="inline-block rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
              >
                Connect QuickBooks Online
              </a>
            </div>
          )}
        </section>
      )}

      <SettingsPasswordForm />
    </div>
  );
}
