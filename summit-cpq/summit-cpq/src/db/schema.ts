import {
  pgTable, serial, text, varchar, integer, numeric, boolean, timestamp, jsonb, pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------
export const userRoleEnum = pgEnum("user_role", [
  "owner", "sales", "fulfillment", "installation", "accounting", "read_only",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "lead", "quoted", "sold", "in_production", "installed", "closed", "cancelled",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft", "internal_review", "sent", "accepted", "declined", "expired", "revised",
]);

export const sourcingStatusEnum = pgEnum("sourcing_status", [
  "not_ordered", "ordered", "confirmed", "received",
]);

export const freightStatusEnum = pgEnum("freight_status", [
  "not_sent", "requested", "awaiting_response", "received", "expired",
]);

export const vendorTypeEnum = pgEnum("vendor_type", ["sourcing", "freight", "both"]);

export const invoiceTypeEnum = pgEnum("invoice_type", ["deposit", "final", "full", "change_order"]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft", "created", "sent", "partially_paid", "paid", "overdue", "voided",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "not_sent", "sent", "viewed", "completed", "declined", "voided",
]);

// ---------- Users ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("sales"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Customers & Contacts ----------
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  dba: varchar("dba", { length: 255 }),
  customerType: varchar("customer_type", { length: 100 }),
  industry: varchar("industry", { length: 150 }),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  projectAddress: text("project_address"),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  taxExempt: boolean("tax_exempt").notNull().default(false),
  taxExemptDocUrl: text("tax_exempt_doc_url"),
  qboCustomerId: varchar("qbo_customer_id", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 150 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  isPrimary: boolean("is_primary").notNull().default(false),
  isBilling: boolean("is_billing").notNull().default(false),
  isDecisionMaker: boolean("is_decision_maker").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Vendors ----------
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: vendorTypeEnum("type").notNull().default("sourcing"),
  contactName: varchar("contact_name", { length: 200 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Projects ----------
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  name: varchar("name", { length: 255 }).notNull(),
  location: text("location"),
  salespersonId: integer("salesperson_id").references(() => users.id),
  status: projectStatusEnum("status").notNull().default("lead"),
  expectedCloseDate: timestamp("expected_close_date"),
  targetInstallDate: timestamp("target_install_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Products ----------
// bomFormula: array of { componentName, unit, formula } - formula is a math expression string
//   evaluated against the dimension values captured on a proposal line item (e.g. "ceil(length_ft * 2) + 4").
// dimensionFields: array of { key, label, unit } describing which dimensions this product needs on a proposal line.
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  customerFacingName: varchar("customer_facing_name", { length: 255 }),
  category: varchar("category", { length: 150 }),
  description: text("description"),
  customerFacingDescription: text("customer_facing_description"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  dimensionFields: jsonb("dimension_fields").notNull().default([]),
  bomFormula: jsonb("bom_formula").notNull().default([]),
  thirdPartySourced: boolean("third_party_sourced").notNull().default(false),
  sourcingVendorId: integer("sourcing_vendor_id").references(() => vendors.id),
  freightVendorId: integer("freight_vendor_id").references(() => vendors.id),
  requiresFreightQuote: boolean("requires_freight_quote").notNull().default(false),
  qboItemId: varchar("qbo_item_id", { length: 100 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Proposals ----------
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  proposalNumber: varchar("proposal_number", { length: 50 }).notNull().unique(),
  revisionNumber: integer("revision_number").notNull().default(1),
  parentProposalId: integer("parent_proposal_id"),
  projectId: integer("project_id").notNull().references(() => projects.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  status: proposalStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discountTotal: numeric("discount_total", { precision: 12, scale: 2 }).notNull().default("0"),
  freightTotal: numeric("freight_total", { precision: 12, scale: 2 }).notNull().default("0"),
  taxTotal: numeric("tax_total", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  depositPercentage: numeric("deposit_percentage", { precision: 5, scale: 2 }).notNull().default("50"),
  expiresAt: timestamp("expires_at"),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  pandadocDocumentId: varchar("pandadoc_document_id", { length: 100 }),
  pandadocStatus: documentStatusEnum("pandadoc_status").notNull().default("not_sent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Proposal Line Items ----------
export const proposalLineItems = pgTable("proposal_line_items", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  sectionName: varchar("section_name", { length: 150 }).notNull().default("Products"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  dimensions: jsonb("dimensions").notNull().default({}),
  computedBom: jsonb("computed_bom").notNull().default([]),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Proposal Versions (historical snapshots) ----------
export const proposalVersions = pgTable("proposal_versions", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Third-Party Sourcing Tracking ----------
export const sourcingItems = pgTable("sourcing_items", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  lineItemId: integer("line_item_id").notNull().references(() => proposalLineItems.id, { onDelete: "cascade" }),
  vendorId: integer("vendor_id").references(() => vendors.id),
  status: sourcingStatusEnum("status").notNull().default("not_ordered"),
  orderedAt: timestamp("ordered_at"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Freight Request Tracking ----------
export const freightRequests = pgTable("freight_requests", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  lineItemId: integer("line_item_id").notNull().references(() => proposalLineItems.id, { onDelete: "cascade" }),
  vendorId: integer("vendor_id").references(() => vendors.id),
  status: freightStatusEnum("status").notNull().default("not_sent"),
  requestedAt: timestamp("requested_at"),
  respondedAt: timestamp("responded_at"),
  quotedAmount: numeric("quoted_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Audit Log ----------
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Relations ----------
export const customersRelations = relations(customers, ({ many }) => ({
  contacts: many(contacts),
  projects: many(projects),
  proposals: many(proposals),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  customer: one(customers, { fields: [contacts.customerId], references: [customers.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, { fields: [projects.customerId], references: [customers.id] }),
  salesperson: one(users, { fields: [projects.salespersonId], references: [users.id] }),
  proposals: many(proposals),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  project: one(projects, { fields: [proposals.projectId], references: [projects.id] }),
  customer: one(customers, { fields: [proposals.customerId], references: [customers.id] }),
  creator: one(users, { fields: [proposals.createdBy], references: [users.id] }),
  lineItems: many(proposalLineItems),
  versions: many(proposalVersions),
  sourcingItems: many(sourcingItems),
  freightRequests: many(freightRequests),
}));

export const proposalLineItemsRelations = relations(proposalLineItems, ({ one }) => ({
  proposal: one(proposals, { fields: [proposalLineItems.proposalId], references: [proposals.id] }),
  product: one(products, { fields: [proposalLineItems.productId], references: [products.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  sourcingVendor: one(vendors, { fields: [products.sourcingVendorId], references: [vendors.id] }),
  freightVendor: one(vendors, { fields: [products.freightVendorId], references: [vendors.id] }),
  lineItems: many(proposalLineItems),
}));

// ---------- Invoices (mirrors QuickBooks Online invoices created from proposals) ----------
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id),
  type: invoiceTypeEnum("type").notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  qboInvoiceId: varchar("qbo_invoice_id", { length: 100 }),
  qboInvoiceNumber: varchar("qbo_invoice_number", { length: 100 }),
  balanceDue: numeric("balance_due", { precision: 12, scale: 2 }),
  qboSyncedAt: timestamp("qbo_synced_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- QuickBooks Online connection (single-company OAuth token storage) ----------
export const qboConnection = pgTable("qbo_connection", {
  id: serial("id").primaryKey(),
  realmId: varchar("realm_id", { length: 100 }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at").notNull(),
  environment: varchar("environment", { length: 20 }).notNull().default("sandbox"),
  connectedBy: integer("connected_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  proposal: one(proposals, { fields: [invoices.proposalId], references: [proposals.id] }),
}));
