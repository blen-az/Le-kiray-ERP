'use client';

import React, { useState } from 'react';
import { UserCog, Users, Shield } from 'lucide-react';
import UsersPanel from '@/components/users/UsersPanel';
import RolesPanel from '@/components/users/RolesPanel';
import { cn } from '@/lib/utils';

type Tab = 'users' | 'roles';

export default function UsersAccessPage() {
  const [tab, setTab] = useState<Tab>('users');

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <UserCog size={22} className="text-[#0284c7]" />
          Users & Access
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Add your team, choose what each role can see and do, and manage sign-in access.
        </p>
      </div>

      <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
        {([
          { id: 'users', label: 'Users', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: Shield },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-colors',
              tab === t.id ? 'bg-[#0f172a] text-white' : 'text-slate-500 hover:text-slate-900',
            )}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UsersPanel /> : <RolesPanel />}
    </div>
  );
}
