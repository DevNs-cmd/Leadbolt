'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Badge,
  Dialog,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  Label,
} from '@/components/ui';
import {
  TrendingUp,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// Type definitions
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified';

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type LeadStats = {
  total: number;
  new_count: number;
  contacted_count: number;
  qualified_count: number;
  unqualified_count: number;
};

type DateRange = {
  from: Date;
  to: Date;
};

// Status color mapping
const statusColors = {
  New: '#3b82f6', // blue-500
  Contacted: '#f59e0b', // amber-500
  Qualified: '#10b981', // emerald-500
  Unqualified: '#ef4444', // red-500
};

// Badge variants
const badgeVariants = {
  New: 'new',
  Contacted: 'contacted',
  Qualified: 'qualified',
  Unqualified: 'unqualified',
} as const;

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30000;

export default function DashboardPage() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    to: new Date(),
  });
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/leads/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load stats');
    }
  };

  // Fetch leads for the Kanban board
  const fetchLeads = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/leads/', {
        params: {
          page: 1,
          page_size: 100,
        },
      });
      setLeads(response.data.leads || []);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchLeads()]);
    } catch (err) {
      // Error is handled in individual fetch functions
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates via polling (30 second interval)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchData();
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [loading]);

  // Calculate stats from leads if backend stats not available
  const derivedStats = useMemo(() => {
    if (!stats) return null;

    return {
      total: stats.total,
      new: stats.new_count,
      contacted: stats.contacted_count,
      qualified: stats.qualified_count,
      unqualified: stats.unqualified_count,
    };
  }, [stats]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!derivedStats) return [];

    return [
      { name: 'New', value: derivedStats.new, color: statusColors.New },
      { name: 'Contacted', value: derivedStats.contacted, color: statusColors.Contacted },
      { name: 'Qualified', value: derivedStats.qualified, color: statusColors.Qualified },
      { name: 'Unqualified', value: derivedStats.unqualified, color: statusColors.Unqualified },
    ];
  }, [derivedStats]);

  // Group leads by status for Kanban
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      New: [],
      Contacted: [],
      Qualified: [],
      Unqualified: [],
    };

    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  // === PLACEHOLDER: Revenue Forecast ===
  // TODO: This is a placeholder calculation. Real revenue forecasting requires:
  // - Deal/pipeline module with deal values and probabilities
  // - Salesperson assignment data (Outreach module)
  // - Historical conversion rates
  // Once the Pipeline module is built, fetch actual deal data and calculate:
  // forecast = qualified_leads * (average_deal_value * win_probability)
  const averageDealValue = 15000; // Assumption: $15,000 average deal
  const forecastedRevenue = derivedStats ? derivedStats.qualified * averageDealValue : 0;

  // === PLACEHOLDER: Team Performance ===
  // TODO: This requires the Outreach module to have salesperson/owner assignment data
  // Once the Outreach module is integrated, calculate:
  // - Leads owned by each salesperson
  // - Conversion rates per salesperson
  // - Activity metrics per person
  // For now, we show lead counts by status as a placeholder metric
  const teamPerformance = [
    { name: 'New', value: derivedStats?.new || 0 },
    { name: 'Contacted', value: derivedStats?.contacted || 0 },
    { name: 'Qualified', value: derivedStats?.qualified || 0 },
    { name: 'Unqualified', value: derivedStats?.unqualified || 0 },
  ];

  // Export stats to CSV
  const handleExportCSV = () => {
    if (!derivedStats) return;

    const headers = ['Metric', 'Count'];
    const rows = [
      ['Total Leads', derivedStats.total],
      ['New', derivedStats.new],
      ['Contacted', derivedStats.contacted],
      ['Qualified', derivedStats.qualified],
      ['Unqualified', derivedStats.unqualified],
    ];

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dashboard_stats_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date range calculations
   const applyDateRangeFilter = async () => {
  const fromStr = format(dateRange.from, 'yyyy-MM-dd');
  const toStr = format(dateRange.to, 'yyyy-MM-dd');
  
  try {
    const response = await axiosInstance.get('/api/v1/leads/', {
      params: { page: 1, page_size: 100, date_from: fromStr, date_to: toStr },
    });
    setLeads(response.data.leads || []);
    setDateRangeOpen(false); // close the dialog after applying
  } catch (err) {
    console.error('Failed to apply date filter:', err);
  }
};
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Overview of your lead pipeline and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={() => setDateRangeOpen(true)}>
              <Calendar className="h-4 w-4 mr-1.5" />
              Date Range
            </Button>
            <Button variant="outline" size="md" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="md" onClick={fetchData}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white border-purple-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
            <p className="text-2xl font-extrabold text-purple-950 mt-1">{derivedStats?.total ?? 0}</p>
          </Card>
          <Card className="bg-white border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">New</p>
            <p className="text-2xl font-extrabold text-blue-900 mt-1">{derivedStats?.new ?? 0}</p>
          </Card>
          <Card className="bg-white border-amber-100">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Contacted</p>
            <p className="text-2xl font-extrabold text-amber-900 mt-1">{derivedStats?.contacted ?? 0}</p>
          </Card>
          <Card className="bg-white border-emerald-100">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Qualified</p>
            <p className="text-2xl font-extrabold text-emerald-900 mt-1">{derivedStats?.qualified ?? 0}</p>
          </Card>
          <Card className="bg-white border-rose-100">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Unqualified</p>
            <p className="text-2xl font-extrabold text-rose-900 mt-1">{derivedStats?.unqualified ?? 0}</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Status Bar Chart */}
          <Card className="bg-white">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Leads by Status</h2>
              <p className="text-sm text-slate-500 mt-1">Distribution of your leads across the pipeline</p>
            </div>
            <div className="px-5 pb-5">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                      formatter={(value: unknown) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [`${numValue}`, ''];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  No data available
                </div>
              )}
            </div>
          </Card>

          {/* Revenue Forecast Chart (Placeholder) */}
          <Card className="bg-white">
            <div className="px-5 pt-5 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Revenue Forecast</h2>
              <p className="text-sm text-slate-500 mt-1">
                Estimated pipeline value (placeholder - requires Pipeline module)
              </p>
            </div>
            <div className="px-5 pb-5">
              {derivedStats && derivedStats.qualified > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[{ name: 'Forecasted', value: forecastedRevenue }]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                      formatter={(value: unknown) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        return [`$${numValue.toLocaleString()}`, 'Forecasted Revenue'];
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      <Cell fill="#8b5cf6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <p>No qualified leads to forecast</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Forecast = Qualified Leads × ${averageDealValue.toLocaleString()} (avg deal assumption)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Team Performance Table */}
        <Card className="bg-white">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Performance Overview</h2>
            <p className="text-sm text-slate-500 mt-1">
              Lead counts by status (placeholder - will show salesperson metrics once Outreach module is integrated)
            </p>
          </div>
          <div className="px-5 pb-5">
            <Table>
              <Thead>
                <Tr>
                  <Th>Status</Th>
                  <Th>Count</Th>
                  <Th>Percentage</Th>
                </Tr>
              </Thead>
              <Tbody>
                {teamPerformance.map((item) => {
                  const percentage = derivedStats?.total ? (item.value / derivedStats.total) * 100 : 0;
                  return (
                    <Tr key={item.name}>
                      <Td className="font-semibold text-slate-900">{item.name}</Td>
                      <Td>
                        <Badge variant={badgeVariants[item.name as LeadStatus]}>
                          {item.value}
                        </Badge>
                      </Td>
                      <Td className="text-slate-600">{percentage.toFixed(1)}%</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>
        </Card>

        {/* Kanban Board */}
        <Card className="bg-white">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Lead Kanban Board</h2>
            <p className="text-sm text-slate-500 mt-1">Visualize leads by status</p>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['New', 'Contacted', 'Qualified', 'Unqualified'] as LeadStatus[]).map((status) => (
                <div key={status} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{status}</h3>
                    <Badge variant={badgeVariants[status]}>
                      {leadsByStatus[status]?.length ?? 0}
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leadsByStatus[status]?.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="font-semibold text-slate-900">{lead.name}</div>
                        <div className="text-sm text-slate-500">{lead.email}</div>
                        {lead.follow_up_date && (
                          <div className="text-xs text-slate-600 mt-1">
                            Follow-up: {format(parseISO(lead.follow_up_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    ))}
                    {(!leadsByStatus[status] || leadsByStatus[status].length === 0) && (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        No {status.toLowerCase()} leads
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Date Range Dialog */}
        <Dialog
          isOpen={dateRangeOpen}
          onClose={() => setDateRangeOpen(false)}
          title="Select Date Range"
          description="Filter dashboard data by date range"
        >
          <div className="space-y-4">
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
               value={dateRange.from && !isNaN(dateRange.from.getTime()) ? format(dateRange.from, 'yyyy-MM-dd') : ''}
  onChange={(e) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setDateRange({ ...dateRange, from: newDate });
    }
  }}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.to && !isNaN(dateRange.to.getTime()) ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDateRangeOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={applyDateRangeFilter}>
                Apply Filter
              </Button>
            </div>
          </div>
        </Dialog>

      </div>
    </div>
  );
}