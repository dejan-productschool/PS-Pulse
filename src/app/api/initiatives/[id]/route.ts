import { NextResponse } from "next/server";
import {
  deleteInitiative,
  getInitiative,
  updateInitiative,
  type InitiativePatch,
} from "@/lib/store";
import { isStatus } from "@/lib/status";
import { toIsoDate, parseMilestones } from "@/lib/dates";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const initiative = await getInitiative(id);
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

  const patch: InitiativePatch = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.summary === "string") patch.summary = body.summary;
  if (typeof body.driName === "string") patch.driName = body.driName;
  if (typeof body.driEmail === "string") patch.driEmail = body.driEmail;
  if (typeof body.team === "string") patch.team = body.team;
  if (isStatus(body.status)) patch.status = body.status;
  if (typeof body.startDate === "string") {
    patch.startDate = toIsoDate(body.startDate);
  }
  if (typeof body.targetDate === "string") {
    patch.targetDate = toIsoDate(body.targetDate);
  }
  if (body.milestones && typeof body.milestones === "object") {
    patch.milestones = parseMilestones(body.milestones);
  }

  const updated = await updateInitiative(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const ok = await deleteInitiative(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
