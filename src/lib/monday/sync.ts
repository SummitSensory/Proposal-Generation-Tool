import { db } from "@/db";
import { customers, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mondayRequest } from "./client";

// "Deal Tracking" board. Each item is treated as its own customer record (no merging of
// repeat companies) per how Summit Sensory Gym actually uses this board.
const DEFAULT_BOARD_ID = "6527740233";

const COLUMN_IDS = [
  "text9__1", // Full Name (contact)
  "text_mkpnvbkn", // Title
  "email_1__1", // Email Address
  "phone__1", // Direct Phone Number
  "text_mkvy62bg", // Website Address
  "text_mkq249md", // Street Address Text
  "text_mm1zssfw", // Unit/Ste
  "text_mkq2tbvv", // City Text
  "text_mkpzwfqz", // State
  "text__1", // Zip Code
  "status47__1", // Country
  "status5__1", // Type of Customer
  "lookup3__1", // Industry
];

type ColumnValue = { id: string; text: string | null };
type MondayItem = { id: string; name: string; column_values: ColumnValue[] };
type ItemsPage = { cursor: string | null; items: MondayItem[] };

function colText(cvs: ColumnValue[], id: string): string | null {
  const cv = cvs.find((c) => c.id === id);
  const t = cv?.text?.trim();
  return t ? t : null;
}

async function fetchAllItems(boardId: string): Promise<MondayItem[]> {
  const items: MondayItem[] = [];

  const first = await mondayRequest<{ boards: { items_page: ItemsPage }[] }>(
    `query($boardId: ID!, $columnIds: [String!]) {
      boards(ids: [$boardId]) {
        items_page(limit: 100) {
          cursor
          items { id name column_values(ids: $columnIds) { id text } }
        }
      }
    }`,
    { boardId, columnIds: COLUMN_IDS }
  );

  const board = first.boards[0];
  if (!board) return items;
  items.push(...board.items_page.items);
  let cursor = board.items_page.cursor;

  while (cursor) {
    const next = await mondayRequest<{ next_items_page: ItemsPage }>(
      `query($cursor: String!, $columnIds: [String!]) {
        next_items_page(cursor: $cursor, limit: 100) {
          cursor
          items { id name column_values(ids: $columnIds) { id text } }
        }
      }`,
      { cursor, columnIds: COLUMN_IDS }
    );
    items.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }

  return items;
}

export type MondaySyncResult = { created: number; updated: number; total: number };

export async function syncCustomersFromMonday(): Promise<MondaySyncResult> {
  const boardId = process.env.MONDAY_BOARD_ID || DEFAULT_BOARD_ID;
  const items = await fetchAllItems(boardId);

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const cvs = item.column_values;
    const addressParts = [
      colText(cvs, "text_mkq249md"),
      colText(cvs, "text_mm1zssfw"),
      colText(cvs, "text_mkq2tbvv"),
      colText(cvs, "text_mkpzwfqz"),
      colText(cvs, "text__1"),
      colText(cvs, "status47__1"),
    ].filter(Boolean);
    const address = addressParts.length ? addressParts.join(", ") : null;

    const values = {
      legalName: item.name || "(Unnamed deal)",
      customerType: colText(cvs, "status5__1"),
      industry: colText(cvs, "lookup3__1"),
      phone: colText(cvs, "phone__1"),
      website: colText(cvs, "text_mkvy62bg"),
      projectAddress: address,
      shippingAddress: address,
      mondaySourceId: item.id,
      mondaySyncedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.mondaySourceId, item.id))
      .limit(1);

    let customerId: number;
    if (existing) {
      await db.update(customers).set(values).where(eq(customers.id, existing.id));
      customerId = existing.id;
      updated++;
    } else {
      const [inserted] = await db.insert(customers).values(values).returning();
      customerId = inserted.id;
      created++;
    }

    const contactName = colText(cvs, "text9__1");
    if (contactName) {
      const contactValues = {
        customerId,
        name: contactName,
        title: colText(cvs, "text_mkpnvbkn"),
        email: colText(cvs, "email_1__1"),
        phone: colText(cvs, "phone__1"),
        isPrimary: true,
      };
      const [existingContact] = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.customerId, customerId))
        .limit(1);
      if (existingContact) {
        await db.update(contacts).set(contactValues).where(eq(contacts.id, existingContact.id));
      } else {
        await db.insert(contacts).values(contactValues);
      }
    }
  }

  return { created, updated, total: items.length };
}
