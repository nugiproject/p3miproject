import React from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  BarChart3,
  UploadCloud,
  Building2,
  RotateCcw,
  LogOut,
  Shield,
} from 'lucide-react';
import { PortalUser } from '../types/cpmi';

export type TabType = 'dashboard' | 'cpmi' | 'transaksi' | 'laporan' | 'import' | 'pengaturan-pt';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  ptName: string;
  ptLogo: string | null;
  currentUser: PortalUser | null;
  onLogout: () => void;
  onResetDefaults: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  ptName,
  ptLogo,
  currentUser,
  onLogout,
  onResetDefaults,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'cpmi' as TabType, label: 'Database CPMI', icon: Users },
    { id: 'transaksi' as TabType, label: 'Buku Kas Kasir', icon: Receipt },
    { id: 'laporan' as TabType, label: 'Laporan & Laba', icon: BarChart3 },
    { id: 'import' as TabType, label: 'Batch Import', icon: UploadCloud },
    { id: 'pengaturan-pt' as TabType, label: 'Pengaturan PT', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2DDD5] shadow-xs print:hidden">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Company Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1F3A5F] flex items-center justify-center text-white shrink-0 overflow-hidden shadow-sm border border-amber-400/40">
              {ptLogo ? (
                <img src={ptLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-[#1F3A5F] font-serif truncate leading-tight tracking-tight">
                  {ptName}
                </h1>
                <span className="bg-amber-100 text-amber-900 border border-amber-300/60 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                  P3MI RESMI
                </span>
              </div>
              <p className="text-[10px] text-[#8C8479] font-medium truncate hidden sm:block">
                Sistem Manajemen Penempatan Pekerja Migran Indonesia & Buku Kas Kasir
              </p>
            </div>
          </div>

          {/* Right actions: Reset + Profile + Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={onResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8C8479] hover:text-[#1F3A5F] hover:bg-[#F7F5F2] rounded-xl transition-all border border-[#E2DDD5]/70 cursor-pointer"
              title="Atur ulang database ke versi data awal bawaan PT. Trias Insan Madani"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline text-[11px] font-medium">Reset Bawaan</span>
            </button>

            {currentUser && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E2DDD5]">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-[#1F3A5F] leading-tight">
                    {currentUser.name}
                  </p>
                  <span className="text-[9px] text-[#4B6584] font-mono font-bold uppercase tracking-wider block">
                    {currentUser.role}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <button
                  onClick={onLogout}
                  title="Keluar dari Portal"
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Navigation Bar */}
      <div className="bg-[#1F3A5F] border-t border-[#152A4A] py-1 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1 sm:space-x-2 py-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  id={`tab-nav-${tab.id}`}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1F3A5F] shadow-sm font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
