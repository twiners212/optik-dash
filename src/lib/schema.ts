import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================
// Better Auth required tables (user, session, account, verification)
// ============================================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ============================================================
// Application-specific tables
// ============================================================

export const customer = sqliteTable("customer", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const prescription = sqliteTable("prescription", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id),
  // OD (Right Eye)
  odSph: real("od_sph"),
  odCyl: real("od_cyl"),
  odAxis: integer("od_axis"),
  odAdd: real("od_add"),
  odVisus: text("od_visus"),
  // OS (Left Eye)
  osSph: real("os_sph"),
  osCyl: real("os_cyl"),
  osAxis: integer("os_axis"),
  osAdd: real("os_add"),
  osVisus: text("os_visus"),
  // PD
  pd: real("pd"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const inventoryItem = sqliteTable("inventory_item", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'Frame' | 'Lensa' | 'Softlens' | 'Aksesoris'
  price: real("price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const transaction = sqliteTable("transaction", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: text("customer_id").references(() => customer.id),
  prescriptionId: text("prescription_id").references(() => prescription.id),
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull().default(0),
  paymentAmount: real("payment_amount").notNull().default(0),
  change: real("change").notNull().default(0),
  status: text("status").notNull().default("completed"), // 'completed' | 'pending'
  userId: text("user_id").references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const transactionItem = sqliteTable("transaction_item", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transaction.id),
  inventoryItemId: text("inventory_item_id")
    .notNull()
    .references(() => inventoryItem.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  subtotal: real("subtotal").notNull(),
});
