import type { Source, Status } from "./status";

export type StatusUpdate = {
  id: string;
  status: Status | string;
  body: string;
  author: string;
  createdAt: string; // ISO timestamp
};

export type Initiative = {
  id: string;
  name: string;
  summary: string;
  driName: string;
  driEmail: string;
  team: string;
  status: Status | string;
  targetDate: string | null; // ISO date (or null)
  source: Source;
  externalId: string | null;
  connectorId: string | null;
  createdAt: string;
  updatedAt: string;
  updates: StatusUpdate[];
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
