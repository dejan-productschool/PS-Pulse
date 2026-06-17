"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { Initiative } from "@/lib/types";
import {
  buildTimelineConfig,
  getDatePosition,
  parseDate,
  MILESTONE_MARKERS,
} from "@/lib/timeline";
import { statusHex, statusLabel } from "@/lib/status";
import { formatDate } from "@/lib/format";

const LABEL_W = 260;
const ROW_H = 52;
const BAR_H = 26;

export function RoadmapChart({ initiatives }: { initiatives: Initiative[] }) {
  const router = useRouter();
  const config = useMemo(() => buildTimelineConfig(initiatives), [initiatives]);
  const { columns, columnWidth, totalWidth } = config;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayX = getDatePosition(today, columns, columnWidth);
  const todayVisible =
    columns.length > 0 &&
    today >= columns[0].date &&
    today <= columns[columns.length - 1].endDate;

  const gridStyle = {
    backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${
      columnWidth - 1
    }px, #eef0f3 ${columnWidth - 1}px, #eef0f3 ${columnWidth}px)`,
  };

  return (
    <div className="card overflow-hidden">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-4 py-3 text-xs text-ink-soft">
        <span className="font-medium text-ink">Milestones:</span>
        {MILESTONE_MARKERS.map((m) => (
          <span key={m.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-1 rounded-sm"
              style={{ backgroundColor: m.color }}
            />
            {m.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div style={{ width: LABEL_W + totalWidth, minWidth: "100%" }}>
          {/* Header */}
          <div className="flex border-b border-line bg-surface-muted">
            <div
              className="sticky left-0 z-20 shrink-0 bg-surface-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-faint"
              style={{ width: LABEL_W }}
            >
              Initiative
            </div>
            <div className="relative" style={{ width: totalWidth, height: 32 }}>
              {columns.map((col, i) => (
                <div
                  key={i}
                  className={`absolute top-0 flex h-full items-center justify-center text-[11px] ${
                    col.isToday ? "font-semibold text-brand" : "text-ink-faint"
                  }`}
                  style={{ left: i * columnWidth, width: columnWidth }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="relative">
            {todayVisible && (
              <div
                className="pointer-events-none absolute top-0 z-10 w-px bg-brand/40"
                style={{ left: LABEL_W + todayX, height: initiatives.length * ROW_H }}
              />
            )}

            {initiatives.map((i) => {
              const hasStart = Boolean(i.startDate);
              const hasEnd = Boolean(i.targetDate);
              const start = i.startDate
                ? parseDate(i.startDate)
                : columns[0]?.date ?? today;
              const end = i.targetDate
                ? parseDate(i.targetDate)
                : columns[columns.length - 1]?.endDate ?? today;
              const leftPx = getDatePosition(start, columns, columnWidth);
              const endPx = getDatePosition(end, columns, columnWidth);
              const widthPx = Math.max(6, endPx - leftPx);
              const color = statusHex(i.status);
              const dated = hasStart || hasEnd;

              return (
                <div
                  key={i.id}
                  className="flex border-b border-line last:border-b-0 hover:bg-surface-muted/60"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/initiatives/${i.id}`)}
                    className="sticky left-0 z-10 flex shrink-0 flex-col justify-center gap-0.5 bg-surface px-4 text-left transition-colors hover:bg-surface-muted"
                    style={{ width: LABEL_W, height: ROW_H }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate text-sm font-medium text-ink">
                        {i.name}
                      </span>
                    </span>
                    <span className="truncate pl-4 text-xs text-ink-faint">
                      {i.driName || "Unassigned"}
                      {i.team ? ` · ${i.team}` : ""}
                    </span>
                  </button>

                  <div
                    className="relative"
                    style={{ width: totalWidth, height: ROW_H, ...gridStyle }}
                  >
                    {/* Bar */}
                    <button
                      type="button"
                      onClick={() => router.push(`/initiatives/${i.id}`)}
                      title={`${i.name}\n${statusLabel(i.status)}\nStart: ${
                        i.startDate ? formatDate(i.startDate) : "—"
                      }\nDue: ${i.targetDate ? formatDate(i.targetDate) : "—"}`}
                      className="absolute rounded-md transition-[filter] hover:brightness-110"
                      style={{
                        left: Math.max(0, leftPx),
                        width: widthPx,
                        height: BAR_H,
                        top: (ROW_H - BAR_H) / 2,
                        backgroundColor: dated ? color : "transparent",
                        opacity: dated ? (hasStart && hasEnd ? 1 : 0.55) : 0,
                        border: dated ? "none" : "1px dashed #cbd2dc",
                      }}
                    />

                    {/* Milestone markers */}
                    {MILESTONE_MARKERS.map((m) => {
                      const val = i.milestones[m.key];
                      if (!val) return null;
                      const x = getDatePosition(parseDate(val), columns, columnWidth);
                      return (
                        <div
                          key={m.key}
                          title={`${m.label}: ${formatDate(val)}`}
                          className="absolute z-[5] -translate-x-1/2 cursor-default"
                          style={{ left: x, top: (ROW_H - BAR_H) / 2 - 4 }}
                        >
                          <div
                            className="h-[34px] w-[3px] rounded-sm"
                            style={{ backgroundColor: m.color }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
