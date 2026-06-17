import Link from "next/link";
import { listInitiatives } from "@/lib/store";
import { RoadmapChart } from "@/components/RoadmapChart";
import { SeedButton } from "@/components/SeedButton";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const initiatives = await listInitiatives();
  const datedCount = initiatives.filter(
    (i) => i.startDate || i.targetDate,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Roadmap
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Delivery timeline across every initiative — bars colored by status,
            with milestone markers.
          </p>
        </div>
      </div>

      {initiatives.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-sm text-ink-soft">No initiatives to plot yet.</p>
          <div className="flex items-center gap-2">
            <Link href="/initiatives/new" className="btn-primary">
              New initiative
            </Link>
            <SeedButton />
          </div>
        </div>
      ) : (
        <>
          {datedCount === 0 && (
            <div className="card border-status-atrisk/30 bg-status-atriskSoft px-4 py-3 text-sm text-ink-soft">
              No initiatives have a start or target date yet. Add dates and
              milestones from an initiative&apos;s edit screen to see them on the
              timeline.
            </div>
          )}
          <RoadmapChart initiatives={initiatives} />
        </>
      )}
    </div>
  );
}
