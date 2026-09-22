import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Calendar,
  PieChart,
  Target,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { ViewTab, UserProfile } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { isSupabaseConfigured } from '../../services/supabase';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  user: UserProfile;
  onLogout: () => void;
  realAvailableBalance: number;
  hideBalance: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  realAvailableBalance,
  hideBalance,
}) => {
  const supabaseActive = isSupabaseConfigured();

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Contas', icon: Wallet },
    { id: 'transactions', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'budgets', label: 'Orçamentos', icon: PieChart },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#09101c] border-r border-slate-800/80 p-4 h-screen sticky top-0 justify-between select-none z-30">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-2 pt-2 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <BrandLogo size="md" />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Database Status */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        {/* Database Mode Pill */}
        <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            {supabaseActive ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="font-medium">
              {supabaseActive ? 'Supabase Conectado' : 'Armazenamento Local'}
            </span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseActive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
            }`}
          />
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sair da conta"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
