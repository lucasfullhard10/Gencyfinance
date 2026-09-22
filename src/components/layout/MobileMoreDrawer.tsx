import React from 'react';
import {
  Calendar,
  PieChart,
  Target,
  BarChart3,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { ViewTab, UserProfile } from '../../types';
import { isSupabaseConfigured } from '../../services/supabase';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ViewTab) => void;
  currentTab: ViewTab;
  user: UserProfile;
  onLogout: () => void;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  currentTab,
  user,
  onLogout,
}) => {
  if (!isOpen) return null;

  const supabaseActive = isSupabaseConfigured();

  const menuItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    { id: 'calendar', label: 'Calendário Financeiro', icon: Calendar, desc: 'Fluxo diário de contas e vencimentos' },
    { id: 'budgets', label: 'Orçamentos', icon: PieChart, desc: 'Limites de gastos por categoria' },
    { id: 'goals', label: 'Metas Financeiras', icon: Target, desc: 'Planeje e alcance seus objetivos' },
    { id: 'reports', label: 'Relatórios & Gráficos', icon: BarChart3, desc: 'Evolução e distribuição financeira' },
    { id: 'settings', label: 'Configurações & Dados', icon: Settings, desc: 'Perfil, tema, backup e Supabase' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in">
      <div className="w-full bg-[#0c1424] border-t border-slate-700/80 rounded-t-3xl p-6 shadow-2xl text-slate-100 max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Outros Módulos</h3>
            <p className="text-xs text-slate-400">Acesse todas as ferramentas do Finangency</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database status pill */}
        <div className="my-4 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {supabaseActive ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <HardDrive className="w-4 h-4 text-blue-400" />
            )}
            <span>{supabaseActive ? 'Supabase Conectado' : 'Armazenamento Local'}</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseActive ? 'bg-emerald-400' : 'bg-blue-400'
            }`}
          />
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                    : 'bg-slate-900/40 border border-slate-800/60 text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-sm transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
