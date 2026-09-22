import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Wallet, Target, Tag } from 'lucide-react';
import { Account, Transaction, Category, Goal, ViewTab } from '../../types';
import { formatCurrency, formatDateBR } from '../../lib/financialMath';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  onNavigate: (tab: ViewTab) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  categories,
  goals,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via custom event or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return { transactions: [], accounts: [], goals: [] };
    const q = query.toLowerCase().trim();

    const filteredTx = transactions
      .filter((t) => t.description.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)))
      .slice(0, 5);

    const filteredAcc = accounts
      .filter((a) => a.name.toLowerCase().includes(q) || (a.institution && a.institution.toLowerCase().includes(q)))
      .slice(0, 4);

    const filteredGoals = goals
      .filter((g) => g.title.toLowerCase().includes(q))
      .slice(0, 3);

    return {
      transactions: filteredTx,
      accounts: filteredAcc,
      goals: filteredGoals,
    };
  }, [query, transactions, accounts, goals]);

  if (!isOpen) return null;

  const hasResults =
    results.transactions.length > 0 ||
    results.accounts.length > 0 ||
    results.goals.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0c1424] border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#09101c]">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar movimentações, contas, metas ou categorias..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="py-8 text-center text-slate-400 text-sm">
              Digite uma palavra-chave para buscar no seu sistema financeiro.
            </div>
          )}

          {query.trim() && !hasResults && (
            <div className="py-8 text-center text-slate-400 text-sm">
              Nenhum registro encontrado para "{query}".
            </div>
          )}

          {/* Transactions */}
          {results.transactions.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Movimentações
              </div>
              <div className="space-y-1.5">
                {results.transactions.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onNavigate('transactions');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 cursor-pointer transition border border-transparent hover:border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          t.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : t.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-sky-500/10 text-sky-400'
                        }`}
                      >
                        {t.type === 'income' && <ArrowDownLeft className="w-4 h-4" />}
                        {t.type === 'expense' && <ArrowUpRight className="w-4 h-4" />}
                        {t.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{t.description}</div>
                        <div className="text-xs text-slate-400">{formatDateBR(t.due_date)}</div>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        t.type === 'income'
                          ? 'text-emerald-400'
                          : t.type === 'expense'
                          ? 'text-rose-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {t.type === 'income' ? '+ ' : t.type === 'expense' ? '- ' : ''}
                      {formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accounts */}
          {results.accounts.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Contas
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.accounts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onNavigate('accounts');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 cursor-pointer transition border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: a.color || '#10b981' }}
                      >
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-white">{a.name}</span>
                    </div>
                    {a.institution && <span className="text-xs text-slate-400">{a.institution}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {results.goals.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Metas Financeiras
              </div>
              <div className="space-y-1.5">
                {results.goals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      onNavigate('goals');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 cursor-pointer transition border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-white">{g.title}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">
                      {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
