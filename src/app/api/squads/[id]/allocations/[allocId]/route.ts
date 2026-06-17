import { NextResponse } from "next/server";
import { removeAllocation } from "@/lib/store";

type Params = { params: Promise<{ id: string; allocId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, allocId } = await params;
  const ok = await removeAllocation(id, allocId);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
