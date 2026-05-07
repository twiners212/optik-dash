import { db } from "@/lib/db";
import { inventoryItem } from "@/lib/schema";
import { generateId } from "@/lib/id";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET() {
  const items = await db.select().from(inventoryItem).all();
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sku, name, category, price, stock } = body;

  if (!sku || !name || !category) {
    return Response.json({ error: "SKU, name, and category are required" }, { status: 400 });
  }

  const newItem = {
    id: generateId(),
    sku,
    name,
    category,
    price: price ?? 0,
    stock: stock ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(inventoryItem).values(newItem);
  return Response.json(newItem, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  await db
    .update(inventoryItem)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(inventoryItem.id, id));

  const updated = await db.select().from(inventoryItem).where(eq(inventoryItem.id, id)).get();
  return Response.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  await db.delete(inventoryItem).where(eq(inventoryItem.id, id));
  return Response.json({ success: true });
}
