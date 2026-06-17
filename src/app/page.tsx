import Link from "next/link";
import { listInitiatives } from "@/lib/store";
import { STATUSES, statusMeta, isStatus, type Status } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { SeedButton } from "@/components/SeedButton";
import { HealthSummary } from "@/components/HealthSummary";
import { formatDate, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Search = { status?: string; team?: string };

function buildQuery(base: Search, patch: Partial<Search>): string {
  const next: Record<string, string> = {};
  if (base.status) next.status = base.status;
  if (base.team) next.team = base.team;
  for (const [k, v] of Object.entries(patch)) {
    if (v) next[k] = v;
    else delete next[k];
  }
  const qs = new URLSearchParams(next).toString();
  return qs ? `/?${qs}` : "/";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const activeStatus = sp.status && isStatus(sp.status) ? sp.status : undefined;
  const activeTeam = sp.team || undefined;

  const all = await listInitiatives();
  const initiatives = all.filter(
    (i) =>
      (!activeStatus || i.status === activeStatus) &&
      (!activeTeam || i.team === activeTeam),
  );

  const counts = STATUSES.reduce<Record<Status, number>>(
    (acc, s) => {
      acc[s] = all.filter((i) => i.status === s).length;
      return acc;
    },
    {} as Record<Status, number>,
  );

  const teams = Array.from(
    new Set(all.map((i) => i.team).filter((t): t is string => Boolean(t))),
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Initiatives
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {all.length} tracked · who owns it and where it stands.
          </p>
        </div>
      </div>

      {/* Health summary (Horizon-style) */}
      <HealthSummary initiatives={all} />

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => {
          const meta = statusMeta(s);
          const isActive = activeStatus === s;
          return (
            <Link
              key={s}
              href={buildQuery(sp, { status: isActive ? undefined : s })}
              className={`card flex flex-col gap-1 px-4 py-3 transition-all hover:shadow-pop ${
                isActive ? "ring-2 ring-brand/40" : ""
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              <span className="text-2xl font-semibold tabular-nums text-ink">
                {counts[s]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Team filter */}
      {teams.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Team
          </span>
          <Link
            href={buildQuery(sp, { team: undefined })}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              !activeTeam
                ? "bg-ink text-white"
                : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:bg-surface-sunken"
            }`}
          >
            All
          </Link>
          {teams.map((t) => (
            <Link
              key={t}
              href={buildQuery(sp, { team: activeTeam === t ? undefined : t })}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                activeTeam === t
                  ? "bg-ink text-white"
                  : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:bg-surface-sunken"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* List */}
      {initiatives.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-sm text-ink-soft">
            {all.length === 0
              ? "No initiatives yet."
              : "No initiatives match these filters."}
          </p>
          <div className="flex items-center gap-2">
            <Link href="/initiatives/new" className="btn-primary">
              New initiative
            </Link>
            {all.length === 0 && <SeedButton />}
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {initiatives.map((i) => {
            const latest = i.updates[0];
            return (
              <Link
                key={i.id}
                href={`/initiatives/${i.id}`}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-muted sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink">{i.name}</span>
                    {i.source === "IMPORTED" && (
                      <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                        Imported
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">
                    {latest ? latest.body : i.summary || "No updates yet."}
                  </p>
                </div>

                <div className="hidden w-28 shrink-0 text-sm text-ink-soft md:block">
                  {i.team || "—"}
                </div>

                <div className="hidden w-36 shrink-0 items-center gap-2 sm:flex">
                  <Avatar name={i.driName} size="sm" />
                  <span className="truncate text-sm text-ink-soft">
                    {i.driName || "Unassigned"}
                  </span>
                </div>

                <div className="hidden w-28 shrink-0 text-right text-sm text-ink-soft lg:block">
                  {formatDate(i.targetDate)}
                </div>

                <div className="w-24 shrink-0 text-right text-xs text-ink-faint">
                  {relativeTime(latest?.createdAt ?? i.updatedAt)}
                </div>

                <div className="shrink-0">
                  <StatusBadge status={i.status} size="sm" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
