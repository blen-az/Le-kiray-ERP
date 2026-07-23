'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Truck,
  Warehouse,
  Droplet,
  Users,
  Wrench,
  FileText,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects & Sites', href: '/dashboard/projects', icon: Building2 },
    { name: 'Machinery', href: '/dashboard/machinery', icon: Truck },
    { name: 'Inventory & Materials', href: '/dashboard/inventory', icon: Warehouse },
    { name: 'Fuel', href: '/dashboard/fuel', icon: Droplet },
    { name: 'HR & Attendance', href: '/dashboard/hr', icon: Users },
    { name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench, isPlaceholder: true },
    { name: 'Daily Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, isPlaceholder: true },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col w-64 bg-[#0f172a] text-slate-100 border-r border-[#1e293b] h-screen sticky top-0',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#1e293b]">
        <div className="bg-[#0284c7] text-white p-1.5 rounded-md">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="font-bold text-md leading-tight">Le’Kiray ERP</h1>
          <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">Contractor Portal</span>
        </div>
      </div>

      {/* Tenant Context */}
      <div className="mx-4 my-4 p-3 rounded-lg bg-[#1e293b]/50 border border-[#334155]/30">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">Active Company</span>
            <span className="text-xs font-semibold text-white">ABC Construction PLC</span>
          </div>
          <div className="flex items-center justify-center bg-[#0284c7]/20 border border-[#0284c7]/30 text-xs px-2 py-0.5 rounded text-sky-300 font-medium">
            ETB
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Ethiopia Workspace
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 relative group',
                isActive
                  ? 'bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/10'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'
              )}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              <span>{item.name}</span>
              {item.isPlaceholder && (
                <span className="ml-auto text-[8px] bg-slate-700/80 text-slate-300 font-semibold px-1 rounded-sm border border-slate-600 uppercase tracking-wide">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-[#1e293b] bg-[#090d16]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1e293b] text-sky-400 font-bold border border-[#334155]">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Kidus Getachew</p>
            <p className="text-[10px] text-slate-400 truncate">CEO / Owner</p>
          </div>
          <button className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-[#1e293b]/50 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
