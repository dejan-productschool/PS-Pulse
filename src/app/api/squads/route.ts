import { NextResponse } from "next/server";
import { createSquad, listSquads } from "@/lib/store";

export async function GET() {
  const squads = await listSquads();
  return NextResponse.json(squads);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const members =
    typeof body.members === "string"
      ? body.members
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
      : Array.isArray(body.members)
        ? body.members.filter((m): m is string => typeof m === "string")
        : [];

  const squad = await createSquad({
    name,
    cycleName: typeof body.cycleName === "string" ? body.cycleName : undefined,
    weeks: typeof body.weeks === "number" ? body.weeks : undefined,
    members,
  });

  return NextResponse.json(squad, { status: 201 });
}
