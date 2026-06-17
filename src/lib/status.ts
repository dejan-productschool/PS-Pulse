export const STATUSES = [
  "ON_TRACK",
  "AT_RISK",
  "OFF_TRACK",
  "NOT_STARTED",
  "PAUSED",
  "DONE",
] as const;

export type Status = (typeof STATUSES)[number];

export const SOURCES = ["MANUAL", "IMPORTED"] as const;
export type Source = (typeof SOURCES)[number];

type StatusMeta = {
  label: string;
  // Tailwind classes for the badge dot, text and background.
  dot: string;
  text: string;
  bg: string;
  ring: string;
};

export const STATUS_META: Record<Status, StatusMeta> = {
  ON_TRACK: {
    label: "On track",
    dot: "bg-status-ontrack",
    text: "text-status-ontrack",
    bg: "bg-status-ontrackSoft",
    ring: "ring-status-ontrack/20",
  },
  AT_RISK: {
    label: "At risk",
    dot: "bg-status-atrisk",
    text: "text-status-atrisk",
    bg: "bg-status-atriskSoft",
    ring: "ring-status-atrisk/20",
  },
  OFF_TRACK: {
    label: "Off track",
    dot: "bg-status-offtrack",
    text: "text-status-offtrack",
    bg: "bg-status-offtrackSoft",
    ring: "ring-status-offtrack/20",
  },
  NOT_STARTED: {
    label: "Not started",
    dot: "bg-status-notstarted",
    text: "text-status-notstarted",
    bg: "bg-status-notstartedSoft",
    ring: "ring-status-notstarted/20",
  },
  PAUSED: {
    label: "Paused",
    dot: "bg-status-paused",
    text: "text-status-paused",
    bg: "bg-status-pausedSoft",
    ring: "ring-status-paused/20",
  },
  DONE: {
    label: "Done",
    dot: "bg-status-done",
    text: "text-status-done",
    bg: "bg-status-doneSoft",
    ring: "ring-status-done/20",
  },
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function statusMeta(value: string): StatusMeta {
  return isStatus(value) ? STATUS_META[value] : STATUS_META.NOT_STARTED;
}

export function statusLabel(value: string): string {
  return statusMeta(value).label;
}
