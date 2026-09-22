import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';
import { Transaction, Account, Category } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodayDateString,
  addDays,
} from '../../lib/financialMath';

interface ReportsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  hideBalance: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  accounts,
  categories,
  hideBalance,
}) => {
  const [periodMonths, setPeriodMonths] = useState<3 | 6 | 12>(6);
  const todayStr = getTodayDateString();

  // Filter transactions within the selected window
  const windowDays = periodMonths * 30;
  const windowStartDate = addDays(todayStr, -windowDays);

  const windowTransactions = useMemo(() => {
    return transactions.filter((t) => t.due_date >= windowStartDate && t.due_date <= todayStr);
  }, [transactions, windowStartDate, todayStr]);

  // Overall calculations
  const totalIncomes = useMemo(() => {
    return windowTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
  }, [windowTransactions]);

  const totalExpenses = useMemo(() => {
    return windowTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }, [windowTransactions]);

  const netSavings = totalIncomes - totalExpenses;
  const savingsRate =
    totalIncomes > 0 ? Math.round((Math.max(0, netSavings) / totalIncomes) * 100) : 0;

  // Monthly breakdown (last 6 months)
  const monthlyData = useMemo(() => {
    const monthsMap = new Map<string, { monthLabel: string; income: number; expense: number }>();

    // Generate month keys
    const now = new Date();
    for (let i = periodMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      monthsMap.set(key, { monthLabel: label, income: 0, expense: 0 });
    }

    for (const t of windowTransactions) {
      const key = t.due_date.substring(0, 7);
      if (monthsMap.has(key)) {
        const item = monthsMap.get(key)!;
        if (t.type === 'income') item.income += t.amount;
        if (t.type === 'expense') item.expense += t.amount;
      }
    }

    return Array.from(monthsMap.entries()).map(([key, data]) => ({
      key,
      ...data,
    }));
  }, [windowTransactions, periodMonths]);

  // Highest expense items
  const topExpenses = useMemo(() => {
    return windowTransactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [windowTransactions]);

  // Category breakdown
  const categorySummary = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number }>();
    for (const t of windowTransactions) {
      if (t.type === 'expense') {
        const catName = t.category?.name || 'Sem categoria';
        const color = t.category?.color || '#10b981';
        const curr = map.get(catName) || { name: catName, color, total: 0 };
        curr.total += t.amount;
        map.set(catName, curr);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [windowTransactions]);

  const maxMonthValue = useMemo(() => {
    let max = 1;
    for (const m of monthlyData) {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    }
    return max;
  }, [monthlyData]);

  return (
    <div className="space-y-6 pb-12" id="reports-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Relatórios & Análise Financeira
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Evolução de patrimônio, despesas e métricas de poupança
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {([3, 6, 12] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPeriodMonths(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                periodMonths === m
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800">
          <span className="text-xs text-slate-400">Receitas no Período</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            +{formatCurrency(totalIncomes, hideBalance)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800">
          <span className="text-xs text-slate-400">Despesas no Período</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-2">
            -{formatCurrency(totalExpenses, hideBalance)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800">
          <span className="text-xs text-slate-400">Superávit Líquido</span>
          <div
            className={`text-2xl font-extrabold mt-2 ${
              netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(netSavings, hideBalance)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800">
          <span className="text-xs text-slate-400">Taxa de Poupança</span>
          <div className="text-2xl font-extrabold text-teal-400 mt-2">
            {savingsRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Da renda retida no período
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Evolução Mensal (Receitas x Despesas)
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Receitas
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Despesas
            </span>
          </div>
        </div>

        {totalIncomes === 0 && totalExpenses === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Ainda não há movimentações registradas no período para exibir o gráfico comparativo.
          </div>
        ) : (
          <div className="mt-8">
            <div className="grid grid-cols-6 gap-2 sm:gap-6 h-56 items-end pb-4 border-b border-slate-800">
              {monthlyData.map((m) => {
                const incomeH = Math.round((m.income / maxMonthValue) * 100);
                const expenseH = Math.round((m.expense / maxMonthValue) * 100);

                return (
                  <div key={m.key} className="flex flex-col items-center h-full justify-end gap-2">
                    <div className="flex items-end gap-1.5 sm:gap-3 w-full justify-center h-full">
                      {/* Income Bar */}
                      <div
                        className="w-3.5 sm:w-6 bg-emerald-400/90 rounded-t-md transition-all duration-500 hover:bg-emerald-300"
                        style={{ height: `${Math.max(4, incomeH)}%` }}
                        title={`Receitas: ${formatCurrency(m.income, hideBalance)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-3.5 sm:w-6 bg-rose-400/90 rounded-t-md transition-all duration-500 hover:bg-rose-300"
                        style={{ height: `${Math.max(4, expenseH)}%` }}
                        title={`Despesas: ${formatCurrency(m.expense, hideBalance)}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 capitalize">
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Despesas por Categoria & Maiores Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Gastos por Categoria ({periodMonths} meses)
          </h3>

          <div className="mt-4 space-y-3">
            {categorySummary.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum gasto por categoria registrado.
              </div>
            ) : (
              categorySummary.map((c) => {
                const percent =
                  totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-slate-200 font-medium">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{percent}%</span>
                        <span className="font-bold text-white">
                          {formatCurrency(c.total, hideBalance)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: c.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Maiores Gastos Individuais */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-4 h-4 text-rose-400" />
            Maiores Despesas Individuais
          </h3>

          <div className="mt-4 space-y-2.5">
            {topExpenses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhuma despesa individual registrada.
              </div>
            ) : (
              topExpenses.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#09101c] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{t.description}</div>
                    <div className="text-[11px] text-slate-400">
                      {formatDateBR(t.due_date)} • {t.category?.name || 'Sem categoria'}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-rose-400">
                    -{formatCurrency(t.amount, hideBalance)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
