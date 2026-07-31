"use client";

import { useState } from "react";
import { getLead, qualifyLead, type Lead, type QualificationResult } from "@/lib/api";
import ScoreBadge from "./ScoreBadge";

interface QualificationModalProps {
  lead: Lead;
  onClose: () => void;
  onQualified: (updatedLead: Lead) => void;
}

type Phase = "intro" | "loading" | "results";

export default function QualificationModal({
  lead,
  onClose,
  onQualified,
}: QualificationModalProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<QualificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleQualify() {
    setPhase("loading");
    setError(null);
    try {
      const qualification = await qualifyLead(lead.id);
      setResult(qualification);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Qualification failed");
      setPhase("intro");
    }
  }

  async function handleApply() {
    try {
      const updated = await getLead(lead.id);
      onQualified(updated);
    } catch {
      onQualified(lead);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <span aria-hidden>🤖</span> AI Lead Qualification
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === "intro" && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-secondary/30 bg-secondary/5 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
                <span aria-hidden>🤖</span>
              </div>
              <p className="max-w-md text-sm text-ink-secondary">
                AI will analyze this lead and provide a comprehensive qualification
                assessment including BANT analysis, strengths &amp; weaknesses, and
                recommended next actions.
              </p>
              <button
                onClick={handleQualify}
                className="rounded-lg bg-secondary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary-dark"
              >
                Qualify with AI
              </button>
              {error && (
                <p className="text-sm text-danger">{error}</p>
              )}
            </div>
          )}

          {phase === "loading" && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
              <p className="text-sm text-ink-secondary">
                Analyzing lead with Claude AI...
              </p>
            </div>
          )}

          {phase === "results" && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-xl border border-line bg-surface py-3">
                  <span className="text-xs uppercase tracking-wide text-ink-secondary">
                    Score
                  </span>
                  <ScoreBadge score={result.score} showGrade={false} size="sm" />
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-3">
                  <span className="text-xs uppercase tracking-wide text-ink-secondary">
                    Grade
                  </span>
                  <span className="text-sm font-bold" style={{ color: getColor(result.grade) }}>
                    {result.grade}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-3">
                  <span className="text-xs uppercase tracking-wide text-ink-secondary">
                    Priority
                  </span>
                  <span className="text-sm font-bold text-ink">{result.priority}</span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink">BANT Analysis</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["Budget", result.bantAnalysis.budget],
                      ["Authority", result.bantAnalysis.authority],
                      ["Need", result.bantAnalysis.need],
                      ["Timeline", result.bantAnalysis.timeline],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-line p-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-success">Strengths</h3>
                  <ul className="space-y-1 text-sm text-ink">
                    {result.strengths.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-danger">Weaknesses</h3>
                  <ul className="space-y-1 text-sm text-ink">
                    {result.weaknesses.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden>✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border border-line p-4">
                <h3 className="mb-2 text-sm font-semibold text-secondary">
                  Recommended Actions
                </h3>
                <ul className="space-y-1 text-sm text-ink">
                  {result.recommendations.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span aria-hidden>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {result.reasoning && (
                <div className="rounded-lg bg-surface p-4">
                  <h3 className="mb-1 text-sm font-semibold text-ink">Reasoning</h3>
                  <p className="text-sm text-ink-secondary">{result.reasoning}</p>
                  <p className="mt-2 text-xs text-ink-secondary">
                    Source:{" "}
                    {result.provider === "claude"
                      ? "Claude AI"
                      : result.provider === "gemini"
                        ? "Gemini AI"
                        : "Rule-based fallback"}
                    {result.fallback_reason && (
                      <span className="block text-warning">
                        {result.fallback_reason}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
          >
            Close
          </button>
          {phase === "results" && (
            <button
              onClick={handleApply}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Apply Qualification
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getColor(grade: string): string {
  switch (grade) {
    case "Hot Lead":
      return "#10B981";
    case "Warm Lead":
      return "#F59E0B";
    case "Cold Lead":
      return "#3B82F6";
    default:
      return "#6B7280";
  }
}
