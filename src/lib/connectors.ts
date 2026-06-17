import { isStatus, type Status } from "./status";

/**
 * A connector's field mapping describes how to translate an arbitrary external
 * REST payload into Pulse's initiative shape. It is stored as a JSON string on
 * the Connector model.
 */
export type FieldMapping = {
  // Dot-path to the array of records inside the response. Empty/omitted means
  // the response body itself is the array.
  recordsPath?: string;
  // Maps a Pulse field -> dot-path into each external record.
  fields: {
    externalId?: string;
    name?: string;
    summary?: string;
    driName?: string;
    driEmail?: string;
    team?: string;
    status?: string;
    targetDate?: string;
  };
  // Maps raw external status strings -> a Pulse Status.
  statusMap?: Record<string, Status>;
};

export type MappedInitiative = {
  externalId: string | null;
  name: string;
  summary: string;
  driName: string;
  driEmail: string;
  team: string;
  status: Status;
  targetDate: Date | null;
};

export function parseFieldMapping(raw: string): FieldMapping {
  try {
    const parsed = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object" && parsed.fields) {
      return parsed as FieldMapping;
    }
  } catch {
    // fall through to default
  }
  return { fields: {} };
}

function getByPath(source: unknown, path?: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function asString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asDate(value: unknown): Date | null {
  const str = asString(value);
  if (!str) return null;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extractRecords(payload: unknown, mapping: FieldMapping): unknown[] {
  const located = mapping.recordsPath
    ? getByPath(payload, mapping.recordsPath)
    : payload;
  if (Array.isArray(located)) return located;
  if (Array.isArray(payload)) return payload;
  return [];
}

export function mapRecord(record: unknown, mapping: FieldMapping): MappedInitiative {
  const f = mapping.fields ?? {};
  const rawStatus = asString(getByPath(record, f.status));
  const mappedStatus = mapping.statusMap?.[rawStatus];
  const status: Status = mappedStatus ?? (isStatus(rawStatus) ? rawStatus : "NOT_STARTED");

  const externalId = asString(getByPath(record, f.externalId));

  return {
    externalId: externalId || null,
    name: asString(getByPath(record, f.name)) || "Untitled initiative",
    summary: asString(getByPath(record, f.summary)),
    driName: asString(getByPath(record, f.driName)),
    driEmail: asString(getByPath(record, f.driEmail)),
    team: asString(getByPath(record, f.team)),
    status,
    targetDate: asDate(getByPath(record, f.targetDate)),
  };
}
