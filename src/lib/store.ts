import { Redis } from "@upstash/redis";
import type { Connector, Initiative, StatusUpdate } from "./types";

/**
 * Low-weight data layer. Uses Upstash Redis (Vercel KV) when credentials are
 * present, and falls back to a process-local in-memory store otherwise so the
 * app runs and builds without any database configured (data is not persisted
 * across restarts in that mode).
 */

interface Kv {
  getJSON<T>(key: string): Promise<T | null>;
  setJSON(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  mgetJSON<T>(keys: string[]): Promise<(T | null)[]>;
}

function upstashKv(): Kv | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return {
    async getJSON<T>(key: string) {
      return (await redis.get<T>(key)) ?? null;
    },
    async setJSON(key: string, value: unknown) {
      await redis.set(key, value);
    },
    async del(key: string) {
      await redis.del(key);
    },
    async sadd(key: string, member: string) {
      await redis.sadd(key, member);
    },
    async srem(key: string, member: string) {
      await redis.srem(key, member);
    },
    async smembers(key: string) {
      return await redis.smembers(key);
    },
    async mgetJSON<T>(keys: string[]) {
      if (keys.length === 0) return [];
      return await redis.mget<(T | null)[]>(...keys);
    },
  };
}

function memoryKv(): Kv {
  const g = globalThis as unknown as {
    __pulseMem?: { values: Map<string, unknown>; sets: Map<string, Set<string>> };
  };
  if (!g.__pulseMem) {
    g.__pulseMem = { values: new Map(), sets: new Map() };
  }
  const { values, sets } = g.__pulseMem;
  const clone = <T>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)));

  return {
    async getJSON<T>(key: string) {
      return (values.has(key) ? clone(values.get(key)) : null) as T | null;
    },
    async setJSON(key: string, value: unknown) {
      values.set(key, clone(value));
    },
    async del(key: string) {
      values.delete(key);
    },
    async sadd(key: string, member: string) {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key)!.add(member);
    },
    async srem(key: string, member: string) {
      sets.get(key)?.delete(member);
    },
    async smembers(key: string) {
      return Array.from(sets.get(key) ?? []);
    },
    async mgetJSON<T>(keys: string[]) {
      return keys.map((k) => (values.has(k) ? (clone(values.get(k)) as T) : null));
    },
  };
}

let _kv: Kv | null = null;
function kv(): Kv {
  if (!_kv) {
    _kv = upstashKv() ?? memoryKv();
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      console.warn(
        "[pulse] No KV credentials found — using in-memory store (not persisted).",
      );
    }
  }
  return _kv;
}

export function isPersistent(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  );
}

const INIT_IDS = "pulse:initiative:ids";
const CONN_IDS = "pulse:connector:ids";
const initKey = (id: string) => `pulse:initiative:${id}`;
const connKey = (id: string) => `pulse:connector:${id}`;

const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ---- Initiatives ----------------------------------------------------------

