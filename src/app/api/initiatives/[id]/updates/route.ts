import { NextResponse } from "next/server";
import { addStatusUpdate, getInitiative } from "@/lib/store";
import { isStatus } from "@/lib/status";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const initiative = await getInitiative(id);
  if (!initiative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(initiative.updates);
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

  const initiative = await getInitiative(id);
  if (!initiative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = isStatus(body.status) ? body.status : initiative.status;
  const update = await addStatusUpdate(id, {
    status,
    body: text,
    author: typeof body.author === "string" ? body.author : "",
  });

  return NextResponse.json(update, { status: 201 });
}
