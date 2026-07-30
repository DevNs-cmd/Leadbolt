'use client';

import { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Label,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Toaster,
  Toast,
  Calendar,
  ToastProvider,
  Alert,
  AlertDescription,
  AlertTitle,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Separator,
} from '@/components/ui';
import { CheckPlus, Search, Filter, Download, Trash2, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { axiosInstance } from '@/lib/axios';

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified';
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'New' | 'Contacted' | 'Qualified' | 'Unqualified'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'status' | 'created_at' | 'follow_up_date' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);

  const formMethods = useForm<{
    name: string;
    email: string;
    phone: string | null;
    status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified';
    follow_up_date: string | null;
    notes: string | null;
  }>({
    defaultValues: {
      name: '',
      email: '',
      phone: null,
      status: 'New',
      follow_up_date: null,
      notes: null,
    },
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/v1/leads/', {
        params: {
          page,
          search: searchTerm,
          status: statusFilter === 'All' ? undefined : statusFilter,
          sort_by: sortBy || undefined,
          sort_order: sortOrder,
        },
      });
      setLeads(response.data.leads);
      setTotalPages(response.data.total_pages);
      setTotalLeads(response.data.total);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSubmit = formMethods.handleSubmit(async (data) => {
    try {
      await axiosInstance.post('/api/v1/leads/', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        follow_up_date: data.follow_up_date ? new Date(data.follow_up_date).toISOString() : null,
        notes: data.notes,
      });
      formMethods.reset();
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  });

  const handleDelete = async (id: number) => {
    try {
      await axiosInstance.delete(`/api/v1/leads/${id}`);
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleQualify = async (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleQualifySubmit = async () => {
    if (!selectedLead) return;
    try {
      await axiosInstance.post(`/api/v1/leads/qualify`, {
        email: selectedLead.email,
        message: 'Please qualify this lead based on the provided information.',
      });
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error qualifying lead:', error);
    }
  };

  const handleQualifyCancel = () => {
    setSelectedLead(null);
    setFollowUpDate(null);
  };

  const statusColors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-800',
    Contacted: 'bg-yellow-100 text-yellow-800',
    Qualified: 'bg-green-100 text-green-800',
    Unqualified: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6">
      <ToastProvider>
        <Toaster />
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <Dialog asChild>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <CheckPlus className="h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter the lead's information to add them to your pipeline
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row sm:space-x-3">
                <Button variant="outline" onClick={handleQualifyCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="lead-form"
                  disabled={formMethods.formState.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {formMethods.formState.isSubmitting ? 'Adding...' : 'Add Lead'}
                </Button>
              </DialogFooter>
              <Form {...formMethods} onSubmit={handleSubmit}>
                <FormField
                  control={formMethods.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lead's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formMethods.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter lead's email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formMethods.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formMethods.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <Select.Value placeholder="Select status" />
                          <Select.Item value="New">New</Select.Item>
                          <Select.Item value="Contacted">Contacted</Select.Item>
                          <Select.Item value="Qualified">Qualified</Select.Item>
                          <Select.Item value="Unqualified">Unqualified</Select.Item>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formMethods.control}
                  name="follow_up_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={data => data.follow_up_date || ''}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formMethods.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          type="textarea"
                          placeholder="Add any additional notes"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <FormField
            control={formMethods.control}
            name="search"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search Leads</FormLabel>
                <FormControl>
                  <Input
                    type="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={formMethods.control}
            name="statusFilter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filter by Status</FormLabel>
                <FormControl>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    <Select.Value placeholder="All Statuses" />
                    <Select.Item value="All">All</Select.Item>
                    <Select.Item value="New">New</Select.Item>
                    <Select.Item value="Contacted">Contacted</Select.Item>
                    <Select.Item value="Qualified">Qualified</Select.Item>
                    <Select.Item value="Unqualified">Unqualified</Select.Item>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex-1 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as any);
              }}
              className="w-48"
            >
              <Select.Value placeholder="Sort by..." />
              <Select.Item value="name">Name</Select.Item>
              <Select.Item value="email">Email</Select.Item>
              <Select.Item value="status">Status</Select.Item>
              <Select.Item value="created_at">Created Date</Select.Item>
              <Select.Item value="follow_up_date">Follow-up Date</Select.Item>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full border-4 border-primary-500 border-t-transparent h-8 w-8"></div>
            <p className="mt-2 text-gray-500">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No leads found. Add your first lead using the button above.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {leads.length} of {totalLeads} leads
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>

            <Table className="w-full">
              <Thead>
                <Tr className="border-b bg-gray-50">
                  <Th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</Th>
                  <Th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</Th>
                  <Th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</Th>
                  <Th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</Th>
                  <Th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Follow-up</Th>
                  <Th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</Th>
                  <Th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</Th>
                </Tr>
              </Thead>
              <Tbody className="divide-y">
                {leads.map((lead) => (
                  <Tr key={lead.id} className="hover:bg-gray-50">
                    <Td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {lead.name}
                    </Td>
                    <Td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap break-all max-w-xs">
                      {lead.email}
                    </Td>
                    <Td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.phone || 'N/A'}
                    </Td>
                    <Td className="px-4 py-3 text-sm font-medium">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                    </Td>
                    <Td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.follow_up_date ? (
                        <span className="text-xs">
                          {new Date(lead.follow_up_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not set</span>
                      )}
                    </Td>
                    <Td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </Td>
                    <Td className="px-4 py-3 text-sm text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQualify(lead)}
                      >
                        <Search className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(lead.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </>
        )}

        {selectedLead && (
          <Dialog className="z-50">
            <DialogTrigger asChild>
              <Button className="mt-4">Qualify Lead</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Qualify Lead</DialogTitle>
                <DialogDescription>
                  Get AI-powered qualification for {selectedLead?.name}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row sm:space-x-3">
                <Button variant="outline" onClick={handleQualifyCancel}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleQualifySubmit}
                  disabled={false}
                >
                  Qualify with AI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </ToastProvider>
    </div>
  );
}