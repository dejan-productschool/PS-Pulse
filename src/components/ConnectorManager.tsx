"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { relativeTime } from "@/lib/format";

export type ConnectorView = {
  id: string;
  name: string;
  baseUrl: string;
  endpoint: string;
  authHeader: string;
  fieldMapping: string;
  lastSyncedAt: string | null;
  initiativeCount: number;
};

type SyncResult = {
  source?: string;
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
};

const SAMPLE_MAPPING = JSON.stringify(
  {
    recordsPath: "issues",
    fields: {
      externalId: "id",
      name: "fields.summary",
      summary: "fields.description",
      driName: "fields.assignee.displayName",
      driEmail: "fields.assignee.emailAddress",
      team: "fields.project.name",
      status: "fields.status.name",
      targetDate: "fields.duedate",
    },
    statusMap: {
      "In Progress": "ON_TRACK",
      Blocked: "OFF_TRACK",
      "At Risk": "AT_RISK",
      Done: "DONE",
    },
  },
  null,
  2,
);

export function ConnectorManager({ connectors }: { connectors: ConnectorView[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [authHeader, setAuthHeader] = useState("");
  const [fieldMapping, setFieldMapping] = useState(SAMPLE_MAPPING);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SyncResult>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function createConnector(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!name.trim() || !baseUrl.trim()) {
      setCreateError("Name and base URL are required.");
      return;
    }
    try {
      JSON.parse(fieldMapping || "{}");
    } catch {
      setCreateError("Field mapping must be valid JSON.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseUrl, endpoint, authHeader, fieldMapping }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create connector.");
      }
      setName("");
      setBaseUrl("");
      setEndpoint("");
      setAuthHeader("");
      setFieldMapping(SAMPLE_MAPPING);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create connector.");
    } finally {
      setCreating(false);
    }
  }

  async function sync(id: string) {
    setBusyId(id);
    setErrors((e) => ({ ...e, [id]: "" }));
    try {
      const res = await fetch(`/api/connectors/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed.");
      setResults((r) => ({ ...r, [id]: data }));
      router.refresh();
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [id]: err instanceof Error ? err.message : "Sync failed.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this connector? Imported initiatives will remain.")) return;
    setBusyId(id);
    try {
      await fetch(`/api/connectors/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {connectors.length} connector{connectors.length === 1 ? "" : "s"}
        </p>
        <button
          className="btn-primary"
          onClick={() => setShowForm((s) => !s)}
          type="button"
        >
          {showForm ? "Close" : "Add connector"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createConnector} className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-name">
                Name
              </label>
              <input
                id="c-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jira – Platform board"
              />
            </div>
            <div>
              <label className="label" htmlFor="c-auth">
                Authorization header (optional)
              </label>
              <input
                id="c-auth"
                className="input"
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
                placeholder="Bearer xxx or Basic xxx"
              />
            </div>
            <div>
              <label className="label" htmlFor="c-base">
                Base URL
              </label>
              <input
                id="c-base"
                className="input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="c-endpoint">
                Endpoint path (optional)
              </label>
              <input
                id="c-endpoint"
                className="input"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="v2/search?jql=..."
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-map">
              Field mapping (JSON)
            </label>
            <textarea
              id="c-map"
              className="input min-h-56 resize-y font-mono text-xs"
              value={fieldMapping}
              onChange={(e) => setFieldMapping(e.target.value)}
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Map Pulse fields to dot-paths in the source response. Use{" "}
              <code>recordsPath</code> for the array location and{" "}
              <code>statusMap</code> to translate external statuses.
            </p>
          </div>
          {createError && (
            <p className="rounded-lg bg-status-offtrackSoft px-3 py-2 text-sm text-status-offtrack">
              {createError}
            </p>
          )}
          <div className="flex justify-end">
            <button className="btn-primary" disabled={creating} type="submit">
              {creating ? "Saving..." : "Save connector"}
            </button>
          </div>
        </form>
      )}

      {connectors.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink-soft">
          No connectors yet. Add one to ingest initiatives from any REST API.
        </div>
      ) : (
        <div className="space-y-3">
          {connectors.map((c) => {
            const result = results[c.id];
            const error = errors[c.id];
            return (
              <div key={c.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-ink">{c.name}</h3>
                    <p className="mt-0.5 truncate text-sm text-ink-soft">
                      {c.baseUrl}
                      {c.endpoint ? `/${c.endpoint.replace(/^\//, "")}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {c.initiativeCount} initiative
                      {c.initiativeCount === 1 ? "" : "s"} · last synced{" "}
                      {c.lastSyncedAt ? relativeTime(c.lastSyncedAt) : "never"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn-primary"
                      onClick={() => sync(c.id)}
                      disabled={busyId === c.id}
                      type="button"
                    >
                      {busyId === c.id ? "Syncing..." : "Sync now"}
                    </button>
                    <button
                      className="btn-ghost text-status-offtrack hover:bg-status-offtrackSoft"
                      onClick={() => remove(c.id)}
                      disabled={busyId === c.id}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {result && (
                  <div className="mt-3 rounded-lg bg-status-ontrackSoft px-3 py-2 text-sm text-ink">
                    Synced {result.total} record{result.total === 1 ? "" : "s"}:{" "}
                    <strong>{result.created}</strong> created,{" "}
                    <strong>{result.updated}</strong> updated
                    {result.skipped > 0 && (
                      <>
                        , <strong>{result.skipped}</strong> skipped
                      </>
                    )}
                    .
                    {result.errors.length > 0 && (
                      <ul className="mt-1 list-inside list-disc text-xs text-status-offtrack">
                        {result.errors.slice(0, 5).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {error && (
                  <div className="mt-3 rounded-lg bg-status-offtrackSoft px-3 py-2 text-sm text-status-offtrack">
                    {error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
