import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  ShieldCheck,
  Zap,
  DollarSign,
  PieChart,
} from 'lucide-react';
import {
  Account,
  Transaction,
  Budget,
  UserProfile,
  ViewTab,
  ForecastPeriodSummary,
} from '../../types';
import {
  formatCurrency,
  formatDateBR,
  calculateFinancialSummary,
  calculateForecasts,
  calculateAccountBalance,
  getTodayDateString,
  addDays,
} from '../../lib/financialMath';

interface DashboardViewProps {
  user: UserProfile;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  hideBalance: boolean;
  onNavigate: (tab: ViewTab) => void;
  onOpenNewTransaction: () => void;
  onOpenNewAccount: () => void;
  onMarkExpensePaid: (id: string) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  accounts,
  transactions,
  budgets,
  hideBalance,
  onNavigate,
  onOpenNewTransaction,
  onOpenNewAccount,
  onMarkExpensePaid,
}) => {
  // Period filter: 7, 30, 90 days
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const [forecastDays, setForecastDays] = useState<number>(30);

  const todayStr = getTodayDateString();
  const periodStartDate = useMemo(() => {
    return addDays(todayStr, -periodDays);
  }, [todayStr, periodDays]);

  // Financial summary derived dynamically
  const summary = useMemo(() => {
    return calculateFinancialSummary(accounts, transactions, periodStartDate, todayStr);
  }, [accounts, transactions, periodStartDate, todayStr]);

  // Multi-period forecasts
  const forecasts = useMemo(() => {
    return calculateForecasts(accounts, transactions);
  }, [accounts, transactions]);

  const activeForecast = useMemo(() => {
    return forecasts.find((f) => f.days === forecastDays) || forecasts[2];
  }, [forecasts, forecastDays]);

  // Upcoming due expenses (Próximos vencimentos)
  const upcomingBills = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && (t.status === 'pending' || t.status === 'overdue'))
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5);
  }, [transactions]);

  // Expense distribution by category
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number }>();
    for (const t of transactions) {
      if (t.type === 'expense' && (t.status === 'paid' || t.status === 'pending')) {
        const catName = t.category?.name || 'Outros';
        const color = t.category?.color || '#10b981';
        const current = map.get(catName) || { name: catName, color, total: 0 };
        current.total += t.amount;
        map.set(catName, current);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const totalExpenseCategorySum = useMemo(() => {
    return expenseByCategory.reduce((acc, curr) => acc + curr.total, 0);
  }, [expenseByCategory]);

  const isBrandNewUser = accounts.length === 0 && transactions.length === 0;

  return (
    <div className="space-y-6 pb-12" id="dashboard-view">
      {/* Header with Title & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Visão geral das suas finanças pessoais
          </p>
        </div>

        {/* Period Selector Tabs: 7 dias | 30 dias | 90 dias */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start sm:self-auto">
          {([7, 30, 90] as const).map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                periodDays === days
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      {/* Brand New User Sophisticated Onboarding Banner */}
      {isBrandNewUser && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d1c2a] via-[#0b1626] to-[#09101c] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>Primeiro Acesso ao Finangency</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              Organize suas contas a partir de dados reais
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              O Finangency não utiliza dados ou saldos fictícios. Comece cadastrando sua primeira conta financeira para calcular seus saldos e acompanhar seu patrimônio com precisão total.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenNewAccount}
                id="btn-onboarding-add-account"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar primeira conta</span>
              </button>
              <button
                onClick={onOpenNewTransaction}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition flex items-center gap-2"
              >
                <span>+ Adicionar movimentação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Total */}
        <div
          onClick={() => onNavigate('accounts')}
          className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800/90 shadow-xl hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Saldo Total</span>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 group-hover:scale-105 transition">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white mt-3 tracking-tight">
            {formatCurrency(summary.total_balance, hideBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{accounts.length} conta(s) ativa(s)</span>
            <span className="text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-1 transition">
              Ver contas <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. Saldo Disponível Real */}
        <div className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Saldo Disponível Real</span>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-teal-400 mt-3 tracking-tight">
            {formatCurrency(summary.real_available_balance, hideBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Livre de contas imediatas e vencidas
          </div>
        </div>

        {/* 3. Receitas do Período */}
        <div
          onClick={() => onNavigate('transactions')}
          className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800/90 shadow-xl hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Receitas ({periodDays}d)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 mt-3 tracking-tight">
            {formatCurrency(summary.period_incomes, hideBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Previstas a receber: {formatCurrency(summary.planned_incomes, hideBalance)}
          </div>
        </div>

        {/* 4. Despesas do Período */}
        <div
          onClick={() => onNavigate('transactions')}
          className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800/90 shadow-xl hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Despesas ({periodDays}d)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-rose-400 mt-3 tracking-tight">
            {formatCurrency(summary.period_expenses, hideBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pendentes: {formatCurrency(summary.pending_expenses, hideBalance)}
          </div>
        </div>
      </div>

      {/* Grid: Previsão Financeira & Próximos Vencimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Previsão Financeira (2 Columns) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Previsão Financeira & Fluxo Projetado
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saldo atual somado às receitas e despesas programadas
                </p>
              </div>

              {/* Forecast period pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
                {forecasts.map((f) => (
                  <button
                    key={f.days}
                    onClick={() => setForecastDays(f.days)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      forecastDays === f.days
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Forecast details box */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#09101c] border border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Saldo Atual Base</div>
                <div className="text-lg font-bold text-white mt-1">
                  {formatCurrency(summary.total_balance, hideBalance)}
                </div>
              </div>
              <div>
                <div className="text-xs text-emerald-400">
                  + Receitas Previstas ({forecastDays}d)
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  +{formatCurrency(activeForecast.projected_incomes, hideBalance)}
                </div>
              </div>
              <div>
                <div className="text-xs text-rose-400">
                  - Despesas Previstas ({forecastDays}d)
                </div>
                <div className="text-lg font-bold text-rose-400 mt-1">
                  -{formatCurrency(activeForecast.projected_expenses, hideBalance)}
                </div>
              </div>
            </div>

            {/* Projected Result Callout */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Saldo Final Previsto em {activeForecast.label}
                </div>
                <div
                  className={`text-2xl font-extrabold mt-1 ${
                    activeForecast.projected_final_balance < 0
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(activeForecast.projected_final_balance, hideBalance)}
                </div>
              </div>

              {activeForecast.is_at_risk ? (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Risco de Saldo Negativo
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Fluxo Saudável
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Cálculo baseado estritamente nos compromissos cadastrados.</span>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              Abrir calendário financeiro <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Próximos Vencimentos (1 Column) */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Próximos Vencimentos
              </h3>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs text-emerald-400 hover:underline"
              >
                Ver todas
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {upcomingBills.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-300">Nenhum vencimento próximo.</p>
                  <p className="mt-1">Todas as suas despesas estão em dia ou não há despesas pendentes.</p>
                  <button
                    onClick={onOpenNewTransaction}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar despesa
                  </button>
                </div>
              ) : (
                upcomingBills.map((bill) => {
                  const isOverdue = bill.due_date < todayStr;
                  return (
                    <div
                      key={bill.id}
                      className="p-3 rounded-2xl bg-[#09101c] border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition"
                    >
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">
                          {bill.description}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                            {formatDateBR(bill.due_date)} {isOverdue && '(Vencida)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold text-rose-400">
                          {formatCurrency(bill.amount, hideBalance)}
                        </span>
                        <button
                          onClick={() => onMarkExpensePaid(bill.id)}
                          title="Marcar como pago"
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 transition"
                        >
                          Pagar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-400">
              {summary.pending_expenses > 0
                ? `Total pendente: ${formatCurrency(summary.pending_expenses, hideBalance)}`
                : 'Zero despesas pendentes'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Distribuição de Despesas & Contas Ativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Despesas */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Distribuição de Despesas
            </h3>
            <span className="text-xs text-slate-400">Dados reais cadastrados</span>
          </div>

          <div className="mt-5">
            {expenseByCategory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Ainda não há dados de despesas suficientes para gerar a distribuição.
              </div>
            ) : (
              <div className="space-y-3">
                {expenseByCategory.slice(0, 5).map((cat) => {
                  const percent =
                    totalExpenseCategorySum > 0
                      ? Math.round((cat.total / totalExpenseCategorySum) * 100)
                      : 0;
                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-semibold text-slate-200">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{percent}%</span>
                          <span className="font-bold text-white">
                            {formatCurrency(cat.total, hideBalance)}
                          </span>
                        </div>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Contas e Saldos */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Suas Contas
              </h3>
              <button
                onClick={onOpenNewAccount}
                className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Conta
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {accounts.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-300">Nenhuma conta cadastrada.</p>
                  <p className="mt-1">Adicione sua primeira conta para calcular seus saldos.</p>
                  <button
                    onClick={onOpenNewAccount}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                  >
                    + Adicionar primeira conta
                  </button>
                </div>
              ) : (
                accounts.map((acc) => {
                  const balance = calculateAccountBalance(acc, transactions);
                  return (
                    <div
                      key={acc.id}
                      onClick={() => onNavigate('accounts')}
                      className="p-3.5 rounded-2xl bg-[#09101c] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: acc.color || '#10b981' }}
                        >
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{acc.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {acc.institution || 'Conta Pessoal'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm font-extrabold ${
                            balance >= 0 ? 'text-white' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(balance, hideBalance)}
                        </div>
                        <div className="text-[10px] text-slate-500">Saldo atual</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-right">
            <button
              onClick={() => onNavigate('accounts')}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              Gerenciar todas as contas &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
