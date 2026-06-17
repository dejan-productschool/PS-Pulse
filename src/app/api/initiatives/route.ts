import { NextResponse } from "next/server";
import { createInitiative, listInitiatives } from "@/lib/store";
import { isStatus } from "@/lib/status";
import { toIsoDate, parseMilestones } from "@/lib/dates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const team = searchParams.get("team");

  let initiatives = await listInitiatives();
  if (status && isStatus(status)) {
    initiatives = initiatives.filter((i) => i.status === status);
  }
  if (team) {
    initiatives = initiatives.filter((i) => i.team === team);
  }

  return NextResponse.json(initiatives);
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

  const initiative = await createInitiative({
    name,
    summary: typeof body.summary === "string" ? body.summary : "",
    driName: typeof body.driName === "string" ? body.driName : "",
    driEmail: typeof body.driEmail === "string" ? body.driEmail : "",
    team: typeof body.team === "string" ? body.team : "",
    status: isStatus(body.status) ? body.status : "NOT_STARTED",
    startDate: toIsoDate(body.startDate),
    targetDate: toIsoDate(body.targetDate),
    milestones: parseMilestones(body.milestones),
    source: "MANUAL",
    initialUpdate:
      typeof body.initialUpdate === "string" ? body.initialUpdate : undefined,
  });

  return NextResponse.json(initiative, { status: 201 });
}
