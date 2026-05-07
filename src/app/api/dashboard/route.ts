import { db } from "@/lib/db";
import { transaction, inventoryItem, customer } from "@/lib/schema";
import { eq, sql, and, gte, lt, lte } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  // Dashboard summary
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's revenue aggregate
  const todaySummary = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${transaction.total}), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(transaction)
    .where(
      and(
        gte(transaction.createdAt, today),
        lt(transaction.createdAt, tomorrow)
      )
    )
    .get();

  // Today's transaction list (for table)
  const todayTransactions = await db
    .select({
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      total: transaction.total,
      discount: transaction.discount,
      status: transaction.status,
      createdAt: transaction.createdAt,
      customerName: customer.name,
    })
    .from(transaction)
    .leftJoin(customer, eq(transaction.customerId, customer.id))
    .where(
      and(
        gte(transaction.createdAt, today),
        lt(transaction.createdAt, tomorrow)
      )
    )
    .all();

  // Low stock items (stock <= 5)
  const lowStockItems = await db
    .select()
    .from(inventoryItem)
    .where(lte(inventoryItem.stock, 5))
    .all();

  // Monthly report if month/year specified
  let monthlyData = null;
  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);

    monthlyData = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${transaction.total}), 0)`,
        totalDiscount: sql<number>`COALESCE(SUM(${transaction.discount}), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(transaction)
      .where(
        and(
          gte(transaction.createdAt, startDate),
          lt(transaction.createdAt, endDate)
        )
      )
      .get();
  }

  return Response.json({
    today: todaySummary,
    todayTransactions,
    lowStockItems,
    monthly: monthlyData,
  });
}
