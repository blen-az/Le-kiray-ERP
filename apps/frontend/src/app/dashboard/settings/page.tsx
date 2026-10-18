'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  User,
  Users,
  Shield,
  CreditCard,
  ClipboardList,
  CheckCircle2,
  Lock,
  Globe,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import RequirePermission from '@/components/auth/RequirePermission';

export default function SettingsPage() {
  const { user } = useAuth();

  const displayName = user ? `${user.firstName} ${user.lastName}` : '—';
  const displayEmail = user?.email ?? '—';
  const displayRole = user?.roles?.[0] ?? '—';
  const displayPermCount = user?.permissions?.length ?? 0;
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'U';

  return (
    <RequirePermission permission="settings:view">
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Company configuration, users, and platform information</p>
      </div>

      {/* Company Profile */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#0284c7]" />
            <CardTitle className="text-sm font-bold text-slate-900">Company Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Company Name</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{user?.companyName ?? '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Country</span>
              <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                <Globe size={11} className="text-emerald-600" /> Ethiopia
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Currency</span>
              <span className="font-bold text-slate-900 mt-0.5 block">ETB — Ethiopian Birr</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Industry</span>
              <span className="font-bold text-slate-900 mt-0.5 block">Construction & Civil Works</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Timezone</span>
              <span className="font-bold text-slate-900 mt-0.5 block">Africa/Addis_Ababa (UTC+3)</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Workspace ID</span>
              <span className="font-mono text-[10px] text-slate-500 mt-0.5 block">{user?.companyId ?? '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current User */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User size={16} className="text-purple-600" />
            <CardTitle className="text-sm font-bold text-slate-900">Current User</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0284c7]/10 border border-[#0284c7]/20 text-[#0284c7] font-black text-lg">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Mail size={11} /> {displayEmail}
              </p>
              <span className="mt-1.5 inline-block text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">{displayRole}</span>
              {displayPermCount > 0 && (
                <span className="ml-1.5 mt-1.5 inline-block text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                  {displayPermCount} permissions
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500">
            <strong className="text-slate-700">Password:</strong> Change password functionality will be available in v2.0
          </div>
        </CardContent>
      </Card>

      {/* Users & Access */}
      <Link href="/dashboard/users" className="block">
        <Card className="border border-slate-100 shadow-xs hover:border-sky-300 hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-50 text-[#0284c7]">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Users & Access</p>
                <p className="text-xs text-slate-500">Add team members, assign roles, reset passwords, and edit role permissions.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* Subscription Plan */}
      <Card className="border border-emerald-100 bg-emerald-50 shadow-xs">
        <CardHeader className="pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-700" />
            <CardTitle className="text-sm font-bold text-emerald-900">Subscription Plan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-emerald-900">Le'Kiray ERP — MVP</span>
              <span className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded">ACTIVE</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">Demo / Internal Testing Plan — All modules unlocked</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Production licensing coming in v1.0 release</p>
          </div>
          <CheckCircle2 size={32} className="text-emerald-500 flex-shrink-0" />
        </CardContent>
      </Card>

      {/* Audit Log Placeholder */}
      <Card className="border border-slate-100 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-500" />
              <CardTitle className="text-sm font-bold text-slate-900">Audit Log</CardTitle>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
              Coming in v2.0
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center text-slate-400">
          <ClipboardList size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Audit log viewer</p>
          <p className="text-xs mt-1">Track all user actions, data changes, approvals, and logins across your workspace</p>
        </CardContent>
      </Card>

      {/* System Info */}
      <div className="text-center py-4">
        <p className="text-[10px] text-slate-400">
          Le'Kiray Contractor ERP — v1.0.0-MVP • Built for Ethiopian Construction Contractors • © 2026
        </p>
      </div>
    </div>
    </RequirePermission>
  );
}
