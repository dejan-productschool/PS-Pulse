import { NextResponse } from "next/server";
import { deleteSquad, getSquad, updateSquad } from "@/lib/store";
import type { SquadMember } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const squad = await getSquad(id);
  if (!squad) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(squad);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: Parameters<typeof updateSquad>[1] = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.cycleName === "string") patch.cycleName = body.cycleName;
  if (typeof body.weeks === "number" && body.weeks > 0) patch.weeks = body.weeks;
  if (Array.isArray(body.members)) {
    patch.members = (body.members as unknown[])
      .map((m): SquadMember | null => {
        if (typeof m === "string") {
          const name = m.trim();
          return name ? { id: crypto.randomUUID(), name } : null;
        }
        if (m && typeof m === "object" && "name" in m) {
          const obj = m as { id?: string; name?: unknown };
          const name = typeof obj.name === "string" ? obj.name.trim() : "";
          return name
            ? { id: obj.id ?? crypto.randomUUID(), name }
            : null;
        }
        return null;
      })
      .filter((m): m is SquadMember => m != null);
  }

  const updated = await updateSquad(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const ok = await deleteSquad(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
