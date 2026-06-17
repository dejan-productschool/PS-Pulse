"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteInitiativeButton({ initiativeId }: { initiativeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this initiative and its update history?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      router.push("/");
      router.refresh();
    } catch {
      setBusy(false);
      alert("Could not delete this initiative.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="btn-ghost text-status-offtrack hover:bg-status-offtrackSoft"
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
