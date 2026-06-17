import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isStatus } from "@/lib/status";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const team = searchParams.get("team");

  const initiatives = await prisma.initiative.findMany({
    where: {
      ...(status && isStatus(status) ? { status } : {}),
      ...(team ? { team } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { updates: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

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

  const status = isStatus(body.status) ? body.status : "NOT_STARTED";

  const initiative = await prisma.initiative.create({
    data: {
      name,
      summary: typeof body.summary === "string" ? body.summary : "",
      driName: typeof body.driName === "string" ? body.driName : "",
      driEmail: typeof body.driEmail === "string" ? body.driEmail : "",
      team: typeof body.team === "string" ? body.team : "",
      status,
      targetDate:
        typeof body.targetDate === "string" && body.targetDate
          ? new Date(body.targetDate)
          : null,
      source: "MANUAL",
      // Seed the timeline with the initial status so history is complete.
      updates: {
        create: {
          status,
          body:
            typeof body.initialUpdate === "string" && body.initialUpdate.trim()
              ? body.initialUpdate.trim()
              : "Initiative created.",
          author: typeof body.driName === "string" ? body.driName : "",
        },
      },
    },
  });

  return NextResponse.json(initiative, { status: 201 });
}
