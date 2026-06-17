import Link from "next/link";
import { notFound } from "next/navigation";
import { getInitiative } from "@/lib/store";
import { InitiativeForm } from "@/components/InitiativeForm";

export const dynamic = "force-dynamic";

export default async function EditInitiativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initiative = await getInitiative(id);
  if (!initiative) notFound();

  const targetDate = initiative.targetDate
    ? initiative.targetDate.slice(0, 10)
    : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/initiatives/${id}`}
          className="text-sm text-ink-soft hover:text-ink"
        >
          ← Back to initiative
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Edit initiative
        </h1>
      </div>
      <InitiativeForm
        initiativeId={id}
        initialValues={{
          name: initiative.name,
          summary: initiative.summary,
          driName: initiative.driName,
          driEmail: initiative.driEmail,
          team: initiative.team,
          status: initiative.status,
          targetDate,
        }}
      />
    </div>
  );
}
