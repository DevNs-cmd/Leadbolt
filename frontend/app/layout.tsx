import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadBolt - Lead Scoring & AI Qualification",
  description:
    "Enterprise AI Revenue & Sales Operating System. Score and qualify leads with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                LB
              </div>
              <span className="text-lg font-semibold text-ink">LeadBolt</span>
            </div>
            <nav className="flex items-center gap-4 text-sm font-medium text-ink-secondary">
              <Link href="/leads" className="rounded-md px-3 py-2 text-primary">
                Leads
              </Link>
              <Link
                href="/leads"
                className="rounded-md px-3 py-2 text-ink-secondary transition-colors hover:text-ink"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
