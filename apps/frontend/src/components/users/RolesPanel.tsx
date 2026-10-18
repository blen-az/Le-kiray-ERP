'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Lock, Users, Loader2, Trash2, Save, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { WorkspaceRole } from './UsersPanel';

interface PermissionGroup {
  module: string;
  permissions: { action: string; description: string }[];
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  settings: 'Settings',
  projects: 'Projects',
  sites: 'Sites',
  machinery: 'Machinery',
  fuel: 'Fuel',
  inventory: 'Inventory & Materials',
  hr: 'HR – Employees',
  attendance: 'HR – Attendance',
  leave: 'HR – Leave',
  reports: 'Daily Site Reports',
  maintenance: 'Maintenance',
  finance: 'Finance',
  tenders: 'Tenders & Bids',
  users: 'Users',
  roles: 'Roles',
};

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-800 bg-white';

type Draft = { id: string | null; name: string; description: string; permissions: Set<string> };

export default function RolesPanel() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('roles:manage');

  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [catalogue, setCatalogue] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([apiRequest<WorkspaceRole[]>('/roles'), apiRequest<PermissionGroup[]>('/roles/permissions')]);
      setRoles(r);
      setCatalogue(c);
      return r;
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const select = useCallback((role: WorkspaceRole) => {
    setSelectedId(role.id);
    setDraft({ id: role.id, name: role.name, description: role.description ?? '', permissions: new Set(role.permissions) });
    setSaveError(null);
    setSavedAt(null);
  }, []);

  useEffect(() => {
    load().then((r) => {
      if (r.length) select(r.find((x) => !x.locked) ?? r[0]);
    });
  }, [load, select]);

  const selected = roles.find((r) => r.id === selectedId) ?? null;
  const readOnly = !canManage || !!selected?.locked;

  const dirty = useMemo(() => {
    if (!draft) return false;
    if (!draft.id) return true;
    if (!selected) return false;
    const same =
      draft.name === selected.name &&
      draft.description === (selected.description ?? '') &&
      draft.permissions.size === selected.permissions.length &&
      selected.permissions.every((p) => draft.permissions.has(p));
    return !same;
  }, [draft, selected]);

  const toggle = (action: string, on: boolean) =>
    setDraft((d) => {
      if (!d) return d;
      const next = new Set(d.permissions);
      if (on) next.add(action);
      else next.delete(action);
      return { ...d, permissions: next };
    });

  const toggleGroup = (group: PermissionGroup, on: boolean) =>
    setDraft((d) => {
      if (!d) return d;
      const next = new Set(d.permissions);
      group.permissions.forEach((p) => {
        if (!hasPermission(p.action)) return;
        if (on) next.add(p.action);
        else next.delete(p.action);
      });
      return { ...d, permissions: next };
    });

  const startNew = () => {
    setSelectedId(null);
    setDraft({ id: null, name: '', description: '', permissions: new Set(['dashboard:view']) });
    setSaveError(null);
    setSavedAt(null);
  };

  const save = async () => {
    if (!draft) return;
    setBusy('save');
    setSaveError(null);
    try {
      const body = JSON.stringify({ name: draft.name, description: draft.description, permissions: Array.from(draft.permissions) });
      const saved = draft.id
        ? await apiRequest<WorkspaceRole>(`/roles/${draft.id}`, { method: 'PATCH', body })
        : await apiRequest<WorkspaceRole>('/roles', { method: 'POST', body });
      const fresh = await load();
      const match = fresh.find((r) => r.id === saved.id);
      if (match) select(match);
      setSavedAt(Date.now());
    } catch (err: any) {
      setSaveError(err.message || 'Could not save role');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!selected || !window.confirm(`Delete the "${selected.name}" role?`)) return;
    setBusy('delete');
    setSaveError(null);
    try {
      await apiRequest(`/roles/${selected.id}`, { method: 'DELETE' });
      const fresh = await load();
      if (fresh.length) select(fresh[0]);
    } catch (err: any) {
      setSaveError(err.message || 'Could not delete role');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingState message="Loading roles..." />;
  if (error) return <div className="p-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      {/* Role list */}
      <Card className="border border-slate-100 shadow-xs">
        <CardContent className="p-2 space-y-1">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => select(r)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-md transition-colors',
                r.id === selectedId ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {r.locked && <Lock size={11} className="text-slate-400" />}
                  {r.name}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Users size={11} /> {r.userCount}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{r.permissions.length} permissions</span>
            </button>
          ))}
          {canManage && (
            <button
              onClick={startNew}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md border border-dashed text-xs font-bold',
                draft && !draft.id ? 'border-sky-300 bg-sky-50 text-[#0284c7]' : 'border-slate-300 text-slate-500 hover:text-[#0284c7] hover:border-sky-300',
              )}
            >
              <Plus size={14} /> New role
            </button>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      {draft && (
        <Card className="border border-slate-100 shadow-xs lg:col-span-2">
          <CardContent className="p-4 space-y-4">
            {selected?.locked && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <ShieldCheck size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>
                  <b>{selected.name}</b> always has every permission, including ones added in future updates. It cannot be edited or deleted.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Role name</label>
                <input
                  value={draft.name}
                  disabled={readOnly}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Quantity Surveyor"
                  className={cn(inputCls, readOnly && 'bg-slate-50')}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Description</label>
                <input
                  value={draft.description}
                  disabled={readOnly}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="What this role is for"
                  className={cn(inputCls, readOnly && 'bg-slate-50')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">
                Permissions <span className="text-slate-400 font-semibold">({draft.permissions.size} selected)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {catalogue.map((group) => {
                const onCount = group.permissions.filter((p) => draft.permissions.has(p.action)).length;
                const all = onCount === group.permissions.length;
                return (
                  <div key={group.module} className="rounded-md border border-slate-200">
                    <label className={cn('flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 rounded-t-md', !readOnly && 'cursor-pointer')}>
                      <span className="text-xs font-bold text-slate-800">{MODULE_LABELS[group.module] ?? group.module}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {onCount}/{group.permissions.length}
                        </span>
                        <input
                          type="checkbox"
                          className="accent-[#0284c7]"
                          disabled={readOnly}
                          checked={all}
                          ref={(el) => {
                            if (el) el.indeterminate = onCount > 0 && !all;
                          }}
                          onChange={(e) => toggleGroup(group, e.target.checked)}
                        />
                      </span>
                    </label>
                    <div className="p-2 space-y-0.5">
                      {group.permissions.map((p) => {
                        const grantable = hasPermission(p.action);
                        return (
                          <label
                            key={p.action}
                            title={grantable ? p.action : 'You cannot grant a permission you do not have'}
                            className={cn(
                              'flex items-start gap-2 px-1.5 py-1 rounded text-[11px]',
                              readOnly || !grantable ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50',
                              !grantable && !readOnly && 'opacity-50',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 accent-[#0284c7]"
                              disabled={readOnly || !grantable}
                              checked={draft.permissions.has(p.action)}
                              onChange={(e) => toggle(p.action, e.target.checked)}
                            />
                            <span className="text-slate-700">{p.description}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {!readOnly && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-[11px]">
                  {saveError ? (
                    <span className="text-rose-600 font-medium">{saveError}</span>
                  ) : savedAt && !dirty ? (
                    <span className="text-emerald-600 font-semibold">Saved. Users with this role get the change within 15 minutes.</span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {draft.id && (
                    <button
                      onClick={remove}
                      disabled={!!busy || (selected?.userCount ?? 0) > 0}
                      title={(selected?.userCount ?? 0) > 0 ? 'Reassign its users before deleting' : 'Delete role'}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold disabled:opacity-40"
                    >
                      {busy === 'delete' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                    </button>
                  )}
                  <button
                    onClick={save}
                    disabled={!!busy || !dirty || !draft.name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0284c7] hover:bg-[#0275b0] text-white text-xs font-bold disabled:opacity-50"
                  >
                    {busy === 'save' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {draft.id ? 'Save role' : 'Create role'}
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
