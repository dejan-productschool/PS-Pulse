import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse Lite",
  description: "Status updates for your initiatives — who owns it, where it stands.",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
    >
      {label}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-full">
          <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
                  P
                </span>
                <span className="text-base font-semibold tracking-tight text-ink">
                  Pulse <span className="font-normal text-ink-faint">Lite</span>
                </span>
              </Link>
              <nav className="flex items-center gap-1">
                <NavLink href="/" label="Dashboard" />
                <NavLink href="/roadmap" label="Roadmap" />
                <NavLink href="/capacity" label="Capacity" />
                <NavLink href="/connectors" label="Connectors" />
                <Link href="/initiatives/new" className="btn-primary ml-1">
                  New initiative
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
