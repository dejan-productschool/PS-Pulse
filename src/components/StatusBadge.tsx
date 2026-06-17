import { statusMeta } from "@/lib/status";

export function StatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const meta = statusMeta(status);
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${meta.bg} ${meta.text} ${meta.ring} ${pad}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
