import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createUser, toggleUserActive } from "@/lib/actions/users";
import { ROLE_LABELS, Role } from "@/lib/auth/roles";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || session.role !== "owner") redirect("/");

  const allUsers = await db.select().from(users);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-semibold">Users</h1>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[u.role as Role]}</td>
                <td className="px-4 py-2 text-slate-600">{u.active ? "Active" : "Deactivated"}</td>
                <td className="px-4 py-2">
                  <form action={toggleUserActive.bind(null, u.id, u.active)}>
                    <button className="text-xs text-slate-500 hover:underline">{u.active ? "Deactivate" : "Reactivate"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Add a user</h2>
        <form action={createUser} className="grid grid-cols-2 gap-4">
          <input name="name" placeholder="Full name" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="email" type="email" placeholder="Email" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="password" type="password" placeholder="Temporary password (8+ chars)" required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select name="role" defaultValue="sales" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="col-span-2 flex justify-end">
            <button type="submit" className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800">
              Create user
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
