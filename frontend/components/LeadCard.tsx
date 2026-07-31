"use client";

import { useState } from "react";
import type { Lead } from "@/lib/api";
import { getGradeByName, initials } from "@/lib/scoring";
import ScoreBadge from "./ScoreBadge";
import QualificationModal from "./QualificationModal";

interface LeadCardProps {
  lead: Lead;
  onQualified: (lead: Lead) => void;
}

const STATUS_STYLES: Record<string, string> = {
  qualified: "bg-success/10 text-success",
  contacted: "bg-primary/10 text-primary",
  new: "bg-line/60 text-ink-secondary",
  lost: "bg-danger/10 text-danger",
};

export default function LeadCard({ lead, onQualified }: LeadCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showQualify, setShowQualify] = useState(false);

  const grade = getGradeByName(lead.score_grade);
  const name =
    `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Unknown";
  const domain =
    lead.email?.split("@")[1] ?? (lead.company ? `${lead.company}.com` : "");
  const statusClass = STATUS_STYLES[lead.status] ?? STATUS_STYLES.new;
  const components = lead.score_breakdown
    ? [
        { key: "Profile", value: lead.score_breakdown.profile_completeness },
        { key: "Engagement", value: lead.score_breakdown.engagement },
        { key: "BANT", value: lead.score_breakdown.bant_criteria },
        { key: "Behavioral", value: lead.score_breakdown.behavioral },
        { key: "Company Fit", value: lead.score_breakdown.company_fit },
      ]
    : [];

  return (
    <div className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: grade.color }}
          >
            {initials(lead.first_name, lead.last_name)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-ink">{name}</h3>
            {lead.job_title && (
              <p className="truncate text-sm text-ink-secondary">
                {lead.job_title}
              </p>
            )}
            {lead.company && (
              <p className="truncate text-sm font-medium text-primary">
                {lead.company}
              </p>
            )}
          </div>
        </div>
        <ScoreBadge score={lead.score} />
      </div>

      <div className="mt-4 space-y-1 text-sm text-ink-secondary">
        {lead.email && (
          <p className="flex items-center gap-2 truncate">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884 10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884Z" />
              <path d="m18 8.118-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118Z" />
            </svg>
            {lead.email}
          </p>
        )}
        {domain && (
          <p className="flex items-center gap-2 truncate">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0Zm-6.475-6.012a7.005 7.005 0 01.896 3.262 7.5 7.5 0 01-.137 1.5h2.36a6.51 6.51 0 00-3.119-4.762ZM11 5.5a5.48 5.48 0 01-2.358 3.638A5.48 5.48 0 0110.97 9.06a6.54 6.54 0 00.03-3.56ZM9 5.5a6.55 6.55 0 01-.525 2.047 6.51 6.51 0 00-3.036-1.71A7.01 7.01 0 0110.138 4.9A5.51 5.51 0 019 5.5ZM4.9 6.13a6.51 6.51 0 013.004 2.029A6.51 6.51 0 014.5 10.25a6.51 6.51 0 00.4-4.12Zm.11 5.13a6.51 6.51 0 013.394 1.26 6.51 6.51 0 00.222-2.24A5.48 5.48 0 016.14 9.9 6.5 6.5 0 005.01 11.26Zm1.19 1.08a6.51 6.51 0 003.29 1.02c.4 0 .79-.05 1.17-.13a5.48 5.48 0 01-1.17 2.53 6.5 6.5 0 00-3.29-3.42Zm3.67 4.35a6.53 6.53 0 00.75-2.26 5.47 5.47 0 00-1.5.24c.25.5.5.98.75 1.44v.58Zm2.53-4.14a6.5 6.5 0 001.57-1.6 6.51 6.51 0 00-2.32-1.05 5.5 5.5 0 01.75 2.65Zm1.6-4.28a6.5 6.5 0 00-.88.99c.3.03.6.04.91.05a6.5 6.5 0 00-.03-1.04Z"
                clipRule="evenodd"
              />
            </svg>
            {domain}
          </p>
        )}
      </div>

      {showBreakdown && (
        <div className="mt-4 rounded-lg bg-surface p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Score Breakdown
          </p>
          <div className="space-y-1.5">
            {components.map(({ key, value }) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-ink-secondary">{key}</span>
                <div className="flex w-28 items-center gap-1.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(value.points / value.max) * 100}%`,
                        backgroundColor: grade.color,
                      }}
                    />
                  </div>
                  <span className="font-medium text-ink">
                    {value.points}/{value.max}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowBreakdown((v) => !v)}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-surface"
        >
          {showBreakdown ? "Hide Breakdown" : "View Details"}
        </button>
        <button
          onClick={() => setShowQualify(true)}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-secondary-dark"
        >
          <span aria-hidden>🤖</span> Qualify with AI
        </button>
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}
        >
          {lead.status}
        </span>
      </div>

      {showQualify && (
        <QualificationModal
          lead={lead}
          onClose={() => setShowQualify(false)}
          onQualified={(updated) => {
            setShowQualify(false);
            onQualified(updated);
          }}
        />
      )}
    </div>
  );
}
