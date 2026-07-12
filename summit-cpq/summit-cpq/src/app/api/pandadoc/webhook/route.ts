import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { proposals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mapPandaDocStatus } from "@/lib/pandadoc/client";
import { logAudit } from "@/lib/audit";

/**
 * Receives status-change events from PandaDoc (configure this URL in PandaDoc's
 * dashboard under Settings > API & Webhooks). PandaDoc sends an array of events;
 * we only care about document status changes tied to a document id we recognize.
 *
 * Security note: PandaDoc supports a shared-secret signature header
 * (PandaDoc-Signature) — verify it here once PANDADOC_WEBHOOK_SHARED_KEY is set,
 * so this endpoint can't be spoofed. Left as a TODO since it requires the shared
 * key from your PandaDoc webhook configuration screen.
 */
export async function POST(req: NextRequest) {
  const events = await req.json();
  const list = Array.isArray(events) ? events : [events];

  for (const event of list) {
    const documentId: string | undefined = event?.data?.id;
    const status: string | undefined = event?.data?.status;
    if (!documentId || !status) continue;

    const [proposal] = await db.select().from(proposals).where(eq(proposals.pandadocDocumentId, documentId)).limit(1);
    if (!proposal) continue;

    const mapped = mapPandaDocStatus(status);
    await db.update(proposals).set({ pandadocStatus: mapped, updatedAt: new Date() }).where(eq(proposals.id, proposal.id));

    if (mapped === "completed") {
      await db.update(proposals).set({ status: "accepted", acceptedAt: new Date() }).where(eq(proposals.id, proposal.id));
    }

    await logAudit({ action: "pandadoc_webhook", entityType: "proposal", entityId: proposal.id, newValue: { status: mapped } });
  }

  return NextResponse.json({ ok: true });
}
