import { NextResponse } from "next/server";
import { addAllocation } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const label = typeof body.label === "string" ? body.label.trim() : "";
  const initiativeId =
    typeof body.initiativeId === "string" && body.initiativeId
      ? body.initiativeId
      : null;
  const personWeeks =
    typeof body.personWeeks === "number" && body.personWeeks > 0
      ? body.personWeeks
      : 0;

  if (!label && !initiativeId) {
    return NextResponse.json(
      { error: "An initiative or label is required" },
      { status: 400 },
    );
  }
  if (personWeeks <= 0) {
    return NextResponse.json(
      { error: "Person-weeks must be greater than 0" },
      { status: 400 },
    );
  }

  const entry = await addAllocation(id, {
    initiativeId,
    label: label || "Allocation",
    personWeeks,
  });
  if (!entry) {
    return NextResponse.json({ error: "Squad not found" }, { status: 404 });
  }
  return NextResponse.json(entry, { status: 201 });
}
