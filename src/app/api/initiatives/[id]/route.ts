import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStatus } from "@/lib/status";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      updates: { orderBy: { createdAt: "desc" } },
      connector: true,
    },
  });
  if (!initiative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(initiative);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.summary === "string") data.summary = body.summary;
  if (typeof body.driName === "string") data.driName = body.driName;
  if (typeof body.driEmail === "string") data.driEmail = body.driEmail;
  if (typeof body.team === "string") data.team = body.team;
  if (isStatus(body.status)) data.status = body.status;
  if (typeof body.targetDate === "string") {
    data.targetDate = body.targetDate ? new Date(body.targetDate) : null;
  }

  try {
    const initiative = await prisma.initiative.update({ where: { id }, data });
    return NextResponse.json(initiative);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.initiative.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
