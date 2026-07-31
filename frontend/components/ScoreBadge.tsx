"use client";

import { getGrade } from "@/lib/scoring";

interface ScoreBadgeProps {
  score: number;
  showGrade?: boolean;
  size?: "sm" | "md";
}

export default function ScoreBadge({
  score,
  showGrade = true,
  size = "md",
}: ScoreBadgeProps) {
  const grade = getGrade(score);
  const dim = size === "md" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${dim} flex items-center justify-center rounded-full border-4 font-bold text-white shadow-sm`}
        style={{ backgroundColor: grade.color, borderColor: grade.color }}
        title={`${grade.grade} - ${grade.priority} priority`}
      >
        {score}
      </div>
      {showGrade && (
        <span className="text-[11px] font-semibold" style={{ color: grade.color }}>
          {grade.grade}
        </span>
      )}
    </div>
  );
}
