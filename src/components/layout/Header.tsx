import React, { useState } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  Bell,
  Plus,
  Menu,
  Check,
  AlertCircle,
  Calendar,
  PieChart,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { FinancialNotification, UserProfile } from '../../types';

interface HeaderProps {
  user: UserProfile;
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  onOpenSearch: () => void;
  onOpenNewTransaction: () => void;
  notifications: FinancialNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hideBalance,
  onToggleHideBalance,
  onOpenSearch,
  onOpenNewTransaction,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
      {/* Mobile brand & toggle */}
      <div className="flex items-center gap-3 lg:hidden">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <BrandLogo size="sm" showSubtitle={false} />
      </div>

      {/* Desktop search bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          id="btn-global-search"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Buscar no sistema...</span>
          </div>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile search icon */}
        <button
          onClick={onOpenSearch}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title="Buscar"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton compact />

        {/* Balance privacy toggle */}
        <button
          onClick={onToggleHideBalance}
          id="btn-toggle-balance-privacy"
          className={`p-2 rounded-xl border transition ${
            hideBalance
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title={hideBalance ? 'Mostrar saldos' : 'Ocultar saldos por privacidade'}
        >
          {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            id="btn-notifications"
            className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Notificações e Alertas"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0c1424] border border-slate-700/80 shadow-2xl p-4 z-50 text-slate-100 animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Notificações e Alertas</span>
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkAllNotificationsRead();
                    }}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Marcar lidas
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Nenhum alerta ou notificação no momento.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-3 rounded-xl border text-xs transition cursor-pointer ${
                        n.read
                          ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                          : 'bg-emerald-500/5 border-emerald-500/20 text-slate-200 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                            n.type === 'overdue'
                              ? 'bg-rose-500/20 text-rose-400'
                              : n.type === 'due_soon'
                              ? 'bg-amber-500/20 text-amber-400'
                              : n.type === 'budget_warning'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{n.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {n.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button: + Nova Movimentação */}
        <button
          onClick={onOpenNewTransaction}
          id="btn-quick-add-transaction"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition duration-150"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Movimentação</span>
          <span className="sm:hidden">Adicionar</span>
        </button>
      </div>
    </header>
  );
};
