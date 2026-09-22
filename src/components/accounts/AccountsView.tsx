import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Account, Transaction } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  calculateAccountBalance,
  calculateAccountForecast,
} from '../../lib/financialMath';
import { ACCOUNT_TYPE_LABELS } from '../../lib/constants';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  hideBalance: boolean;
  onOpenNewAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  onOpenNewTransaction: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  hideBalance,
  onOpenNewAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenNewTransaction,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Total balance sum
  const totalBalance = accounts.reduce((acc, a) => {
    return acc + calculateAccountBalance(a, transactions);
  }, 0);

  const filteredAccounts = accounts.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.institution && a.institution.toLowerCase().includes(q))
    );
  });

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);
  const accountTransactions = selectedAccountId
    ? transactions.filter(
        (t) =>
          t.account_id === selectedAccountId ||
          t.destination_account_id === selectedAccountId
      )
    : [];

  return (
    <div className="space-y-6 pb-12" id="accounts-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Contas Financeiras
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Gerencie suas contas bancárias, carteiras e aplicações
          </p>
        </div>

        <button
          onClick={onOpenNewAccount}
          id="btn-add-account-top"
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta</span>
        </button>
      </div>

      {/* Consolidated Balance Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c1926] via-[#0b1624] to-[#09101c] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Patrimônio em Contas (Saldo Consolidado)
            </div>
            <div className="text-3xl font-extrabold text-white mt-1 tracking-tight">
              {formatCurrency(totalBalance, hideBalance)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-emerald-400">{accounts.length}</span> conta(s) cadastrada(s)
          </div>
        </div>
      </div>

      {/* Search Filter */}
      {accounts.length > 0 && (
        <div className="max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar contas por nome ou banco..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#09101c] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c1424] border border-slate-800/80 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhuma conta cadastrada</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Cadastre sua conta corrente, carteira física, poupança ou investimentos para gerenciar receitas e despesas com exatidão.
          </p>
          <button
            onClick={onOpenNewAccount}
            className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            + Cadastrar primeira conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => {
            const currentBalance = calculateAccountBalance(account, transactions);
            const forecastBalance = calculateAccountForecast(account, transactions, 30);
            const isSelected = selectedAccountId === account.id;

            return (
              <div
                key={account.id}
                className={`p-5 rounded-3xl bg-[#0c1424] border transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name, Type */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: account.color || '#10b981' }}
                      >
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{account.name}</h3>
                        <p className="text-[11px] text-slate-400">
                          {account.institution || ACCOUNT_TYPE_LABELS[account.type]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditAccount(account)}
                        title="Editar conta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteAccount(account)}
                        title="Excluir conta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Balance details */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-[#09101c] border border-slate-800/80">
                    <div className="text-[11px] text-slate-400">Saldo Atual Real</div>
                    <div
                      className={`text-2xl font-extrabold mt-0.5 ${
                        currentBalance >= 0 ? 'text-white' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(currentBalance, hideBalance)}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Previsão em 30 dias:</span>
                      <span
                        className={`font-semibold ${
                          forecastBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(forecastBalance, hideBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Extrato Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Saldo inicial: {formatCurrency(account.initial_balance, hideBalance)}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedAccountId(isSelected ? null : account.id)
                    }
                    className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>{isSelected ? 'Ocultar extrato' : 'Ver extrato'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Account Statement Drawer / Panel */}
      {activeAccount && (
        <div className="mt-6 p-6 rounded-3xl bg-[#0c1424] border border-emerald-500/30 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet
                  className="w-5 h-5"
                  style={{ color: activeAccount.color || '#10b981' }}
                />
                Extrato: {activeAccount.name}
              </h3>
              <p className="text-xs text-slate-400">
                Histórico completo de receitas, despesas e transferências desta conta
              </p>
            </div>
            <button
              onClick={() => setSelectedAccountId(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60"
            >
              Fechar extrato
            </button>
          </div>

          <div className="mt-4">
            {accountTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Nenhuma movimentação registrada para esta conta.
              </div>
            ) : (
              <div className="space-y-2">
                {accountTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-[#09101c] border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : tx.type === 'expense'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-sky-500/10 text-sky-400'
                        }`}
                      >
                        {tx.type === 'income' && <ArrowDownLeft className="w-4 h-4" />}
                        {tx.type === 'expense' && <ArrowUpRight className="w-4 h-4" />}
                        {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {tx.description}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDateBR(tx.due_date)} • {tx.category?.name || 'Sem categoria'}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-400'
                          : tx.type === 'expense'
                          ? 'text-rose-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : ''}
                      {formatCurrency(tx.amount, hideBalance)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
