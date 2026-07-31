export const GRADES = [
  { min: 80, grade: "Hot Lead", color: "#10B981", priority: "Immediate" },
  { min: 60, grade: "Warm Lead", color: "#F59E0B", priority: "High" },
  { min: 40, grade: "Cold Lead", color: "#3B82F6", priority: "Medium" },
  { min: 0, grade: "Unqualified", color: "#6B7280", priority: "Low" },
] as const;

export interface GradeInfo {
  grade: string;
  color: string;
  priority: string;
}

export function getGrade(score: number): GradeInfo {
  for (const grade of GRADES) {
    if (score >= grade.min) {
      return {
        grade: grade.grade,
        color: grade.color,
        priority: grade.priority,
      };
    }
  }
  return { grade: "Unqualified", color: "#6B7280", priority: "Low" };
}

export function getGradeByName(gradeName: string | null): GradeInfo {
  const found = GRADES.find((g) => g.grade === gradeName);
  return (
    found ?? { grade: gradeName ?? "Unqualified", color: "#6B7280", priority: "Low" }
  );
}

export function initials(first: string | null, last: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}
