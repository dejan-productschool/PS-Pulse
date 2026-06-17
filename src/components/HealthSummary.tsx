import type { Initiative } from "@/lib/types";
import { STATUSES, STATUS_HEX, statusMeta, type Status } from "@/lib/status";
import { formatDate } from "@/lib/format";

function withinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return false;
  const now = Date.now();
  return d >= now && d <= now + days * 24 * 60 * 60 * 1000;
}

export function HealthSummary({ initiatives }: { initiatives: Initiative[] }) {
  const total = initiatives.length;
  if (total === 0) return null;

  const counts = STATUSES.reduce<Record<Status, number>>(
    (acc, s) => {
      acc[s] = initiatives.filter((i) => i.status === s).length;
      return acc;
    },
    {} as Record<Status, number>,
  );

  const healthy = counts.ON_TRACK + counts.DONE;
  const onTrackPct = Math.round((healthy / total) * 100);
  const needsAttention = counts.AT_RISK + counts.OFF_TRACK;

  const launching = initiatives
    .filter((i) => i.status !== "DONE" && withinDays(i.milestones.launch, 30))
    .sort(
      (a, b) =>
        new Date(a.milestones.launch!).getTime() -
        new Date(b.milestones.launch!).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Headline health */}
      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink-soft">On track</span>
          <span className="text-3xl font-semibold tabular-nums text-ink">
            {onTrackPct}%
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          {healthy} of {total} initiatives on track or done
        </p>
        {/* Stacked distribution bar */}
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          {STATUSES.map((s) =>
            counts[s] > 0 ? (
              <div
                key={s}
                title={`${statusMeta(s).label}: ${counts[s]}`}
                style={{
                  width: `${(counts[s] / total) * 100}%`,
                  backgroundColor: STATUS_HEX[s],
                }}
              />
            ) : null,
          )}
        </div>
      </div>

      {/* Needs attention */}
      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink-soft">
            Needs attention
          </span>
          <span className="text-3xl font-semibold tabular-nums text-ink">
            {needsAttention}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <Row
            color={STATUS_HEX.AT_RISK}
            label="At risk"
            value={counts.AT_RISK}
          />
          <Row
            color={STATUS_HEX.OFF_TRACK}
            label="Off track"
            value={counts.OFF_TRACK}
          />
          <Row
            color={STATUS_HEX.PAUSED}
            label="Paused"
            value={counts.PAUSED}
          />
        </div>
      </div>

      {/* Launching soon */}
      <div className="card p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink-soft">
            Launching soon
          </span>
          <span className="text-3xl font-semibold tabular-nums text-ink">
            {launching.length}
          </span>
        </div>
        {launching.length === 0 ? (
          <p className="mt-4 text-xs text-ink-faint">
            No launches in the next 30 days.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {launching.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-ink">{i.name}</span>
                <span className="shrink-0 text-xs font-medium text-ink-soft">
                  {formatDate(i.milestones.launch)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-ink-soft">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums text-ink">{value}</span>
    </div>
  );
}
