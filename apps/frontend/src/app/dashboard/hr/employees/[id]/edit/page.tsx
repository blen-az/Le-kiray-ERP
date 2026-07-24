'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditEmployeePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');

  const [position, setPosition] = useState('Machine Operator');
  const [department, setDepartment] = useState('Fleet Operations');
  const [employmentType, setEmploymentType] = useState('Permanent');
  const [employmentStatus, setEmploymentStatus] = useState('Active');
  const [hireDate, setHireDate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    async function loadEmployee() {
      if (useMockData) {
        setEmployeeCode('EMP-001');
        setFirstName('Abebe');
        setMiddleName('Bekele');
        setLastName('Kebede');
        setPhone('+251911223344');
        setEmail('abebe.k@lekiray.et');
        setGender('Male');
        setDateOfBirth('1990-05-15');
        setNationalIdNumber('FIN-12345678');
        setPosition('Machine Operator');
        setDepartment('Fleet Operations');
        setEmploymentType('Permanent');
        setEmploymentStatus('Active');
        setHireDate('2023-01-15');
        setDailyRate('500');
        setMonthlySalary('13000');
        setEmergencyContactName('Kebede Tadesse');
        setEmergencyContactPhone('+251911998877');
        setAddress('Bole Subcity, Woreda 03, House #123, Addis Ababa');
        setNotes('Certified CAT Excavator Operator.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/hr/employees/${id}`);
        if (!res.ok) throw new Error('Employee record not found');
        const emp = await res.json();

        setEmployeeCode(emp.employeeCode || '');
        setFirstName(emp.firstName || '');
        setMiddleName(emp.middleName || '');
        setLastName(emp.lastName || '');
        setPhone(emp.phone || '');
        setEmail(emp.email || '');
        setGender(emp.gender || 'Male');
        setDateOfBirth(emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : '');
        setNationalIdNumber(emp.nationalIdNumber || '');
        setPosition(emp.position || 'Machine Operator');
        setDepartment(emp.department || '');
        setEmploymentType(emp.employmentType || 'Permanent');
        setEmploymentStatus(emp.employmentStatus || 'Active');
        setHireDate(emp.hireDate ? emp.hireDate.slice(0, 10) : '');
        setDailyRate(emp.dailyRate?.toString() || '');
        setMonthlySalary(emp.monthlySalary?.toString() || '');
        setEmergencyContactName(emp.emergencyContactName || '');
        setEmergencyContactPhone(emp.emergencyContactPhone || '');
        setAddress(emp.address || '');
        setDocumentUrl(emp.documentUrl || '');
        setNotes(emp.notes || '');
      } catch (err: any) {
        setError(err.message || 'Error loading employee details');
      } finally {
        setLoading(false);
      }
    }

    loadEmployee();
  }, [id, apiUrl, useMockData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      employeeCode: employeeCode || undefined,
      firstName,
      middleName: middleName || undefined,
      lastName,
      phone,
      email: email || undefined,
      gender,
      dateOfBirth: dateOfBirth || undefined,
      nationalIdNumber: nationalIdNumber || undefined,
      position,
      department: department || undefined,
      employmentType,
      employmentStatus,
      hireDate,
      dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
      monthlySalary: monthlySalary ? parseFloat(monthlySalary) : undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
      address: address || undefined,
      documentUrl: documentUrl || undefined,
      notes: notes || undefined,
    };

    if (useMockData) {
      alert('Demo Mode: Employee record updated!');
      router.push(`/dashboard/hr/employees/${id}`);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/hr/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update employee record');
      }

      router.push(`/dashboard/hr/employees/${id}`);
    } catch (err: any) {
      setError(err.message || 'Error updating employee record');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading employee details..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/hr/employees/${id}`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Employee Profile</h2>
          <p className="text-xs text-slate-500">Update personal, position, pay rate, or contact information.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
          {error}
        </div>
      )}

      <Card className="border border-slate-100 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Edit Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Employee Code</label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Position *</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="Project Manager">Project Manager</option>
                  <option value="Site Manager">Site Manager</option>
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Finance Officer">Finance Officer</option>
                  <option value="Machine Operator">Machine Operator</option>
                  <option value="Driver">Driver</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Storekeeper">Storekeeper</option>
                  <option value="Foreman">Foreman</option>
                  <option value="Mason">Mason</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Daily Laborer">Daily Laborer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Daily Laborer">Daily Laborer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Employment Status</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Daily Rate (ETB)</label>
                <input
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Monthly Salary (ETB)</label>
                <input
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes / Remarks</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/hr/employees/${id}`}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-5 py-2 rounded-md font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save size={15} />
                {submitting ? 'Updating...' : 'Update Record'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
