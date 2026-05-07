import { db } from "@/lib/db";
import { transaction, transactionItem, inventoryItem, customer } from "@/lib/schema";
import { generateId, generateInvoiceNumber } from "@/lib/id";
import { eq, sql, and, gte, lt } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // 1-12
  const year = searchParams.get("year");

  const baseSelect = {
    id: transaction.id,
    invoiceNumber: transaction.invoiceNumber,
    customerId: transaction.customerId,
    subtotal: transaction.subtotal,
    discount: transaction.discount,
    total: transaction.total,
    paymentAmount: transaction.paymentAmount,
    change: transaction.change,
    status: transaction.status,
    createdAt: transaction.createdAt,
    customerName: customer.name,
  };

  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);

    const transactions = await db
      .select(baseSelect)
      .from(transaction)
      .leftJoin(customer, eq(transaction.customerId, customer.id))
      .where(
        and(
          gte(transaction.createdAt, startDate),
          lt(transaction.createdAt, endDate)
        )
      )
      .all();

    return Response.json(transactions);
  }

  // Default: return today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const transactions = await db
    .select(baseSelect)
    .from(transaction)
    .leftJoin(customer, eq(transaction.customerId, customer.id))
    .where(
      and(
        gte(transaction.createdAt, today),
        lt(transaction.createdAt, tomorrow)
      )
    )
    .all();

  return Response.json(transactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, prescriptionId, items, discount, paymentAmount, userId } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "At least one item is required" }, { status: 400 });
  }

  const transactionId = generateId();
  const invoiceNumber = generateInvoiceNumber();

  // Calculate subtotals
  let subtotal = 0;
  const transactionItems = [];

  for (const item of items) {
    const inventoryRecord = await db
      .select()
      .from(inventoryItem)
      .where(eq(inventoryItem.id, item.inventoryItemId))
      .get();

    if (!inventoryRecord) {
      return Response.json({ error: `Inventory item ${item.inventoryItemId} not found` }, { status: 400 });
    }

    if (inventoryRecord.stock < item.quantity) {
      return Response.json(
        { error: `Insufficient stock for ${inventoryRecord.name}. Available: ${inventoryRecord.stock}` },
        { status: 400 }
      );
    }

    const itemSubtotal = inventoryRecord.price * item.quantity;
    subtotal += itemSubtotal;

    transactionItems.push({
      id: generateId(),
      transactionId,
      inventoryItemId: item.inventoryItemId,
      quantity: item.quantity,
      unitPrice: inventoryRecord.price,
      subtotal: itemSubtotal,
    });

    // Deduct stock
    await db
      .update(inventoryItem)
      .set({
        stock: sql`${inventoryItem.stock} - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItem.id, item.inventoryItemId));
  }

  const discountAmount = discount ?? 0;
  const total = subtotal - discountAmount;
  const change = (paymentAmount ?? total) - total;

  // Create transaction
  const newTransaction = {
    id: transactionId,
    invoiceNumber,
    customerId: customerId ?? null,
    prescriptionId: prescriptionId ?? null,
    subtotal,
    discount: discountAmount,
    total,
    paymentAmount: paymentAmount ?? total,
    change: change > 0 ? change : 0,
    status: "completed" as const,
    userId: userId ?? null,
    createdAt: new Date(),
  };

  await db.insert(transaction).values(newTransaction);

  // Insert transaction items
  for (const ti of transactionItems) {
    await db.insert(transactionItem).values(ti);
  }

  return Response.json({ ...newTransaction, items: transactionItems }, { status: 201 });
}
