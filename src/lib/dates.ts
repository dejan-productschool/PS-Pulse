import { EMPTY_MILESTONES, type Milestones } from "./types";

// Normalize a loose date input (yyyy-mm-dd, ISO, etc.) to an ISO string or null.
export function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function parseMilestones(value: unknown): Milestones {
  if (!value || typeof value !== "object") return { ...EMPTY_MILESTONES };
  const m = value as Record<string, unknown>;
  return {
    discoveryEnd: toIsoDate(m.discoveryEnd),
    devStart: toIsoDate(m.devStart),
    qaStart: toIsoDate(m.qaStart),
    launch: toIsoDate(m.launch),
  };
}
