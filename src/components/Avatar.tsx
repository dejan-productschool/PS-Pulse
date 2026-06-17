import { initials } from "@/lib/format";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  if (!name) {
    return (
      <span
        className={`grid ${dim} place-items-center rounded-full bg-surface-sunken font-semibold text-ink-faint`}
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={`grid ${dim} place-items-center rounded-full bg-brand-soft font-semibold text-brand`}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
