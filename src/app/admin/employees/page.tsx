'use client';

import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

import { IUser } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import React, { useEffect, useState } from 'react';
import { generateEmployeeId } from '@/lib/utils/employee';
import { Pagination } from '@/components/shared/Pagination';

export default function EmployeesPage() {
  const { user, isAuthenticated, token, isHydrated } = useAuthStore();
  const { settings } = useSystemSettings();
  const router = useRouter();
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Add employee form state
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    employeeId: '',
    email: '',
    password: '',
    mobileNumber: '',
    birthday: '',
    gender: 'male' as 'male' | 'female' | 'other',
    leaveCredits: 5,
  });

  const [employeePrefixChoice, setEmployeePrefixChoice] = useState<string>(settings?.employeeIdPrefix ?? 'ibay');
  const [customPrefix, setCustomPrefix] = useState('');

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
      router.push('/auth/login');
      return;
    }
    fetchEmployees();
  }, [isAuthenticated, user, router, isHydrated]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.getUsers();
      if (response.users) {
        setEmployees(response.users.filter((u: IUser) => u.role === 'employee'));
      }
    } catch (error: any) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.employeeId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEmployee),
      });

        if (response.ok) {
        toast.success('Employee added successfully!');
        setShowAddModal(false);
        setNewEmployee({
          firstName: '',
          middleName: '',
          lastName: '',
          employeeId: '',
          email: '',
          password: '',
          mobileNumber: '',
          birthday: '',
          gender: 'male',
          leaveCredits: 5,
        });
        fetchEmployees();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to add employee');
      }
    } catch (error) {
      toast.error('Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Employee ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
        fetchEmployees();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super-admin')) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Search & Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-4 py-2 bg-green-50 rounded-lg">
              <span className="text-green-700 font-medium">
                {employees.filter(e => e.isActive).length} Active
              </span>
            </div>
            <div className="px-4 py-2 bg-gray-100 rounded-lg">
              <span className="text-gray-700 font-medium">
                {employees.length} Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading employees...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No employees found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedEmployees.map((employee) => (
            <div
              key={employee._id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* Employee Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-lg">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{employee.employeeId}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    employee.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Employee Details */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {employee.email}
                </div>
                {employee.mobileNumber && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {employee.mobileNumber}
                  </div>
                )}
                {employee.birthday && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(employee.birthday), 'MMM dd, yyyy')} ({employee.age} years)
                  </div>
                )}
                {settings?.enableLeaveCreditsManagement && (
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Leave Credits</span>
                      <span className="font-semibold text-primary-700">
                        {employee.leaveCredits} days
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push(`/admin/employees/${employee._id}`)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium rounded-lg transition-colors text-sm"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(employee._id, employee.isActive)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 font-medium rounded-lg transition-colors text-sm ${
                    employee.isActive
                      ? 'bg-red-50 hover:bg-red-100 text-red-700'
                      : 'bg-green-50 hover:bg-green-100 text-green-700'
                  }`}
                >
                  {employee.isActive ? (
                    <>
                      <UserX className="w-4 h-4 mr-1.5" />
                      Disable
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-1.5" />
                      Enable
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-xl shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
        </>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full my-8 max-w-md sm:max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Employee</h2>
              <p className="text-gray-600 mt-1">Fill in the employee details below</p>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={newEmployee.middleName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, middleName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Employee ID Prefix / Generate (responsive) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <div className="flex-1 flex flex-col md:flex-row gap-2">
                      <select
                        value={employeePrefixChoice}
                        onChange={(e) => setEmployeePrefixChoice(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg w-full"
                      >
                        <option value={settings?.employeeIdPrefix ?? 'ibay'}>Use system prefix ({settings?.employeeIdPrefix ?? 'ibay'})</option>
                        <option value="PDSA">PDSA</option>
                        <option value="custom">Custom...</option>
                      </select>

                      {employeePrefixChoice === 'custom' && (
                        <input
                          type="text"
                          placeholder="Custom prefix"
                          value={customPrefix}
                          onChange={(e) => setCustomPrefix(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg w-full"
                        />
                      )}
                    </div>

                    <div className="flex-none">
                      <button
                        type="button"
                        onClick={() => {
                          const prefix = employeePrefixChoice === 'custom' ? (customPrefix || 'ibay') : employeePrefixChoice;
                          const id = generateEmployeeId({ prefix, padding: settings?.employeeIdPadding ?? 4, delimiter: settings?.employeeIdDelimiter ?? '-', uppercase: settings?.employeeIdUppercase ?? false });
                          setNewEmployee({ ...newEmployee, employeeId: id });
                        }}
                        className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Or enter employee ID manually"
                    value={newEmployee.employeeId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">You can manually override the generated ID.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={newEmployee.mobileNumber}
                    onChange={(e) => setNewEmployee({ ...newEmployee, mobileNumber: e.target.value })}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={newEmployee.birthday}
                    onChange={(e) => setNewEmployee({ ...newEmployee, birthday: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={newEmployee.gender}
                    onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {settings?.enableLeaveCreditsManagement && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Leave Credits
                    </label>
                    <input
                      type="number"
                      value={newEmployee.leaveCredits}
                      onChange={(e) => setNewEmployee({ ...newEmployee, leaveCredits: parseInt(e.target.value) })}
                      min="0"
                      max="30"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {saving ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
