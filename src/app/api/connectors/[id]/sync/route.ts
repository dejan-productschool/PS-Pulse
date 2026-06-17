import { NextResponse } from "next/server";
import {
  extractRecords,
  mapRecord,
  parseFieldMapping,
} from "@/lib/connectors";
import { ingestInitiatives } from "@/lib/ingest";
import { getConnector, touchConnectorSynced } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

function joinUrl(baseUrl: string, endpoint: string): string {
  if (!endpoint) return baseUrl;
  return `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
}

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const connector = await getConnector(id);
  if (!connector) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = joinUrl(connector.baseUrl, connector.endpoint);

  let payload: unknown;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(connector.authHeader ? { Authorization: connector.authHeader } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Source responded with ${res.status} ${res.statusText}` },
        { status: 502 },
      );
    }
    payload = await res.json();
  } catch (err) {
    return NextResponse.json(
      {
        error: `Could not reach source: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      },
      { status: 502 },
    );
  }

  const mapping = parseFieldMapping(connector.fieldMapping);
  const records = extractRecords(payload, mapping).map((r) => mapRecord(r, mapping));
  const result = await ingestInitiatives(records, connector.id);

  await touchConnectorSynced(id);

  return NextResponse.json({ source: url, ...result });
}
