import Link from "next/link";
import type { SessionPayload } from "@/lib/auth/session";
import { ROLE_LABELS, Role } from "@/lib/auth/roles";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS: { href: string; label: string; roles?: Role[] }[] = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/proposals", label: "Proposals" },
  { href: "/sourcing", label: "Sourcing" },
  { href: "/freight", label: "Freight" },
  { href: "/vendors", label: "Vendors" },
  { href: "/audit", label: "Audit Log", roles: ["owner"] },
  { href: "/users", label: "Users", roles: ["owner"] },
  { href: "/settings", label: "Account Settings" },
];

export default function NavShell({
  session,
  children,
}: {
  session: SessionPayload | null;
  children: React.ReactNode;
}) {
  if (!session) {
    return <div className="flex-1">{children}</div>;
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(session.role as Role)
  );

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="font-semibold leading-tight">Summit Sensory Gym</p>
          <p className="text-xs text-slate-400">Internal CPQ</p>
        </div>
        <nav className="flex-1 py-3">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-5 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="text-slate-200">{session.name}</p>
          <p className="mb-2">{ROLE_LABELS[session.role as Role] ?? session.role}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 max-w-6xl">{children}</main>
    </div>
  );
}
