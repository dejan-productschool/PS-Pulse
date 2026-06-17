import { NextResponse } from "next/server";
import { buildSeed } from "@/lib/seed-data";
import {
  countConnectors,
  countInitiatives,
  putConnector,
  putInitiative,
} from "@/lib/store";

/**
 * Idempotent demo seeding. Populates demo initiatives + a demo connector only
 * when the store is empty, so it is safe to call after deploying.
 */
export async function POST(request: Request) {
  const [initiativeCount, connectorCount] = await Promise.all([
    countInitiatives(),
    countConnectors(),
  ]);

  if (initiativeCount > 0 || connectorCount > 0) {
    return NextResponse.json({
      seeded: false,
      message: "Store already has data; nothing to seed.",
      initiatives: initiativeCount,
      connectors: connectorCount,
    });
  }

  const origin = new URL(request.url).origin;
  const { initiatives, connector } = buildSeed(origin);

  await Promise.all(initiatives.map((i) => putInitiative(i)));
  await putConnector(connector);

  return NextResponse.json({
    seeded: true,
    initiatives: initiatives.length,
    connectors: 1,
  });
}
