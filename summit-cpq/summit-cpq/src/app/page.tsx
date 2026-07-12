import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { customers, projects, proposals, freightRequests, sourcingItems } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getSession();

  const [customerCount] = await db.select({ value: count() }).from(customers);
  const [activeProjectCount] = await db
    .select({ value: count() })
    .from(projects)
    .where(sql`${projects.status} not in ('closed','cancelled')`);
  const [draftProposalCount] = await db
    .select({ value: count() })
    .from(proposals)
    .where(eq(proposals.status, "draft"));
  const [outstandingFreight] = await db
    .select({ value: count() })
    .from(freightRequests)
    .where(sql`${freightRequests.status} in ('not_sent','requested','awaiting_response')`);
  const [outstandingSourcing] = await db
    .select({ value: count() })
    .from(sourcingItems)
    .where(sql`${sourcingItems.status} = 'not_ordered'`);

  const cards = [
    { label: "Active projects", value: activeProjectCount?.value ?? 0, href: "/projects" },
    { label: "Customers", value: customerCount?.value ?? 0, href: "/customers" },
    { label: "Draft proposals", value: draftProposalCount?.value ?? 0, href: "/proposals" },
    { label: "Freight requests outstanding", value: outstandingFreight?.value ?? 0, href: "/freight" },
    { label: "Sourcing items not ordered", value: outstandingSourcing?.value ?? 0, href: "/sourcing" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Welcome{session ? `, ${session.name.split(" ")[0]}` : ""}</h1>
      <p className="text-slate-500 mb-8">Here&apos;s what needs attention today.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="block bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-400 transition"
          >
            <p className="text-3xl font-semibold">{c.value}</p>
            <p className="text-sm text-slate-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
