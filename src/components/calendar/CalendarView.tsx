import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, Account } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodayDateString,
} from '../../lib/financialMath';

interface CalendarViewProps {
  transactions: Transaction[];
  accounts: Account[];
  hideBalance: boolean;
  onOpenNewTransaction: () => void;
  onToggleStatus: (transaction: Transaction) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  accounts,
  hideBalance,
  onOpenNewTransaction,
  onToggleStatus,
}) => {
  const todayStr = getTodayDateString();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayStr(todayStr);
  };

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Calendar grid calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map transactions by due_date
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = map.get(tx.due_date) || [];
      list.push(tx);
      map.set(tx.due_date, list);
    }
    return map;
  }, [transactions]);

  // Selected Day transactions
  const selectedDayTransactions = useMemo(() => {
    return transactionsByDate.get(selectedDayStr) || [];
  }, [transactionsByDate, selectedDayStr]);

  const selectedDayIncome = selectedDayTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const selectedDayExpense = selectedDayTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const selectedDayBalance = selectedDayIncome - selectedDayExpense;

  return (
    <div className="space-y-6 pb-12" id="calendar-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Calendário Financeiro
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Visualize vencimentos e receitas dia a dia
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Hoje
          </button>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-2">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Matrix & Day Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Matrix (2 Columns) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 pb-3 border-b border-slate-800">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
              <div key={i} className={i === 0 || i === 6 ? 'text-slate-500' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-3">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[64px] sm:min-h-[80px] p-1 rounded-2xl bg-slate-900/20 opacity-30" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDayStr;
              const dayTxs = transactionsByDate.get(dateStr) || [];
              const dayIncome = dayTxs.filter((t) => t.type === 'income').length;
              const dayExpense = dayTxs.filter((t) => t.type === 'expense').length;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`min-h-[64px] sm:min-h-[80px] p-1.5 sm:p-2 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : isToday
                      ? 'bg-slate-900/90 border-emerald-500/40 text-white'
                      : 'bg-[#09101c] border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center'
                          : ''
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayTxs.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayTxs.length}
                      </span>
                    )}
                  </div>

                  {/* Badges / Dots */}
                  <div className="flex flex-col gap-1 mt-1">
                    {dayIncome > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="hidden sm:inline">+{dayIncome} rec.</span>
                      </div>
                    )}
                    {dayExpense > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                        <span className="hidden sm:inline">-{dayExpense} desp.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel (1 Column) */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" />
                  {formatDateBR(selectedDayStr)}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {selectedDayStr === todayStr ? 'Hoje' : 'Dia Selecionado'}
                </span>
              </div>

              <button
                onClick={onOpenNewTransaction}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                title="Adicionar movimentação"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Daily balance summary */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#09101c] border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Entradas:</span>
                <p className="font-bold text-emerald-400 mt-0.5">
                  +{formatCurrency(selectedDayIncome, hideBalance)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Saídas:</span>
                <p className="font-bold text-rose-400 mt-0.5">
                  -{formatCurrency(selectedDayExpense, hideBalance)}
                </p>
              </div>
            </div>

            {/* List for the selected day */}
            <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <p>Nenhuma movimentação registrada para este dia.</p>
                  <button
                    onClick={onOpenNewTransaction}
                    className="mt-3 text-xs text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agendar para esta data
                  </button>
                </div>
              ) : (
                selectedDayTransactions.map((tx) => {
                  const isCompleted =
                    tx.status === 'paid' ||
                    tx.status === 'received' ||
                    tx.status === 'completed';

                  return (
                    <div
                      key={tx.id}
                      className="p-3 rounded-2xl bg-[#09101c] border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {tx.description}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {tx.account?.name || 'Conta'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs font-extrabold ${
                            tx.type === 'income'
                              ? 'text-emerald-400'
                              : tx.type === 'expense'
                              ? 'text-rose-400'
                              : 'text-sky-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : ''}
                          {formatCurrency(tx.amount, hideBalance)}
                        </span>

                        <button
                          onClick={() => onToggleStatus(tx)}
                          className={`p-1 rounded-lg border transition ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                          title="Alternar status"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-right">
            <span className="text-xs font-semibold text-slate-300">
              Resultado do dia: {formatCurrency(selectedDayBalance, hideBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
