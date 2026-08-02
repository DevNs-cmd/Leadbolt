'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import Phone from 'react-phone-number-input';
import { CountryCode, isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js/min';
import {
  Button,
  Input,
  Select,
  Label,
  Badge,
  Dialog,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
} from '@/components/ui';
import {
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Filter,
  UserPlus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { axiosInstance } from '@/lib/axios';

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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'status' | 'created_at' | 'follow_up_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: 'IN' as CountryCode,
    status: 'New' as LeadStatus,
    follow_up_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await axiosInstance.get('/api/v1/leads/', {
        params: {
          page,
          page_size: 15,
          search: searchTerm || undefined,
          status: statusFilter === 'All' ? undefined : statusFilter,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });
      setLeads(response.data.leads || []);
      setTotalPages(response.data.total_pages || 1);
      setTotalLeads(response.data.total || 0);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setErrorMsg(err.message || 'Failed to load leads from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, searchTerm, statusFilter, sortBy, sortOrder]);

  // Flash message timeout
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Form Submission
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Name and Email are required.');
      return;
    }

    // Validate phone number if provided
    if (formData.phone && !isValidPhoneNumber(formData.phone, formData.countryCode)) {
      setPhoneTouched(true);
      setPhoneError('Please enter a valid phone number for the selected country.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setPhoneError(null);

    try {
      // Format phone to E.164 if valid
      let formattedPhone = null;
      if (formData.phone && isValidPhoneNumber(formData.phone, formData.countryCode)) {
        const parsed = parsePhoneNumber(formData.phone, formData.countryCode);
        formattedPhone = parsed.format('E.164');
      }

      await axiosInstance.post('/api/v1/leads/', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formattedPhone,
        status: formData.status,
        follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null,
        notes: formData.notes.trim() || null,
      });
      setSuccessMsg('Lead added successfully!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        countryCode: 'IN',
        status: 'New',
        follow_up_date: '',
        notes: '',
      });
      setPhoneTouched(false);
      setIsAddModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      console.error('Error adding lead:', err);
      setErrorMsg(err.message || 'Failed to add lead.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Lead
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await axiosInstance.delete(`/api/v1/leads/${id}`);
      setSuccessMsg('Lead deleted.');
      fetchLeads();
    } catch (err: any) {
      setErrorMsg('Failed to delete lead.');
    }
  };

  // Header click handler for sorting
  const handleSort = (field: 'name' | 'email' | 'status' | 'created_at' | 'follow_up_date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No leads to export.');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Follow-up Date', 'Created At'];
    const rows = leads.map(lead => [
      lead.id,
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.phone || ''}"`,
      lead.status,
      lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : '',
      new Date(lead.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File upload handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  // CSV Import submit handler
  const handleImportCSVSubmit = async () => {
    if (!csvText.trim()) {
      setErrorMsg('Please paste CSV content or upload a .csv file.');
      return;
    }

    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setErrorMsg('CSV content is empty.');
      return;
    }

    // Determine delimiter (comma, semicolon, tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const parseLine = (line: string) =>
      line.split(delimiter).map(col => col.trim().replace(/^["']|["']$/g, ''));

    const firstCols = parseLine(firstLine);
    
    // Check if line 0 is a header row or a data row
    const isHeaderRow = !firstCols.some(col => col.includes('@')) && 
      firstCols.some(col => {
        const lower = col.toLowerCase();
        return lower.includes('name') || lower.includes('email') || lower.includes('phone') || lower.includes('status');
      });

    let nameIdx = 0;
    let emailIdx = 1;
    let phoneIdx = 2;
    let statusIdx = 3;
    let notesIdx = 4;
    let startRow = 0;

    if (isHeaderRow) {
      startRow = 1;
      const headers = firstCols.map(h => h.toLowerCase());
      const foundName = headers.findIndex(h => h.includes('name'));
      const foundEmail = headers.findIndex(h => h.includes('email'));
      const foundPhone = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
      const foundStatus = headers.findIndex(h => h.includes('status'));
      const foundNotes = headers.findIndex(h => h.includes('note'));

      if (foundName !== -1) nameIdx = foundName;
      if (foundEmail !== -1) emailIdx = foundEmail;
      if (foundPhone !== -1) phoneIdx = foundPhone;
      if (foundStatus !== -1) statusIdx = foundStatus;
      if (foundNotes !== -1) notesIdx = foundNotes;
    }

    const parsedLeads = [];
    for (let i = startRow; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      const email = cols[emailIdx];
      const name = cols[nameIdx] || email?.split('@')[0] || 'Lead';

      if (email && email.includes('@')) {
        let rawStatus = (cols[statusIdx] || 'New').trim();
        let status: LeadStatus = 'New';
        if (['Contacted', 'Qualified', 'Unqualified'].includes(rawStatus)) {
          status = rawStatus as LeadStatus;
        }

        parsedLeads.push({
          name,
          email,
          phone: cols[phoneIdx] || null,
          status,
          notes: cols[notesIdx] || null,
        });
      }
    }

    if (parsedLeads.length === 0) {
      setErrorMsg('No valid leads found in CSV. Please ensure each row has a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/api/v1/leads/bulk', parsedLeads);
      const createdCount = res.data.created_count ?? (Array.isArray(res.data) ? res.data.length : 0);
      const skippedCount = res.data.skipped_count ?? 0;

      if (createdCount > 0) {
        let msg = `Successfully imported ${createdCount} new lead(s)!`;
        if (skippedCount > 0) {
          msg += ` (${skippedCount} existing lead(s) skipped)`;
        }
        setSuccessMsg(msg);
      } else {
        setSuccessMsg(`0 new leads added (${skippedCount} lead(s) already exist in your database).`);
      }

      setIsImportModalOpen(false);
      setCsvText('');
      setSearchTerm('');
      setStatusFilter('All');
      setPage(1);
      fetchLeads();
    } catch (err: any) {
      console.error('CSV import error:', err);
      setErrorMsg(err.message || 'Error importing CSV leads.');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const counts = { New: 0, Contacted: 0, Qualified: 0, Unqualified: 0 };
    leads.forEach(l => {
      if (counts[l.status] !== undefined) {
        counts[l.status]++;
      }
    });
    return counts;
  }, [leads]);

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ArrowUp className="inline h-3.5 w-3.5 ml-1 text-purple-600" /> : <ArrowDown className="inline h-3.5 w-3.5 ml-1 text-purple-600" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-purple-600" />
              Lead Capture & Unified Inbox
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage incoming leads, qualify opportunities, and organize pipeline follow-ups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="md" onClick={handleExportCSV} className="flex items-center gap-1.5">
              <Download className="h-4 w-4 text-purple-600" />
              Export CSV
            </Button>
            <Button variant="secondary" size="md" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-purple-700" />
              Import CSV
            </Button>
            <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="font-bold ml-4">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Analytics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-purple-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inbox</p>
            <p className="text-2xl font-extrabold text-purple-950 mt-1">{totalLeads}</p>
          </Card>
          <Card className="bg-white border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">New Leads</p>
            <p className="text-2xl font-extrabold text-blue-900 mt-1">{metrics.New}</p>
          </Card>
          <Card className="bg-white border-amber-100">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Contacted</p>
            <p className="text-2xl font-extrabold text-amber-900 mt-1">{metrics.Contacted}</p>
          </Card>
          <Card className="bg-white border-emerald-100">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Qualified</p>
            <p className="text-2xl font-extrabold text-emerald-900 mt-1">{metrics.Qualified}</p>
          </Card>
        </div>

        {/* Filters & Control Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-600" />
              <Label className="mb-0 text-slate-600 text-xs">Status:</Label>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-36"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
              </Select>
            </div>

            <Button variant="ghost" size="icon" onClick={fetchLeads} title="Refresh Table">
              <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Leads Table */}
        <Table>
          <Thead>
            <Tr>
              <Th onClick={() => handleSort('name')} className="cursor-pointer hover:bg-purple-100/50 transition-colors select-none">
                Name {renderSortIndicator('name')}
              </Th>
              <Th onClick={() => handleSort('email')} className="cursor-pointer hover:bg-purple-100/50 transition-colors select-none">
                Email {renderSortIndicator('email')}
              </Th>
              <Th>Phone</Th>
              <Th onClick={() => handleSort('status')} className="cursor-pointer hover:bg-purple-100/50 transition-colors select-none">
                Status {renderSortIndicator('status')}
              </Th>
              <Th onClick={() => handleSort('follow_up_date')} className="cursor-pointer hover:bg-purple-100/50 transition-colors select-none">
                Follow-up Date {renderSortIndicator('follow_up_date')}
              </Th>
              <Th onClick={() => handleSort('created_at')} className="cursor-pointer hover:bg-purple-100/50 transition-colors select-none">
                Created {renderSortIndicator('created_at')}
              </Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={7} className="text-center py-10 text-slate-400">
                  Loading leads...
                </Td>
              </Tr>
            ) : leads.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center py-12 text-slate-400">
                  No leads found. Add your first lead using the button above.
                </Td>
              </Tr>
            ) : (
              leads.map((lead) => (
                <Tr key={lead.id}>
                  <Td className="font-semibold text-slate-900">{lead.name}</Td>
                  <Td className="text-slate-600">{lead.email}</Td>
                  <Td className="text-slate-500">{lead.phone || '—'}</Td>
                  <Td>
                    <Badge variant={lead.status.toLowerCase() as any}>
                      {lead.status}
                    </Badge>
                  </Td>
                  <Td className="text-slate-600">
                    {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : <span className="text-slate-300">Not set</span>}
                  </Td>
                  <Td className="text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)} title="Delete Lead">
                      <Trash2 className="h-4 w-4 text-rose-500 hover:text-rose-700" />
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{leads.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalLeads}</span> leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="px-2 text-xs font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Modal: Add Lead */}
        <Dialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Lead"
          description="Enter lead details to add them to your unified pipeline inbox."
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
            <div>
              <Label>Full Name *</Label>
              <Input
                type="text"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone
                  country={formData.countryCode}
                  defaultCountry="IN"
                  value={formData.phone}
                  onChange={(value) => {
                    setFormData({ ...formData, phone: value || '' });
                    // Clear error when user starts typing a new value
                    if (phoneError) setPhoneError(null);
                  }}
                  onCountryChange={(country) => setFormData({ ...formData, countryCode: country || 'IN' })}
                  onBlur={() => {
                    setPhoneTouched(true);
                    if (formData.phone && !isValidPhoneNumber(formData.phone, formData.countryCode)) {
                      setPhoneError('Please enter a valid phone number for the selected country.');
                    }
                  }}
                  style={{
                    backgroundColor: 'white',
                    border: `1px solid ${phoneTouched && formData.phone && !isValidPhoneNumber(formData.phone, formData.countryCode) ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                {phoneTouched && formData.phone && !isValidPhoneNumber(formData.phone, formData.countryCode) && (
                  <p className="mt-1 text-xs text-red-600">{phoneError || 'Please enter a valid phone number for the selected country.'}</p>
                )}
              </div>
            </div>
            <div>
              <Label>Initial Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
              </Select>
            </div>
            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
                placeholder="Key requirements, budget, timeline..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Adding...' : 'Save Lead'}
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: CSV Import */}
        <Dialog
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Bulk Import Leads via CSV"
          description="Upload a .csv file or paste raw CSV data with Name, Email, Phone, and Status."
        >
          <div className="space-y-4 text-left">
            <div>
              <Label>Upload CSV File</Label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">Or paste raw text</span>
              </div>
            </div>

            <div>
              <Label>Paste CSV Data</Label>
              <textarea
                className="w-full font-mono text-xs p-3 border border-gray-300 rounded-lg text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500"
                rows={6}
                placeholder={`Name, Email, Phone, Status\nJohn Smith, john@acme.com, +15551234567, New\nSarah Connor, sarah@cyber.com, +15559876543, Contacted`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleImportCSVSubmit} disabled={submitting}>
                {submitting ? 'Importing...' : 'Import Leads'}
              </Button>
            </div>
          </div>
        </Dialog>

      </div>
    </div>
  );
}