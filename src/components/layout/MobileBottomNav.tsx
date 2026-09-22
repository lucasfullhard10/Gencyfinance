import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Calendar,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { ViewTab } from '../../types';

interface MobileBottomNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenNewTransaction: () => void;
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTransaction,
  onOpenMoreMenu,
}) => {
  const isMoreTab = ['budgets', 'goals', 'reports', 'settings'].includes(currentTab);

  return (
    <nav
      id="mobile-bottom-navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09101c]/95 backdrop-blur-xl border-t border-slate-800/80 px-3 flex items-center justify-around z-40 select-none pb-safe"
    >
      {/* 1. Início (Dashboard) */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          currentTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">Início</span>
      </button>

      {/* 2. Contas */}
      <button
        onClick={() => onSelectTab('accounts')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          currentTab === 'accounts' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Wallet className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">Contas</span>
      </button>

      {/* 3. Central Add Button */}
      <div className="flex items-center justify-center flex-1 -mt-5">
        <button
          onClick={onOpenNewTransaction}
          id="btn-mobile-central-add"
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform"
          title="Nova movimentação"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Movimentações */}
      <button
        onClick={() => onSelectTab('transactions')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          currentTab === 'transactions' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">Movimentos</span>
      </button>

      {/* 5. Mais */}
      <button
        onClick={onOpenMoreMenu}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isMoreTab ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">Mais</span>
      </button>
    </nav>
  );
};
