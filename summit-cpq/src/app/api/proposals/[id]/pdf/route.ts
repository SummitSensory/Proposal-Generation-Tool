import { NextRequest, NextResponse } from "next/server";
import { generateProposalPdfBuffer } from "@/lib/proposalPdf";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposalId = Number(id);

  try {
    const { buffer, proposalNumber } = await generateProposalPdfBuffer(proposalId);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${proposalNumber}.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 404 });
  }
}
