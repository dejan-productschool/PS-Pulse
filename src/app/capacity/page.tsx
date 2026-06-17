import { listInitiatives, listSquads } from "@/lib/store";
import { CapacityManager } from "@/components/CapacityManager";

export const dynamic = "force-dynamic";

export default async function CapacityPage() {
  const [squads, initiatives] = await Promise.all([
    listSquads(),
    listInitiatives(),
  ]);

  const initiativeOptions = initiatives
    .filter((i) => i.status !== "DONE")
    .map((i) => ({ id: i.id, name: i.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Capacity
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Plan squad capacity in person-weeks and see utilization against
          committed initiatives.
        </p>
      </div>

      <CapacityManager
        squads={squads}
        initiativeOptions={initiativeOptions}
      />
    </div>
  );
}
