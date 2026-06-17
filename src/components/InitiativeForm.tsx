"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUSES, statusLabel } from "@/lib/status";

export type InitiativeFormValues = {
  name: string;
  summary: string;
  driName: string;
  driEmail: string;
  team: string;
  status: string;
  targetDate: string; // yyyy-mm-dd or ""
};

const empty: InitiativeFormValues = {
  name: "",
  summary: "",
  driName: "",
  driEmail: "",
  team: "",
  status: "NOT_STARTED",
  targetDate: "",
};

export function InitiativeForm({
  initialValues,
  initiativeId,
}: {
  initialValues?: Partial<InitiativeFormValues>;
  initiativeId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<InitiativeFormValues>({
    ...empty,
    ...initialValues,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initiativeId);

  function set<K extends keyof InitiativeFormValues>(
    key: K,
    value: InitiativeFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/initiatives/${initiativeId}` : "/api/initiatives",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }
      const saved = await res.json();
      router.push(`/initiatives/${isEdit ? initiativeId : saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="name">
          Initiative name
        </label>
        <input
          id="name"
          className="input"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Revamp onboarding flow"
          autoFocus
        />
      </div>

      <div>
        <label className="label" htmlFor="summary">
          Summary
        </label>
        <textarea
          id="summary"
          className="input min-h-24 resize-y"
          value={values.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="What is this initiative about?"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="driName">
            DRI (owner)
          </label>
          <input
            id="driName"
            className="input"
            value={values.driName}
            onChange={(e) => set("driName", e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="label" htmlFor="driEmail">
            DRI email
          </label>
          <input
            id="driEmail"
            type="email"
            className="input"
            value={values.driEmail}
            onChange={(e) => set("driEmail", e.target.value)}
            placeholder="owner@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="team">
            Team
          </label>
          <input
            id="team"
            className="input"
            value={values.team}
            onChange={(e) => set("team", e.target.value)}
            placeholder="e.g. Growth"
          />
        </div>
        <div>
          <label className="label" htmlFor="targetDate">
            Target date
          </label>
          <input
            id="targetDate"
            type="date"
            className="input"
            value={values.targetDate}
            onChange={(e) => set("targetDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          className="input"
          value={values.status}
          onChange={(e) => set("status", e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-status-offtrackSoft px-3 py-2 text-sm text-status-offtrack">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create initiative"}
        </button>
      </div>
    </form>
  );
}
