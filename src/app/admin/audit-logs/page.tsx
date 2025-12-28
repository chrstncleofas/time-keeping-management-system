'use client';

import {
  User,
  Clock,
  Search,
  Filter,
  XCircle,
  Download,
  Calendar,
  FileText,
  Activity,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import React, { useEffect, useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';

interface AuditLog {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
  };
  userName: string;
  userRole: 'admin' | 'employee';
  action: string;
  category: 'AUTH' | 'ATTENDANCE' | 'LEAVE' | 'SCHEDULE' | 'USER' | 'SYSTEM';
  description: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
  metadata?: any;
}

interface Stats {
  byCategory: Array<{ _id: string; count: number }>;
  byAction: Array<{ _id: string; count: number }>;
  recentActivity: Array<{
    userName: string;
    action: string;
    category: string;
    createdAt: string;
  }>;
}

export default function AuditLogsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
      router.push('/auth/login');
      return;
    }
    fetchLogs();
  }, [page, category, action, startDate, endDate, itemsPerPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (category) params.append('category', category);
      if (action) params.append('action', action);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (search) params.append('search', search);

      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total || 0);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      AUTH: 'bg-blue-100 text-blue-800',
      ATTENDANCE: 'bg-green-100 text-green-800',
      LEAVE: 'bg-yellow-100 text-yellow-800',
      SCHEDULE: 'bg-purple-100 text-purple-800',
      USER: 'bg-pink-100 text-pink-800',
      SYSTEM: 'bg-gray-100 text-gray-800',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, any> = {
      AUTH: User,
      ATTENDANCE: Clock,
      LEAVE: Calendar,
      SCHEDULE: Calendar,
      USER: User,
      SYSTEM: Activity,
    };
    const Icon = icons[cat] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const exportToCSV = () => {
    const csvData = logs.map(log => ({
      Date: format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      User: log.userName,
      Role: log.userRole,
      Category: log.category,
      Action: log.action,
      Description: log.description,
      Status: log.status,
      IP: log.ipAddress || 'N/A',
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-600" />
              Logs
            </h1>
            <p className="text-gray-600 mt-2">
              Track all system activities and user actions
            </p>
          </div>
          <button
            onClick={exportToCSV}
            aria-label="Export CSV"
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Top Categories</h3>
            <div className="space-y-2">
              {stats.byCategory.slice(0, 3).map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item._id)}`}>
                    {item._id}
                  </span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Top Actions</h3>
            <div className="space-y-2">
              {stats.byAction.slice(0, 3).map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item._id.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs text-gray-600">
                  <span className="font-medium">{item.userName}</span>
                  <span className="mx-1">•</span>
                  <span>{item.action.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user name, action, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => { fetchLogs(); }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="AUTH">Authentication</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="LEAVE">Leave</option>
                <option value="SCHEDULE">Schedule</option>
                <option value="USER">User</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                      <div className="text-xs text-gray-500">{log.userRole}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(log.category)}`}>
                        {getCategoryIcon(log.category)}
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