export async function listInitiatives(): Promise<Initiative[]> {
  const ids = await kv().smembers(INIT_IDS);
  const docs = await kv().mgetJSON<Initiative>(ids.map(initKey));
  return docs
    .filter((d): d is Initiative => d != null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getInitiative(id: string): Promise<Initiative | null> {
  return kv().getJSON<Initiative>(initKey(id));
}

export type InitiativeInput = {
  name: string;
  summary?: string;
  driName?: string;
  driEmail?: string;
  team?: string;
  status?: string;
  targetDate?: string | null;
  source?: Initiative["source"];
  externalId?: string | null;
  connectorId?: string | null;
  initialUpdate?: string;
};

export async function createInitiative(input: InitiativeInput): Promise<Initiative> {
  const id = newId();
  const ts = now();
  const status = input.status ?? "NOT_STARTED";
  const initiative: Initiative = {
    id,
    name: input.name,
    summary: input.summary ?? "",
    driName: input.driName ?? "",
    driEmail: input.driEmail ?? "",
    team: input.team ?? "",
    status,
    targetDate: input.targetDate ?? null,
    source: input.source ?? "MANUAL",
    externalId: input.externalId ?? null,
    connectorId: input.connectorId ?? null,
    createdAt: ts,
    updatedAt: ts,
    updates: [
      {
        id: newId(),
        status,
        body: input.initialUpdate?.trim() || "Initiative created.",
        author: input.driName ?? "",
        createdAt: ts,
      },
    ],
  };
  await kv().setJSON(initKey(id), initiative);
  await kv().sadd(INIT_IDS, id);
  return initiative;
}

export type InitiativePatch = Partial<
  Pick<
    Initiative,
    | "name"
    | "summary"
    | "driName"
    | "driEmail"
    | "team"
    | "status"
    | "targetDate"
  >
>;

export async function updateInitiative(
  id: string,
  patch: InitiativePatch,
): Promise<Initiative | null> {
  const existing = await getInitiative(id);
  if (!existing) return null;
  const updated: Initiative = { ...existing, ...patch, updatedAt: now() };
  await kv().setJSON(initKey(id), updated);
  return updated;
}

export async function deleteInitiative(id: string): Promise<boolean> {
  const existing = await getInitiative(id);
  if (!existing) return false;
  await kv().del(initKey(id));
  await kv().srem(INIT_IDS, id);
  return true;
}

export async function addStatusUpdate(
  id: string,
  update: { status: string; body: string; author?: string },
): Promise<StatusUpdate | null> {
  const existing = await getInitiative(id);
  if (!existing) return null;
  const entry: StatusUpdate = {
    id: newId(),
    status: update.status,
    body: update.body,
    author: update.author ?? "",
    createdAt: now(),
  };
  existing.updates = [entry, ...existing.updates];
  existing.status = update.status;
  existing.updatedAt = entry.createdAt;
  await kv().setJSON(initKey(id), existing);
  return entry;
}

export async function findByExternal(
  connectorId: string,
  externalId: string,
): Promise<Initiative | null> {
  const all = await listInitiatives();
  return (
    all.find(
      (i) => i.connectorId === connectorId && i.externalId === externalId,
    ) ?? null
  );
}

// ---- Connectors -----------------------------------------------------------

export async function listConnectors(): Promise<Connector[]> {
  const ids = await kv().smembers(CONN_IDS);
  const docs = await kv().mgetJSON<Connector>(ids.map(connKey));
  return docs
    .filter((d): d is Connector => d != null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getConnector(id: string): Promise<Connector | null> {
  return kv().getJSON<Connector>(connKey(id));
}

export type ConnectorInput = {
  name: string;
  baseUrl: string;
  endpoint?: string;
  authHeader?: string;
  fieldMapping?: string;
};

export async function createConnector(input: ConnectorInput): Promise<Connector> {
  const id = newId();
  const ts = now();
  const connector: Connector = {
    id,
    name: input.name,
    baseUrl: input.baseUrl,
    endpoint: input.endpoint ?? "",
    authHeader: input.authHeader ?? "",
    fieldMapping: input.fieldMapping ?? "{}",
    lastSyncedAt: null,
    createdAt: ts,
    updatedAt: ts,
  };
  await kv().setJSON(connKey(id), connector);
  await kv().sadd(CONN_IDS, id);
  return connector;
}

export async function deleteConnector(id: string): Promise<boolean> {
  const existing = await getConnector(id);
  if (!existing) return false;
  await kv().del(connKey(id));
  await kv().srem(CONN_IDS, id);
  return true;
}

export async function touchConnectorSynced(id: string): Promise<void> {
  const existing = await getConnector(id);
  if (!existing) return;
  existing.lastSyncedAt = now();
  existing.updatedAt = now();
  await kv().setJSON(connKey(id), existing);
}

export async function countInitiatives(): Promise<number> {
  const ids = await kv().smembers(INIT_IDS);
  return ids.length;
}

export async function countConnectors(): Promise<number> {
  const ids = await kv().smembers(CONN_IDS);
  return ids.length;
}

// ---- Seeding helpers ------------------------------------------------------
// Write fully-formed records (preserving ids, timestamps, and update history).

export async function putInitiative(initiative: Initiative): Promise<void> {
  await kv().setJSON(initKey(initiative.id), initiative);
  await kv().sadd(INIT_IDS, initiative.id);
}

export async function putConnector(connector: Connector): Promise<void> {
  await kv().setJSON(connKey(connector.id), connector);
  await kv().sadd(CONN_IDS, connector.id);
}
