import Link from "next/link";
import { InitiativeForm } from "@/components/InitiativeForm";

export default function NewInitiativePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          New initiative
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Track an initiative manually. You can also import from an external
          source on the Connectors page.
        </p>
      </div>
      <InitiativeForm />
    </div>
  );
}
