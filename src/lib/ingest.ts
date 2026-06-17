import type { MappedInitiative } from "./connectors";
import {
  addStatusUpdate,
  createInitiative,
  findByExternal,
  updateInitiative,
} from "./store";

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
 * record's status differs from what we already have.
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
          ? await findByExternal(connectorId, record.externalId)
          : null;

      if (existing) {
        const statusChanged = existing.status !== record.status;
        await updateInitiative(existing.id, {
          name: record.name,
          summary: record.summary,
          driName: record.driName,
          driEmail: record.driEmail,
          team: record.team,
          targetDate: record.targetDate ? record.targetDate.toISOString() : null,
        });
        if (statusChanged) {
          await addStatusUpdate(existing.id, {
            status: record.status,
            body: "Status updated via connector sync.",
            author: "Connector",
          });
        }
        result.updated += 1;
      } else {
        await createInitiative({
          name: record.name,
          summary: record.summary,
          driName: record.driName,
          driEmail: record.driEmail,
          team: record.team,
          status: record.status,
          targetDate: record.targetDate ? record.targetDate.toISOString() : null,
          source: "IMPORTED",
          connectorId: connectorId ?? null,
          externalId: record.externalId ?? null,
          initialUpdate: "Imported via connector.",
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
