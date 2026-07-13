const API_BASE = "https://api.pandadoc.com/public/v1";

function requireApiKey(): string {
  const key = process.env.PANDADOC_API_KEY;
  if (!key) throw new Error("Missing PANDADOC_API_KEY. See README for PandaDoc setup.");
  return key;
}

function authHeader() {
  return { Authorization: `API-Key ${requireApiKey()}` };
}

export type PandaDocRecipient = {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

/**
 * Uploads a generated proposal PDF to PandaDoc as a new document with a signature
 * field for the customer. Returns the PandaDoc document id, which starts in
 * "document.uploaded" status — call sendPandaDocDocument() to actually email it.
 */
export async function createPandaDocFromPdf(params: {
  name: string;
  pdfBuffer: Buffer;
  recipient: PandaDocRecipient;
}): Promise<string> {
  const form = new FormData();
  form.append(
    "data",
    JSON.stringify({
      name: params.name,
      recipients: [
        {
          email: params.recipient.email,
          first_name: params.recipient.firstName || "",
          last_name: params.recipient.lastName || "",
          role: "Signer",
        },
      ],
      parse_form_fields: false,
      fields: {
        signature: { title: "Signature", value: "" },
      },
      pandadoc_fields: [
        {
          type: "signature",
          role: "Signer",
          // Bottom-of-first-page placement; adjust once you see a real generated proposal
          // if your proposal template's layout puts the signature block somewhere else.
          x: 0.65,
          y: 0.85,
          page: 0,
        },
      ],
    })
  );
  form.append("file", new Blob([new Uint8Array(params.pdfBuffer)], { type: "application/pdf" }), `${params.name}.pdf`);

  const res = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    headers: { ...authHeader() },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`PandaDoc document creation failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.id;
}

/**
 * PandaDoc documents process asynchronously after creation (parsing the uploaded PDF).
 * Poll status until it reaches "document.draft" before it can be sent.
 */
export async function waitForDocumentDraft(documentId: string, maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getPandaDocStatus(documentId);
    if (status === "document.draft") return;
    if (status === "document.upload_failed" || status === "document.parse_failed") {
      throw new Error(`PandaDoc failed to process the document (status: ${status}).`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Timed out waiting for PandaDoc to finish processing the document.");
}

export async function sendPandaDocDocument(documentId: string, message?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${documentId}/send`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ message: message || "Please review and sign.", silent: false }),
  });
  if (!res.ok) {
    throw new Error(`PandaDoc send failed: ${res.status} ${await res.text()}`);
  }
}

export async function getPandaDocStatus(documentId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) {
    throw new Error(`PandaDoc status check failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.status as string;
}

/**
 * Maps PandaDoc's document.* status strings to our internal document_status enum.
 */
export function mapPandaDocStatus(pandaDocStatus: string): "not_sent" | "sent" | "viewed" | "completed" | "declined" | "voided" {
  switch (pandaDocStatus) {
    case "document.sent": return "sent";
    case "document.viewed": return "viewed";
    case "document.completed": return "completed";
    case "document.declined": return "declined";
    case "document.voided": return "voided";
    default: return "not_sent";
  }
}
