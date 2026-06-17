import { NextResponse } from "next/server";
import {
  extractRecords,
  mapRecord,
  type FieldMapping,
  type MappedInitiative,
} from "@/lib/connectors";
import { ingestInitiatives } from "@/lib/ingest";
import { isStatus } from "@/lib/status";

/**
 * Direct import endpoint. Accepts either:
 *   1. A raw JSON array of Pulse-shaped initiatives, or
 *   2. { records: unknown[], fieldMapping: FieldMapping } to map an arbitrary
 *      external shape on the way in.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let mapped: MappedInitiative[];

  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "fieldMapping" in body
  ) {
    const { records, fieldMapping } = body as {
      records: unknown;
      fieldMapping: FieldMapping;
    };
    const list = extractRecords(records, fieldMapping);
    mapped = list.map((r) => mapRecord(r, fieldMapping));
  } else {
    const list = Array.isArray(body) ? body : [];
    mapped = list.map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      return {
        externalId: typeof r.externalId === "string" ? r.externalId : null,
        name: typeof r.name === "string" ? r.name : "Untitled initiative",
        summary: typeof r.summary === "string" ? r.summary : "",
        driName: typeof r.driName === "string" ? r.driName : "",
        driEmail: typeof r.driEmail === "string" ? r.driEmail : "",
        team: typeof r.team === "string" ? r.team : "",
        status: isStatus(r.status) ? r.status : "NOT_STARTED",
        targetDate:
          typeof r.targetDate === "string" && r.targetDate
            ? new Date(r.targetDate)
            : null,
      };
    });
  }

  if (mapped.length === 0) {
    return NextResponse.json(
      { error: "No records found to import" },
      { status: 400 },
    );
  }

  const result = await ingestInitiatives(mapped, null);
  return NextResponse.json(result);
}
