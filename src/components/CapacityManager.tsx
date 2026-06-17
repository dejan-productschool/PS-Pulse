"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Squad } from "@/lib/types";

type InitiativeOption = { id: string; name: string };

function utilization(squad: Squad) {
  const available = squad.members.length * squad.weeks;
  const allocated = squad.allocations.reduce((s, a) => s + a.personWeeks, 0);
  const pct = available > 0 ? Math.round((allocated / available) * 100) : 0;
  return { available, allocated, pct };
}

function utilColor(pct: number): string {
  if (pct > 100) return "#f04438";
  if (pct >= 85) return "#f79009";
  return "#12b76a";
}

export function CapacityManager({
  squads,
  initiativeOptions,
}: {
  squads: Squad[];
  initiativeOptions: InitiativeOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [cycleName, setCycleName] = useState("Current cycle");
  const [weeks, setWeeks] = useState(13);
  const [members, setMembers] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createSquad(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Squad name is required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cycleName, weeks: Number(weeks), members }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not create squad.");
      }
      setName("");
      setMembers("");
      setWeeks(13);
      setCycleName("Current cycle");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create squad.");
    } finally {
      setCreating(false);
    }
  }

  async function patchSquad(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/squads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeSquad(id: string) {
    if (!confirm("Delete this squad and its allocations?")) return;
    setBusy(true);
    try {
      await fetch(`/api/squads/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addAllocation(
    squadId: string,
    body: { initiativeId: string | null; label: string; personWeeks: number },
  ) {
    setBusy(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
      return res.ok;
    } finally {
      setBusy(false);
    }
  }

  async function removeAllocation(squadId: string, allocId: string) {
    setBusy(true);
    try {
      await fetch(`/api/squads/${squadId}/allocations/${allocId}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {squads.length} squad{squads.length === 1 ? "" : "s"}
        </p>
        <button
          className="btn-primary"
          onClick={() => setShowForm((s) => !s)}
          type="button"
        >
          {showForm ? "Close" : "Add squad"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSquad} className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="s-name">
                Squad name
              </label>
              <input
                id="s-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Payments"
              />
            </div>
            <div>
              <label className="label" htmlFor="s-cycle">
                Planning cycle
              </label>
              <input
                id="s-cycle"
                className="input"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g. Q3 2026"
              />
            </div>
            <div>
              <label className="label" htmlFor="s-weeks">
                Weeks in cycle
              </label>
              <input
                id="s-weeks"
                type="number"
                min={1}
                className="input"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="s-members">
                Members (comma separated)
              </label>
              <input
                id="s-members"
                className="input"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                placeholder="Ada, Linus, Grace"
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-status-offtrackSoft px-3 py-2 text-sm text-status-offtrack">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button className="btn-primary" disabled={creating} type="submit">
              {creating ? "Saving..." : "Save squad"}
            </button>
          </div>
        </form>
      )}

      {squads.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink-soft">
          No squads yet. Add one to plan capacity in person-weeks across
          initiatives.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {squads.map((squad) => {
            const { available, allocated, pct } = utilization(squad);
            const isOpen = expanded === squad.id;
            return (
              <div key={squad.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-ink">{squad.name}</h3>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {squad.cycleName} · {squad.members.length} member
                      {squad.members.length === 1 ? "" : "s"} · {squad.weeks}w
                    </p>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: utilColor(pct) }}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: utilColor(pct),
                    }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-faint">
                  {allocated} of {available} person-weeks allocated
                </p>

                <button
                  type="button"
                  className="btn-ghost mt-3 px-2 py-1 text-xs"
                  onClick={() => setExpanded(isOpen ? null : squad.id)}
                >
                  {isOpen ? "Hide details" : "Plan allocations"}
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4 border-t border-line pt-4">
                    <MemberEditor
                      squad={squad}
                      busy={busy}
                      onChange={(names) =>
                        patchSquad(squad.id, { members: names })
                      }
                    />

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                        Allocations
                      </h4>
                      {squad.allocations.length === 0 ? (
                        <p className="mt-2 text-sm text-ink-soft">
                          Nothing allocated yet.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {squad.allocations.map((a) => {
                            const initiative = a.initiativeId
                              ? initiativeOptions.find(
                                  (o) => o.id === a.initiativeId,
                                )
                              : null;
                            return (
                              <li
                                key={a.id}
                                className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-1.5"
                              >
                                <span className="truncate text-sm text-ink">
                                  {initiative?.name ?? a.label}
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                  <span className="text-sm tabular-nums text-ink-soft">
                                    {a.personWeeks} pw
                                  </span>
                                  <button
                                    type="button"
                                    className="text-ink-faint hover:text-status-offtrack"
                                    onClick={() =>
                                      removeAllocation(squad.id, a.id)
                                    }
                                    aria-label="Remove allocation"
                                  >
                                    ×
                                  </button>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <AllocationForm
                        busy={busy}
                        initiativeOptions={initiativeOptions}
                        onAdd={(body) => addAllocation(squad.id, body)}
                      />
                    </div>

                    <div className="flex justify-end border-t border-line pt-3">
                      <button
                        type="button"
                        className="btn-ghost text-status-offtrack hover:bg-status-offtrackSoft"
                        onClick={() => removeSquad(squad.id)}
                        disabled={busy}
                      >
                        Delete squad
                      </button>
                    </div>
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

function MemberEditor({
  squad,
  busy,
  onChange,
}: {
  squad: Squad;
  busy: boolean;
  onChange: (names: string[]) => void;
}) {
  const [newMember, setNewMember] = useState("");
  const names = squad.members.map((m) => m.name);

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Members
      </h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {squad.members.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-xs text-ink"
          >
            {m.name}
            <button
              type="button"
              className="text-ink-faint hover:text-status-offtrack"
              onClick={() => onChange(names.filter((n) => n !== m.name))}
              disabled={busy}
              aria-label={`Remove ${m.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="input"
          value={newMember}
          onChange={(e) => setNewMember(e.target.value)}
          placeholder="Add member"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (newMember.trim()) {
                onChange([...names, newMember.trim()]);
                setNewMember("");
              }
            }
          }}
        />
        <button
          type="button"
          className="btn-secondary shrink-0"
          disabled={busy || !newMember.trim()}
          onClick={() => {
            onChange([...names, newMember.trim()]);
            setNewMember("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AllocationForm({
  busy,
  initiativeOptions,
  onAdd,
}: {
  busy: boolean;
  initiativeOptions: InitiativeOption[];
  onAdd: (body: {
    initiativeId: string | null;
    label: string;
    personWeeks: number;
  }) => Promise<boolean | undefined>;
}) {
  const [initiativeId, setInitiativeId] = useState("");
  const [label, setLabel] = useState("");
  const [pw, setPw] = useState(1);

  async function submit() {
    const ok = await onAdd({
      initiativeId: initiativeId || null,
      label:
        initiativeId
          ? initiativeOptions.find((o) => o.id === initiativeId)?.name ?? "Allocation"
          : label,
      personWeeks: Number(pw),
    });
    if (ok) {
      setInitiativeId("");
      setLabel("");
      setPw(1);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <div className="min-w-[10rem] flex-1">
        <select
          className="input"
          value={initiativeId}
          onChange={(e) => setInitiativeId(e.target.value)}
        >
          <option value="">Custom label…</option>
          {initiativeOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        {!initiativeId && (
          <input
            className="input mt-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Discovery, On-call"
          />
        )}
      </div>
      <input
        type="number"
        min={0.5}
        step={0.5}
        className="input w-24"
        value={pw}
        onChange={(e) => setPw(Number(e.target.value))}
        aria-label="Person-weeks"
      />
      <button
        type="button"
        className="btn-secondary"
        disabled={busy}
        onClick={submit}
      >
        Allocate
      </button>
    </div>
  );
}
