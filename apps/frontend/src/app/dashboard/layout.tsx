'use client';

import React from 'react';
import Sidebar from '../../components/layout/sidebar';
import { Search, Bell, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentDate = new Date();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-xs h-16">
          {/* Left search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search sites, machinery..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-slate-700"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-6">
            {/* Quick Site Location indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <MapPin size={14} className="text-sky-500" />
              <span>All active sites</span>
            </div>

            {/* Date Display */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar size={14} className="text-slate-400" />
              <span>{formatDate(currentDate)}</span>
            </div>

            {/* Notification Bell */}
            <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Language/Locale tag */}
            <div className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium border border-slate-200">
              🇪🇹 Amh / En
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
