"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SeedButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function seed() {
    setBusy(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn-secondary" onClick={seed} disabled={busy}>
      {busy ? "Loading..." : "Load demo data"}
    </button>
  );
}
