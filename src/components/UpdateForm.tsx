"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUSES, statusLabel } from "@/lib/status";

export function UpdateForm({
  initiativeId,
  currentStatus,
  defaultAuthor,
}: {
  initiativeId: string;
  currentStatus: string;
  defaultAuthor: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState(defaultAuthor);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("Write a short update before posting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, body, author }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not post update.");
      }
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post update.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <h3 className="text-sm font-semibold text-ink">Post an update</h3>
      <textarea
        className="input min-h-20 resize-y"
        placeholder="What changed since the last update?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="update-status">
            Status
          </label>
          <select
            id="update-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="update-author">
            Posted by
          </label>
          <input
            id="update-author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
          />
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-status-offtrackSoft px-3 py-2 text-sm text-status-offtrack">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Posting..." : "Post update"}
        </button>
      </div>
    </form>
  );
}
