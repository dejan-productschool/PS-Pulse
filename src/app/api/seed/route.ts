import { NextResponse } from "next/server";
import { buildSeed } from "@/lib/seed-data";
import {
  countConnectors,
  countInitiatives,
  countSquads,
  putConnector,
  putInitiative,
  putSquad,
} from "@/lib/store";

/**
 * Idempotent demo seeding. Populates demo initiatives + a demo connector only
 * when the store is empty, so it is safe to call after deploying.
 */
export async function POST(request: Request) {
  const [initiativeCount, connectorCount, squadCount] = await Promise.all([
    countInitiatives(),
    countConnectors(),
    countSquads(),
  ]);

  if (initiativeCount > 0 || connectorCount > 0 || squadCount > 0) {
    return NextResponse.json({
      seeded: false,
      message: "Store already has data; nothing to seed.",
      initiatives: initiativeCount,
      connectors: connectorCount,
      squads: squadCount,
    });
  }

  const origin = new URL(request.url).origin;
  const { initiatives, connector, squads } = buildSeed(origin);

  await Promise.all(initiatives.map((i) => putInitiative(i)));
  await putConnector(connector);
  await Promise.all(squads.map((s) => putSquad(s)));

  return NextResponse.json({
    seeded: true,
    initiatives: initiatives.length,
    connectors: 1,
    squads: squads.length,
  });
}
