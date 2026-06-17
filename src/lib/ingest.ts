import { prisma } from "./db";
import type { MappedInitiative } from "./connectors";

export type IngestResult = {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
};

/**
 * Upsert a batch of mapped initiatives. Records with both a connectorId and an
 * externalId are matched on that pair so re-syncs update in place; everything
 * else is created fresh. A status update is appended whenever an imported
 * record's status differs from what we already have (or on first import).
 */
export async function ingestInitiatives(
  records: MappedInitiative[],
  connectorId: string | null,
): Promise<IngestResult> {
  const result: IngestResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    total: records.length,
    errors: [],
  };

  for (const record of records) {
    try {
      const existing =
        connectorId && record.externalId
          ? await prisma.initiative.findUnique({
              where: {
                connectorId_externalId: {
                  connectorId,
                  externalId: record.externalId,
                },
              },
            })
          : null;

      if (existing) {
        const statusChanged = existing.status !== record.status;
        await prisma.initiative.update({
          where: { id: existing.id },
          data: {
            name: record.name,
            summary: record.summary,
            driName: record.driName,
            driEmail: record.driEmail,
            team: record.team,
            status: record.status,
            targetDate: record.targetDate,
            ...(statusChanged
              ? {
                  updates: {
                    create: {
                      status: record.status,
                      body: "Status updated via connector sync.",
                      author: "Connector",
                    },
                  },
                }
              : {}),
          },
        });
        result.updated += 1;
      } else {
        await prisma.initiative.create({
          data: {
            name: record.name,
            summary: record.summary,
            driName: record.driName,
            driEmail: record.driEmail,
            team: record.team,
            status: record.status,
            targetDate: record.targetDate,
            source: "IMPORTED",
            connectorId: connectorId ?? undefined,
            externalId: record.externalId ?? undefined,
            updates: {
              create: {
                status: record.status,
                body: "Imported via connector.",
                author: "Connector",
              },
            },
          },
        });
        result.created += 1;
      }
    } catch (err) {
      result.skipped += 1;
      result.errors.push(
        `${record.externalId ?? record.name}: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      );
    }
  }

  return result;
}
