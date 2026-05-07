import { randomUUID } from "crypto";

/** Generate a unique ID for database records */
export function generateId(): string {
  return randomUUID();
}

/** Format a date as invoice number: INV-YYMM-XXXX */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `INV-${yy}${mm}-${rand}`;
}
