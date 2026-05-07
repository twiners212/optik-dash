import { db } from "@/lib/db";
import { customer, prescription } from "@/lib/schema";
import { generateId } from "@/lib/id";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET() {
  const customers = await db.select().from(customer).all();
  return Response.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, address } = body;

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const newCustomer = {
    id: generateId(),
    name,
    phone: phone ?? null,
    address: address ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(customer).values(newCustomer);
  return Response.json(newCustomer, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  await db
    .update(customer)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(customer.id, id));

  const updated = await db.select().from(customer).where(eq(customer.id, id)).get();
  return Response.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  // Delete associated prescriptions first
  await db.delete(prescription).where(eq(prescription.customerId, id));
  // Delete the customer
  await db.delete(customer).where(eq(customer.id, id));

  return Response.json({ success: true });
}
