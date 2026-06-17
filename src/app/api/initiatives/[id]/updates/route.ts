import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStatus } from "@/lib/status";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const updates = await prisma.statusUpdate.findMany({
    where: { initiativeId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(updates);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Update text is required" }, { status: 400 });
  }

  const initiative = await prisma.initiative.findUnique({ where: { id } });
  if (!initiative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = isStatus(body.status) ? body.status : initiative.status;

  // Posting an update advances the initiative's current status to the snapshot.
  const [update] = await prisma.$transaction([
    prisma.statusUpdate.create({
      data: {
        initiativeId: id,
        status,
        body: text,
        author: typeof body.author === "string" ? body.author : "",
      },
    }),
    prisma.initiative.update({ where: { id }, data: { status } }),
  ]);

  return NextResponse.json(update, { status: 201 });
}
