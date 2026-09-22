import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Wallet,
  Tag,
} from 'lucide-react';
import {
  Transaction,
  Account,
  Category,
  TransactionType,
  TransactionStatus,
} from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodayDateString,
  addDays,
} from '../../lib/financialMath';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  hideBalance: boolean;
  onOpenNewTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onToggleStatus: (transaction: Transaction) => Promise<void>;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  hideBalance,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
}) => {
  const todayStr = getTodayDateString();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'today' | '7d' | 'this_month' | 'all'>('this_month');

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type
      if (filterType !== 'all' && t.type !== filterType) return false;

      // Status
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;

      // Account
      if (filterAccountId !== 'all') {
        if (t.account_id !== filterAccountId && t.destination_account_id !== filterAccountId) {
          return false;
        }
      }

      // Category
      if (filterCategoryId !== 'all' && t.category_id !== filterCategoryId) return false;

      // Period
      if (filterPeriod === 'today' && t.due_date !== todayStr) return false;
      if (filterPeriod === '7d') {
        const weekAgo = addDays(todayStr, -7);
        if (t.due_date < weekAgo || t.due_date > todayStr) return false;
      }
      if (filterPeriod === 'this_month') {
        const currentMonthPrefix = todayStr.substring(0, 7);
        if (!t.due_date.startsWith(currentMonthPrefix)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        if (!matchDesc && !matchNotes) return false;
      }

      return true;
    });
  }, [
    transactions,
    filterType,
    filterStatus,
    filterAccountId,
    filterCategoryId,
    filterPeriod,
    searchQuery,
    todayStr,
  ]);

  // Filtered Totals Summary
  const filteredIncomes = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredNet = filteredIncomes - filteredExpenses;

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'Status', 'Conta', 'Categoria', 'Notas'];
    const rows = filteredTransactions.map((t) => [
      t.due_date,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.status,
      `"${t.account?.name || ''}"`,
      `"${t.category?.name || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finangency_movimentacoes_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12" id="transactions-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Movimentações
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Extrato detalhado de receitas, despesas e transferências
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {filteredTransactions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Exportar dados filtrados para CSV"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            onClick={onOpenNewTransaction}
            id="btn-add-transaction-top"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Filtered Financial Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Receitas Filtradas</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              +{formatCurrency(filteredIncomes, hideBalance)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Despesas Filtradas</div>
            <div className="text-lg font-bold text-rose-400 mt-0.5">
              -{formatCurrency(filteredExpenses, hideBalance)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Resultado Líquido</div>
            <div
              className={`text-lg font-bold mt-0.5 ${
                filteredNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(filteredNet, hideBalance)}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
            <Filter className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-3xl bg-[#0c1424] border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar descrição ou nota..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Period */}
          <div>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-xs focus:outline-none"
            >
              <option value="this_month">Este mês</option>
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="all">Todo o período</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-xs focus:outline-none"
            >
              <option value="all">Todos os tipos</option>
              <option value="income">Apenas Receitas</option>
              <option value="expense">Apenas Despesas</option>
              <option value="transfer">Apenas Transferências</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-xs focus:outline-none"
            >
              <option value="all">Todos os status</option>
              <option value="paid">Pagas / Recebidas</option>
              <option value="pending">Pendentes / Previstas</option>
              <option value="overdue">Vencidas</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-xs focus:outline-none"
            >
              <option value="all">Todas as contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0c1424] border border-slate-800/80 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhuma movimentação encontrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Nenhuma movimentação corresponde aos filtros selecionados ou ainda não há lançamentos.
            </p>
            <button
              onClick={onOpenNewTransaction}
              className="mt-5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              + Adicionar movimentação
            </button>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isCompleted = tx.status === 'paid' || tx.status === 'received' || tx.status === 'completed';
            const isOverdue = tx.status === 'overdue' || (tx.status === 'pending' && tx.due_date < todayStr);

            return (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[#0c1424] border border-slate-800 hover:border-slate-700/80 transition flex items-center justify-between gap-3 group"
              >
                {/* Left: Type Icon & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : tx.type === 'expense'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {tx.type === 'income' && <ArrowDownLeft className="w-5 h-5" />}
                    {tx.type === 'expense' && <ArrowUpRight className="w-5 h-5" />}
                    {tx.type === 'transfer' && <ArrowRightLeft className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {tx.description}
                      </span>
                      {tx.recurrence_type && tx.recurrence_type !== 'none' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Recorrente
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>{formatDateBR(tx.due_date)}</span>
                      <span>•</span>
                      <span>{tx.account?.name || 'Conta'}</span>
                      {tx.category?.name && (
                        <>
                          <span>•</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor: `${tx.category.color}20`,
                              color: tx.category.color,
                            }}
                          >
                            {tx.category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Action buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-extrabold ${
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

                    {/* Status Pill */}
                    <div className="mt-0.5 flex justify-end">
                      {isCompleted ? (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {tx.type === 'income' ? 'Recebido' : tx.type === 'expense' ? 'Pago' : 'Concluído'}
                        </span>
                      ) : isOverdue ? (
                        <span className="text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Vencida
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown / Direct buttons */}
                  <div className="flex items-center gap-1">
                    {/* Quick status toggle */}
                    {tx.type !== 'transfer' && (
                      <button
                        onClick={() => onToggleStatus(tx)}
                        title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                        className={`p-1.5 rounded-lg border transition ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onEditTransaction(tx)}
                      title="Editar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteTransaction(tx)}
                      title="Excluir"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
