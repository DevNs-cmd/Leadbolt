"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDashboard, listLeads, type Dashboard, type Lead } from "@/lib/api";
import { GRADES } from "@/lib/scoring";
import LeadCard from "@/components/LeadCard";

const STATUSES = ["new", "qualified", "contacted", "lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadList, dash] = await Promise.all([
        listLeads({
          search: search || undefined,
          status: status || undefined,
          grade: grade || undefined,
        }),
        getDashboard(),
      ]);
      setLeads(leadList);
      setDashboard(dash);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to load leads: ${err.message}`
          : "Failed to load leads"
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, grade]);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      fetchData();
      return;
    }
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, status, grade, fetchData]);

  function handleQualified(updated: Lead) {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === updated.id ? updated : lead))
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Leads</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Score and qualify leads with AI-powered BANT analysis.
        </p>
      </div>

      {dashboard && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Total Leads" value={dashboard.total_leads} />
          <StatCard label="Avg Score" value={dashboard.avg_score} />
          {(
            [
              ["Hot", dashboard.distribution.hot],
              ["Warm", dashboard.distribution.warm],
              ["Cold", dashboard.distribution.cold],
              ["Unqualified", dashboard.distribution.unqualified],
            ] as const
          ).map(([label, count]) => (
            <StatCard
              key={label}
              label={label}
              value={count}
              color={GRADES.find((g) => g.grade.startsWith(label))?.color}
            />
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, company, email..."
          className="flex-1 rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink outline-none transition-colors focus:border-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink outline-none focus:border-primary"
        >
          <option value="">All grades</option>
          {[...GRADES].reverse().map((g) => (
            <option key={g.grade} value={g.grade}>
              {g.grade}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && leads.length === 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl border border-line bg-white"
            />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white py-16 text-center">
          <p className="text-sm text-ink-secondary">No leads found.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onQualified={handleQualified} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-secondary">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}
