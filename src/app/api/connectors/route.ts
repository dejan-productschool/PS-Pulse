import { NextResponse } from "next/server";
import { createConnector, listConnectors, listInitiatives } from "@/lib/store";

export async function GET() {
  const [connectors, initiatives] = await Promise.all([
    listConnectors(),
    listInitiatives(),
  ]);
  const withCounts = connectors.map((c) => ({
    ...c,
    initiativeCount: initiatives.filter((i) => i.connectorId === c.id).length,
  }));
  return NextResponse.json(withCounts);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
  if (!name || !baseUrl) {
    return NextResponse.json(
      { error: "Name and base URL are required" },
      { status: 400 },
    );
  }

  let fieldMapping = "{}";
  if (typeof body.fieldMapping === "string" && body.fieldMapping.trim()) {
    try {
      JSON.parse(body.fieldMapping);
      fieldMapping = body.fieldMapping;
    } catch {
      return NextResponse.json(
        { error: "Field mapping must be valid JSON" },
        { status: 400 },
      );
    }
  }

  const connector = await createConnector({
    name,
    baseUrl,
    endpoint: typeof body.endpoint === "string" ? body.endpoint : "",
    authHeader: typeof body.authHeader === "string" ? body.authHeader : "",
    fieldMapping,
  });

  return NextResponse.json(connector, { status: 201 });
}
