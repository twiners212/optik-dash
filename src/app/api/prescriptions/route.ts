import { db } from "@/lib/db";
import { prescription } from "@/lib/schema";
import { generateId } from "@/lib/id";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  if (customerId) {
    const prescriptions = await db
      .select()
      .from(prescription)
      .where(eq(prescription.customerId, customerId))
      .all();
    return Response.json(prescriptions);
  }

  const all = await db.select().from(prescription).all();
  return Response.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, odSph, odCyl, odAxis, odAdd, odVisus, osSph, osCyl, osAxis, osAdd, osVisus, pd, notes } = body;

  if (!customerId) {
    return Response.json({ error: "customerId is required" }, { status: 400 });
  }

  const newPrescription = {
    id: generateId(),
    customerId,
    odSph: odSph ?? null,
    odCyl: odCyl ?? null,
    odAxis: odAxis ?? null,
    odAdd: odAdd ?? null,
    odVisus: odVisus ?? null,
    osSph: osSph ?? null,
    osCyl: osCyl ?? null,
    osAxis: osAxis ?? null,
    osAdd: osAdd ?? null,
    osVisus: osVisus ?? null,
    pd: pd ?? null,
    notes: notes ?? null,
    createdAt: new Date(),
  };

  await db.insert(prescription).values(newPrescription);
  return Response.json(newPrescription, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  await db
    .update(prescription)
    .set(updates)
    .where(eq(prescription.id, id));

  const updated = await db.select().from(prescription).where(eq(prescription.id, id)).get();
  return Response.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  await db.delete(prescription).where(eq(prescription.id, id));
  return Response.json({ success: true });
}
