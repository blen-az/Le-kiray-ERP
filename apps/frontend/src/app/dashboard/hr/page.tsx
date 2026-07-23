'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, MapPin, Phone, UserPlus, CheckCircle, Clock, XCircle, Coffee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string | null;
  site: { name: string; project: { name: string } } | null;
  attendanceToday?: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'PENDING';
}

const fallbackEmployees: Employee[] = [
  { id: 'e-1', firstName: 'Abebe', lastName: 'Kebede', role: 'OPERATOR', phone: '+251911223344', site: { name: 'Olympia Junction Site', project: { name: 'Bole Road Expansion' } }, attendanceToday: 'PRESENT' },
  { id: 'e-2', firstName: 'Tariku', lastName: 'Mengistu', role: 'OPERATOR', phone: '+251912445566', site: { name: 'Rwanda Traffic Circle Site', project: { name: 'Bole Road Expansion' } }, attendanceToday: 'LATE' },
  { id: 'e-3', firstName: 'Genet', lastName: 'Alemu', role: 'LABORER', phone: '+251915998877', site: { name: 'Olympia Junction Site', project: { name: 'Bole Road Expansion' } }, attendanceToday: 'PRESENT' },
  { id: 'e-4', firstName: 'Zewdu', lastName: 'Hailu', role: 'LABORER', phone: '+251913334455', site: { name: 'Hawassa Lake Side site', project: { name: 'Hawassa Housing Project' } }, attendanceToday: 'ON_LEAVE' },
  { id: 'e-5', firstName: 'Fasil', lastName: 'Demeke', role: 'FOREMAN', phone: '+251919776655', site: { name: 'Olympia Junction Site', project: { name: 'Bole Road Expansion' } }, attendanceToday: 'PRESENT' },
];

export default function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>(fallbackEmployees);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('LABORER');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    async function fetchData() {
      if (useMockData) {
        setEmployees(fallbackEmployees);
        setLoading(false);
        return;
      }

      try {
        const empRes = await fetch(`${apiUrl}/hr/employees`);
        if (!empRes.ok) throw new Error('Failed to load employees list from API');
        const emps = await empRes.json();

        const attRes = await fetch(`${apiUrl}/hr/attendance`);
        const atts = attRes.ok ? await attRes.json() : [];

        const combined = emps.map((e: any) => {
          const matchingAtt = atts.find((a: any) => a.employeeId === e.id);
          return {
            ...e,
            attendanceToday: matchingAtt ? matchingAtt.status : 'PENDING',
          };
        });

        setEmployees(combined);
        setError(null);
      } catch (err: any) {
        console.error('API Error:', err);
        setError(err.message || 'Could not connect to ERP server');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const newEmp = {
      id: Math.random().toString(),
      firstName,
      lastName,
      role,
      phone,
      site: { name: 'Olympia Junction Site', project: { name: 'Bole Road Expansion' } },
      attendanceToday: 'PENDING' as any,
    };

    try {
      const res = await fetch('http://localhost:4000/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, role, phone, siteId: 'any-site' }),
      });
      if (res.ok) {
        const saved = await res.json();
        setEmployees([...employees, { ...saved, attendanceToday: 'PENDING' }]);
      } else {
        setEmployees([...employees, newEmp]);
      }
    } catch {
      setEmployees([...employees, newEmp]);
    }

    setFirstName('');
    setLastName('');
    setPhone('');
    setShowAddForm(false);
  };

  const markAttendance = async (empId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE') => {
    const updated = employees.map((e) => {
      if (e.id === empId) {
        return { ...e, attendanceToday: status };
      }
      return e;
    });
    setEmployees(updated);

    try {
      await fetch('http://localhost:4000/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          date: new Date().toISOString(),
          status,
        }),
      });
    } catch {
      console.warn('Offline: attendance saved locally.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading employee registry...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg max-w-2xl mx-auto my-12 shadow-xs">
        <h3 className="font-bold text-sm">ERP Connection Error</h3>
        <p className="text-xs mt-1">{error}</p>
        <p className="text-xs mt-3 text-slate-500 border-t border-rose-200/50 pt-2 font-medium">
          Ensure the backend NestJS service is running and accessible. Or toggle <code>NEXT_PUBLIC_USE_MOCK_DATA=true</code> in the environment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">HR & Attendance</h2>
          <p className="text-slate-500 text-xs">Register operators and field workers, allocate them to sites, and mark daily attendance.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0275b0] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} />
          {showAddForm ? 'Cancel' : 'Add Employee'}
        </button>
      </div>

      {showAddForm && (
        <Card className="max-w-xl animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Add Field Staff</CardTitle>
            <CardDescription>Enter primary phone number, job role, and project site assignment.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Abebe"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kebede"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +251911223344"
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-slate-700">Job Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-700"
                  >
                    <option value="OPERATOR">HEAVY MACHINE OPERATOR</option>
                    <option value="LABORER">FIELD LABORER</option>
                    <option value="FOREMAN">SITE FOREMAN</option>
                    <option value="SITE_MANAGER">SITE MANAGER</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
              >
                Register Employee
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Roster & Attendance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Field Staff & Attendance Log</CardTitle>
          <CardDescription>Daily check-in logs. Site managers can mark check-ins directly.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-xs text-left text-slate-500">
            <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 border-y border-slate-200 font-bold">
              <tr>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Assigned Site</th>
                <th className="px-6 py-3">Status Today</th>
                <th className="px-6 py-3 text-right">Quick Mark Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                      {emp.firstName[0]}
                      {emp.lastName[0]}
                    </div>
                    {emp.firstName} {emp.lastName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-600">{emp.role}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" />
                      {emp.phone || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {emp.site ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin size={11} className="text-sky-500" />
                          {emp.site.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-3.5">
                          {emp.site.project.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not Assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        emp.attendanceToday === 'PRESENT'
                          ? 'success'
                          : emp.attendanceToday === 'LATE'
                          ? 'warning'
                          : emp.attendanceToday === 'ABSENT'
                          ? 'destructive'
                          : emp.attendanceToday === 'ON_LEAVE'
                          ? 'info'
                          : 'outline'
                      }
                      className="text-[10px] py-0 px-2 font-bold"
                    >
                      {emp.attendanceToday || 'PENDING'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Present"
                        onClick={() => markAttendance(emp.id, 'PRESENT')}
                        className="p-1 hover:bg-slate-100 rounded text-emerald-600 hover:text-emerald-800 transition-colors"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        title="Late"
                        onClick={() => markAttendance(emp.id, 'LATE')}
                        className="p-1 hover:bg-slate-100 rounded text-amber-500 hover:text-amber-700 transition-colors"
                      >
                        <Clock size={15} />
                      </button>
                      <button
                        title="Absent"
                        onClick={() => markAttendance(emp.id, 'ABSENT')}
                        className="p-1 hover:bg-slate-100 rounded text-rose-500 hover:text-rose-700 transition-colors"
                      >
                        <XCircle size={15} />
                      </button>
                      <button
                        title="On Leave"
                        onClick={() => markAttendance(emp.id, 'ON_LEAVE')}
                        className="p-1 hover:bg-slate-100 rounded text-sky-500 hover:text-sky-700 transition-colors"
                      >
                        <Coffee size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
