'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Gavel,
  Truck,
  Warehouse,
  Droplet,
  Users,
  Wrench,
  FileText,
  DollarSign,
  Settings,
  UserCog,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  /** Permission required to see this item. CEO/Owner bypasses all. */
  requiredPermission?: string;
  /** Any of these permissions grants access */
  anyPermission?: string[];
  /** CEO only — no permission string required */
  ceoOnly?: boolean;
}

const ALL_MENU_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiredPermission: 'dashboard:view',
  },
  {
    name: 'Projects & Sites',
    href: '/dashboard/projects',
    icon: Building2,
    requiredPermission: 'projects:view',
  },
  {
    name: 'Tenders & Bids',
    href: '/dashboard/tenders',
    icon: Gavel,
    requiredPermission: 'tenders:view',
  },
  {
    name: 'Machinery',
    href: '/dashboard/machinery',
    icon: Truck,
    requiredPermission: 'machinery:view',
  },
  {
    name: 'Inventory & Materials',
    href: '/dashboard/inventory',
    icon: Warehouse,
    requiredPermission: 'inventory:view',
  },
  {
    name: 'Fuel',
    href: '/dashboard/fuel',
    icon: Droplet,
    anyPermission: ['fuel:view', 'fuel:request'],
  },
  {
    name: 'HR & Attendance',
    href: '/dashboard/hr',
    icon: Users,
    anyPermission: ['hr:view', 'attendance:view'],
  },
  {
    name: 'Maintenance',
    href: '/dashboard/maintenance',
    icon: Wrench,
    requiredPermission: 'maintenance:view',
  },
  {
    name: 'Daily Reports',
    href: '/dashboard/reports',
    icon: FileText,
    requiredPermission: 'reports:view',
  },
  {
    name: 'Finance Lite',
    href: '/dashboard/finance',
    icon: DollarSign,
    requiredPermission: 'finance:view',
  },
  {
    name: 'Users & Access',
    href: '/dashboard/users',
    icon: UserCog,
    requiredPermission: 'users:view',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    anyPermission: ['settings:view'],
    ceoOnly: false, // CEO auto-passes via hasPermission check; settings:view is CEO-only in seed
  },
];

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission, hasAnyPermission, isCEO, logout } = useAuth();

  // Filter menu items based on user permissions
  const menuItems = ALL_MENU_ITEMS.filter((item) => {
    // CEO / Owner sees everything
    if (isCEO()) return true;

    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }
    if (item.anyPermission) {
      return hasAnyPermission(item.anyPermission);
    }
    return true; // No restriction = visible
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : 'User';

  const displayRole = user?.roles?.[0] ?? 'Viewer';

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : 'U';

  return (
    <aside
      className={cn(
        'flex flex-col w-64 bg-[#0f172a] text-slate-100 border-r border-[#1e293b] h-screen sticky top-0',
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#1e293b]">
        <div className="bg-[#0284c7] text-white p-1.5 rounded-md">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="font-bold text-md leading-tight">Le'Kiray ERP</h1>
          <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">
            Contractor Portal
          </span>
        </div>
      </div>

      {/* Tenant Context */}
      <div className="mx-4 my-4 p-3 rounded-lg bg-[#1e293b]/50 border border-[#334155]/30">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">
              Active Company
            </span>
            <span className="text-xs font-semibold text-white">
              {user?.companyName ?? ''}
            </span>
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
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 relative group',
                isActive
                  ? 'bg-[#0284c7] text-white shadow-md shadow-[#0284c7]/10'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e293b]',
              )}
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-white'
                }
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-[#1e293b] bg-[#090d16]">
        <div className="flex items-center gap-3">
          {/* Avatar with initials */}
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0284c7]/20 border border-[#0284c7]/30 text-sky-300 font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 truncate">{displayRole}</p>
          </div>
          <button
            id="sidebar-logout"
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-[#1e293b]/50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
