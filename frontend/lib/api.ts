import axios from "axios";

export interface ScoreComponent {
  points: number;
  max: number;
}

export interface ScoreBreakdown {
  profile_completeness: ScoreComponent;
  engagement: ScoreComponent;
  bant_criteria: ScoreComponent;
  behavioral: ScoreComponent;
  company_fit: ScoreComponent;
}

export interface BantAnalysis {
  budget: string;
  authority: string;
  need: string;
  timeline: string;
}

export interface QualificationResult {
  score: number;
  grade: string;
  priority: string;
  bantAnalysis: BantAnalysis;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  reasoning: string;
  provider?: string | null;
  fallback_reason?: string | null;
}

export interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  company_size: number | null;
  source: string | null;
  email_opens: number;
  website_visits: number;
  content_downloads: number;
  page_visits: number;
  time_on_site: number;
  form_submissions: number;
  budget: string | null;
  authority: string | null;
  pain_points: string | null;
  timeline: string | null;
  status: string;
  score: number;
  score_breakdown: ScoreBreakdown | null;
  score_grade: string | null;
  qualification_score: number | null;
  qualification_grade: string | null;
  qualification_priority: string | null;
  qualification_data: QualificationResult | null;
  qualification_provider: string | null;
  qualified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  total_leads: number;
  avg_score: number;
  distribution: { hot: number; warm: number; cold: number; unqualified: number };
  qualified_leads: number;
  qualification_rate: number;
}

export interface ListLeadsParams {
  search?: string;
  status?: string;
  grade?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  timeout: 30000,
});

export async function listLeads(params: ListLeadsParams = {}): Promise<Lead[]> {
  const { data } = await api.get<Lead[]>("/leads", { params });
  return data;
}

export async function getLead(id: string): Promise<Lead> {
  const { data } = await api.get<Lead>(`/leads/${id}`);
  return data;
}

export async function qualifyLead(id: string): Promise<QualificationResult> {
  const { data } = await api.post<{ lead_id: string; result: QualificationResult }>(
    `/leads/${id}/qualify`
  );
  return data.result;
}

export async function getQualification(
  id: string
): Promise<QualificationResult | null> {
  const { data } = await api.get<{
    lead_id: string;
    result: QualificationResult;
  } | null>(`/leads/${id}/qualification`);
  return data?.result ?? null;
}

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/analytics/dashboard");
  return data;
}
