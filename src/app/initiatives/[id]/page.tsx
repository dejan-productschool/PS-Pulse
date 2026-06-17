import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { UpdateForm } from "@/components/UpdateForm";
import { DeleteInitiativeButton } from "@/components/DeleteInitiativeButton";
import { formatDate, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

export default async function InitiativeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      updates: { orderBy: { createdAt: "desc" } },
      connector: true,
    },
  });
  if (!initiative) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">
          ← Back to dashboard
        </Link>
        <div className="flex items-center gap-1">
          <Link href={`/initiatives/${id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <DeleteInitiativeButton initiativeId={id} />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {initiative.name}
            </h1>
            <StatusBadge status={initiative.status} />
          </div>
          {initiative.summary && (
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              {initiative.summary}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Meta */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="card p-5">
            <dl className="space-y-4">
              <Field label="DRI (owner)">
                <span className="flex items-center gap-2">
                  <Avatar name={initiative.driName} size="sm" />
                  <span>
                    {initiative.driName || "Unassigned"}
                    {initiative.driEmail && (
                      <span className="block text-xs text-ink-faint">
                        {initiative.driEmail}
                      </span>
                    )}
                  </span>
                </span>
              </Field>
              <Field label="Team">{initiative.team || "—"}</Field>
              <Field label="Target date">{formatDate(initiative.targetDate)}</Field>
              <Field label="Source">
                {initiative.source === "IMPORTED" ? (
                  <span>
                    Imported
                    {initiative.connector && (
                      <span className="text-ink-faint">
                        {" "}
                        · {initiative.connector.name}
                      </span>
                    )}
                  </span>
                ) : (
                  "Created manually"
                )}
              </Field>
              <Field label="Last updated">{relativeTime(initiative.updatedAt)}</Field>
            </dl>
          </div>

          <UpdateForm
            initiativeId={initiative.id}
            currentStatus={initiative.status}
            defaultAuthor={initiative.driName}
          />
        </aside>

        {/* Timeline */}
        <section className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-ink">Status history</h2>
            {initiative.updates.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">No updates yet.</p>
            ) : (
              <ol className="mt-5 space-y-0">
                {initiative.updates.map((u, idx) => (
                  <li key={u.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* connector line */}
                    {idx !== initiative.updates.length - 1 && (
                      <span className="absolute left-[7px] top-5 h-full w-px bg-line" />
                    )}
                    <span
                      className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-surface ${
                        StatusDot(u.status)
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={u.status} size="sm" />
                        <span className="text-xs text-ink-faint">
                          {relativeTime(u.createdAt)}
                          {u.author ? ` · ${u.author}` : ""}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink">{u.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusDot(status: string): string {
  // Mirror the badge dot color for the timeline marker.
  return {
    ON_TRACK: "bg-status-ontrack",
    AT_RISK: "bg-status-atrisk",
    OFF_TRACK: "bg-status-offtrack",
    NOT_STARTED: "bg-status-notstarted",
    PAUSED: "bg-status-paused",
    DONE: "bg-status-done",
  }[status] ?? "bg-status-notstarted";
}
