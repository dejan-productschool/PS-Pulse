import type { Source, Status } from "./status";

export type StatusUpdate = {
  id: string;
  status: Status | string;
  body: string;
  author: string;
  createdAt: string; // ISO timestamp
};

// Horizon-style delivery milestones (ISO date strings or null).
export type Milestones = {
  discoveryEnd: string | null;
  devStart: string | null;
  qaStart: string | null;
  launch: string | null;
};

export const EMPTY_MILESTONES: Milestones = {
  discoveryEnd: null,
  devStart: null,
  qaStart: null,
  launch: null,
};

export type Initiative = {
  id: string;
  name: string;
  summary: string;
  driName: string;
  driEmail: string;
  team: string;
  status: Status | string;
  startDate: string | null; // ISO date (or null) — roadmap bar start
  targetDate: string | null; // ISO date (or null) — roadmap bar end / due
  milestones: Milestones;
  source: Source;
  externalId: string | null;
  connectorId: string | null;
  createdAt: string;
  updatedAt: string;
  updates: StatusUpdate[];
};

// ── Capacity (Horizon) ──────────────────────────────────────────────────────

export type SquadMember = {
  id: string;
  name: string;
};

export type Allocation = {
  id: string;
  // Optional link to an initiative; otherwise a free-text label (e.g. "Discovery").
  initiativeId: string | null;
  label: string;
  personWeeks: number;
};

export type Squad = {
  id: string;
  name: string;
  cycleName: string;
  weeks: number; // weeks in the planning cycle
  members: SquadMember[];
  allocations: Allocation[];
  createdAt: string;
  updatedAt: string;
};

export type Connector = {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  authHeader: string;
  fieldMapping: string; // JSON string
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
