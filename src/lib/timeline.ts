import type { Initiative, Milestones } from "./types";

// Date math for the roadmap Gantt, adapted from Horizon's timelineUtils so the
// rendering logic matches (columns, positioning, granularity).

export function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (!Number.isNaN(date.getTime())) {
    date.setHours(0, 0, 0, 0);
    return date;
  }
  const fallback = new Date();
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

export type TimeGranularity = "days" | "weeks" | "months";

export interface TimelineColumn {
  date: Date;
  endDate: Date;
  label: string;
  isToday: boolean;
}

export interface TimelineConfig {
  start: Date;
  end: Date;
  granularity: TimeGranularity;
  columnWidth: number;
  columns: TimelineColumn[];
  totalWidth: number;
}

export function getDatePosition(
  date: Date,
  columns: TimelineColumn[],
  columnWidth: number,
): number {
  if (columns.length === 0) return 0;
  const dateTime = date.getTime();
  const firstColumn = columns[0];
  if (dateTime < firstColumn.date.getTime()) return 0;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const colStart = col.date.getTime();
    const colEnd = col.endDate.getTime();
    if (dateTime >= colStart && dateTime < colEnd) {
      const colProgress = (dateTime - colStart) / (colEnd - colStart);
      return (i + colProgress) * columnWidth;
    }
  }
  return columns.length * columnWidth;
}

function milestoneDates(m: Milestones): string[] {
  return [m.discoveryEnd, m.devStart, m.qaStart, m.launch].filter(
    (d): d is string => Boolean(d),
  );
}

function calculateTimelineRange(data: Initiative[]): { start: Date; end: Date } {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  const consider = (value: string | null | undefined) => {
    if (!value) return;
    const d = parseDate(value);
    if (!minDate || d < minDate) minDate = d;
    if (!maxDate || d > maxDate) maxDate = d;
  };
  for (const i of data) {
    consider(i.startDate);
    consider(i.targetDate);
    for (const d of milestoneDates(i.milestones)) consider(d);
  }
  const now = new Date();
  if (!minDate) minDate = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!maxDate) maxDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return {
    start: new Date((minDate as Date).getTime() - oneWeek),
    end: new Date((maxDate as Date).getTime() + oneWeek),
  };
}

function determineGranularity(
  start: Date,
  end: Date,
): { granularity: TimeGranularity; columnWidth: number } {
  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 21) return { granularity: "days", columnWidth: 36 };
  if (daysDiff <= 120) return { granularity: "weeks", columnWidth: 64 };
  return { granularity: "months", columnWidth: 110 };
}

function generateColumns(
  start: Date,
  end: Date,
  granularity: TimeGranularity,
): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  if (granularity === "days") {
    while (current <= end) {
      const colStart = new Date(current);
      const colEnd = new Date(current);
      colEnd.setDate(colEnd.getDate() + 1);
      columns.push({
        date: colStart,
        endDate: colEnd,
        label: current.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        isToday: current.toDateString() === today.toDateString(),
      });
      current.setDate(current.getDate() + 1);
    }
  } else if (granularity === "weeks") {
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current.setDate(current.getDate() + diff);
    while (current <= end) {
      const colStart = new Date(current);
      const colEnd = new Date(current);
      colEnd.setDate(colEnd.getDate() + 7);
      columns.push({
        date: colStart,
        endDate: colEnd,
        label: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isToday: today >= colStart && today < colEnd,
      });
      current.setDate(current.getDate() + 7);
    }
  } else {
    current.setDate(1);
    while (current <= end) {
      const colStart = new Date(current);
      const colEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      columns.push({
        date: colStart,
        endDate: colEnd,
        label: current.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        isToday: today >= colStart && today < colEnd,
      });
      current.setMonth(current.getMonth() + 1);
    }
  }
  return columns;
}

export function buildTimelineConfig(data: Initiative[]): TimelineConfig {
  const { start: rawStart, end: rawEnd } = calculateTimelineRange(data);
  const { granularity, columnWidth } = determineGranularity(rawStart, rawEnd);
  const columns = generateColumns(rawStart, rawEnd, granularity);
  const start = columns[0]?.date ?? rawStart;
  const end = columns[columns.length - 1]?.endDate ?? rawEnd;
  return {
    start,
    end,
    granularity,
    columnWidth,
    columns,
    totalWidth: columns.length * columnWidth,
  };
}

export const MILESTONE_MARKERS: {
  key: keyof Milestones;
  label: string;
  color: string;
}[] = [
  { key: "discoveryEnd", label: "Discovery", color: "#7e57c2" },
  { key: "devStart", label: "Build It", color: "#1565c0" },
  { key: "qaStart", label: "Test It", color: "#ef6c00" },
  { key: "launch", label: "Launch", color: "#2e7d32" },
];
