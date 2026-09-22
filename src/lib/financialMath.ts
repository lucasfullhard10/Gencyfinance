import { Account, Transaction, FinancialSummary, ForecastPeriodSummary, Budget, FinancialNotification } from '../types';

/**
 * Calculate forecasted balance for a specific account over N days
 */
export function calculateAccountForecast(
  account: Account,
  transactions: Transaction[],
  days = 30
): number {
  const todayStr = getTodayDateString();
  const targetDate = addDays(todayStr, days);
  let balance = calculateAccountBalance(account, transactions);

  for (const rawT of transactions) {
    const t = normalizeTransactionStatus(rawT, todayStr);
    if (t.due_date >= todayStr && t.due_date <= targetDate) {
      if (t.type === 'income' && t.account_id === account.id && (t.status === 'planned' || t.status === 'overdue')) {
        balance += t.amount;
      } else if (t.type === 'expense' && t.account_id === account.id && (t.status === 'pending' || t.status === 'overdue')) {
        balance -= t.amount;
      } else if (t.type === 'transfer' && t.status === 'pending') {
        if (t.destination_account_id === account.id) {
          balance += t.amount;
        }
        if (t.account_id === account.id) {
          balance -= t.amount;
        }
      }
    }
  }

  return Math.round(balance * 100) / 100;
}

/**
 * Dynamic financial alerts alias
 */
export const generateFinancialAlerts = generateRealFinancialAlerts;

export function formatCurrency(amount: number, hide = false): string {
  if (hide) return '••••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date string (YYYY-MM-DD) to Brazilian date format (DD/MM/AAAA)
 * Avoids any timezone shifting by parsing components directly.
 */
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Calculate individual account balance
 * Balance = initial_balance + incomes received - expenses paid + transfers received - transfers sent
 */
export function calculateAccountBalance(account: Account, transactions: Transaction[]): number {
  let balance = account.initial_balance || 0;

  for (const t of transactions) {
    if (t.type === 'income' && t.account_id === account.id && t.status === 'received') {
      balance += t.amount;
    } else if (t.type === 'expense' && t.account_id === account.id && t.status === 'paid') {
      balance -= t.amount;
    } else if (t.type === 'transfer') {
      if (t.destination_account_id === account.id && t.status === 'completed') {
        balance += t.amount;
      }
      if (t.account_id === account.id && t.status === 'completed') {
        balance -= t.amount;
      }
    }
  }

  return Math.round(balance * 100) / 100;
}

/**
 * Update transaction statuses based on today's date
 * E.g., if pending expense is past due_date, it becomes overdue
 */
export function normalizeTransactionStatus(t: Transaction, todayStr = getTodayDateString()): Transaction {
  if (t.type === 'expense' && t.status === 'pending' && t.due_date < todayStr) {
    return { ...t, status: 'overdue' };
  }
  if (t.type === 'income' && t.status === 'planned' && t.due_date < todayStr) {
    return { ...t, status: 'overdue' };
  }
  return t;
}

/**
 * Calculate full financial summary
 */
export function calculateFinancialSummary(
  accounts: Account[],
  transactions: Transaction[],
  periodStart?: string,
  periodEnd?: string
): FinancialSummary {
  const todayStr = getTodayDateString();

  // 1. Total balance of all active accounts
  let totalBalance = 0;
  for (const acc of accounts) {
    if (acc.is_active) {
      totalBalance += calculateAccountBalance(acc, transactions);
    }
  }

  // 2. Period statistics
  let periodIncomes = 0;
  let periodExpenses = 0;
  let pendingExpenses = 0;
  let plannedIncomes = 0;
  let overdueExpenses = 0;
  let overdueIncomes = 0;
  let upcomingImmediateExpenses = 0;

  const fiveDaysAhead = addDays(todayStr, 5);

  for (const rawT of transactions) {
    const t = normalizeTransactionStatus(rawT, todayStr);
    const dateToCheck = t.payment_date || t.due_date;

    const inPeriod =
      (!periodStart || dateToCheck >= periodStart) &&
      (!periodEnd || dateToCheck <= periodEnd);

    if (t.type === 'income') {
      if (t.status === 'received' && inPeriod) {
        periodIncomes += t.amount;
      } else if (t.status === 'planned') {
        plannedIncomes += t.amount;
      } else if (t.status === 'overdue') {
        overdueIncomes += t.amount;
      }
    } else if (t.type === 'expense') {
      if (t.status === 'paid' && inPeriod) {
        periodExpenses += t.amount;
      } else if (t.status === 'pending') {
        pendingExpenses += t.amount;
        // If due within next 7 days, affects real available balance
        if (t.due_date >= todayStr && t.due_date <= addDays(todayStr, 7)) {
          upcomingImmediateExpenses += t.amount;
        }
      } else if (t.status === 'overdue') {
        overdueExpenses += t.amount;
        upcomingImmediateExpenses += t.amount; // overdue bills must be deducted from available cash
      }
    }
  }

  // Real available balance = current total balance - overdue and immediate upcoming pending bills
  const realAvailable = Math.max(0, totalBalance - upcomingImmediateExpenses);

  return {
    total_balance: Math.round(totalBalance * 100) / 100,
    real_available_balance: Math.round(realAvailable * 100) / 100,
    period_incomes: Math.round(periodIncomes * 100) / 100,
    period_expenses: Math.round(periodExpenses * 100) / 100,
    period_net_result: Math.round((periodIncomes - periodExpenses) * 100) / 100,
    pending_expenses: Math.round(pendingExpenses * 100) / 100,
    planned_incomes: Math.round(plannedIncomes * 100) / 100,
    overdue_expenses: Math.round(overdueExpenses * 100) / 100,
    overdue_incomes: Math.round(overdueIncomes * 100) / 100,
  };
}

/**
 * Generate multi-period financial forecasts: 7, 15, 30, 60, 90 days
 */
export function calculateForecasts(
  accounts: Account[],
  transactions: Transaction[]
): ForecastPeriodSummary[] {
  const todayStr = getTodayDateString();
  let currentBalance = 0;
  for (const acc of accounts) {
    if (acc.is_active) {
      currentBalance += calculateAccountBalance(acc, transactions);
    }
  }

  const periods = [
    { days: 7, label: '7 dias' },
    { days: 15, label: '15 dias' },
    { days: 30, label: '30 dias' },
    { days: 60, label: '60 dias' },
    { days: 90, label: '90 dias' },
  ];

  return periods.map((p) => {
    const targetDate = addDays(todayStr, p.days);
    let projectedIncomes = 0;
    let projectedExpenses = 0;

    for (const rawT of transactions) {
      const t = normalizeTransactionStatus(rawT, todayStr);
      // Scheduled within the window
      if (t.due_date >= todayStr && t.due_date <= targetDate) {
        if (t.type === 'income' && (t.status === 'planned' || t.status === 'overdue')) {
          projectedIncomes += t.amount;
        } else if (t.type === 'expense' && (t.status === 'pending' || t.status === 'overdue')) {
          projectedExpenses += t.amount;
        }
      }
    }

    const projectedFinal = currentBalance + projectedIncomes - projectedExpenses;

    return {
      days: p.days,
      label: p.label,
      starting_balance: currentBalance,
      projected_incomes: Math.round(projectedIncomes * 100) / 100,
      projected_expenses: Math.round(projectedExpenses * 100) / 100,
      projected_final_balance: Math.round(projectedFinal * 100) / 100,
      is_at_risk: projectedFinal < 0,
    };
  });
}

/**
 * Calculate dynamic financial alerts from real data
 */
export function generateRealFinancialAlerts(
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[]
): FinancialNotification[] {
  const alerts: FinancialNotification[] = [];
  const todayStr = getTodayDateString();
  const in5Days = addDays(todayStr, 5);

  // 1. Pending bills due within 5 days
  const billsDueSoon = transactions.filter(
    (t) => t.type === 'expense' && t.status === 'pending' && t.due_date >= todayStr && t.due_date <= in5Days
  );
  if (billsDueSoon.length > 0) {
    const totalDue = billsDueSoon.reduce((acc, curr) => acc + curr.amount, 0);
    alerts.push({
      id: `alert-due-soon-${todayStr}`,
      user_id: 'current',
      title: 'Contas vencendo em breve',
      message: `Você possui ${billsDueSoon.length} conta(s) no valor total de ${formatCurrency(totalDue)} vencendo nos próximos 5 dias.`,
      type: 'due_soon',
      read: false,
      created_at: todayStr,
    });
  }

  // 2. Overdue bills
  const overdueBills = transactions.filter(
    (t) => t.type === 'expense' && (t.status === 'overdue' || (t.status === 'pending' && t.due_date < todayStr))
  );
  if (overdueBills.length > 0) {
    const totalOverdue = overdueBills.reduce((acc, curr) => acc + curr.amount, 0);
    alerts.push({
      id: `alert-overdue-${todayStr}`,
      user_id: 'current',
      title: 'Contas vencidas',
      message: `Atenção: Existem ${overdueBills.length} conta(s) vencida(s) totalizando ${formatCurrency(totalOverdue)} aguardando pagamento.`,
      type: 'overdue',
      read: false,
      created_at: todayStr,
    });
  }

  // 3. Negative net result
  const summary = calculateFinancialSummary(accounts, transactions);
  if (summary.period_expenses > summary.period_incomes && summary.period_expenses > 0) {
    alerts.push({
      id: `alert-deficit-${todayStr}`,
      user_id: 'current',
      title: 'Atenção às despesas',
      message: `Suas despesas do período (${formatCurrency(summary.period_expenses)}) superaram suas receitas (${formatCurrency(summary.period_incomes)}).`,
      type: 'forecast_alert',
      read: false,
      created_at: todayStr,
    });
  }

  // 4. Budget warnings
  const currentMonth = todayStr.substring(0, 7); // YYYY-MM
  for (const b of budgets) {
    if (b.month === currentMonth && b.monthly_limit > 0) {
      // Calculate spent in this category this month
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category_id === b.category_id &&
            t.status === 'paid' &&
            t.due_date.startsWith(currentMonth)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const ratio = spent / b.monthly_limit;
      if (ratio >= 1.0) {
        alerts.push({
          id: `alert-budget-exceeded-${b.id}`,
          user_id: 'current',
          title: `Orçamento excedido (${b.category_name || 'Categoria'})`,
          message: `Você gastou ${formatCurrency(spent)} de um limite de ${formatCurrency(b.monthly_limit)} (100%+ atingido).`,
          type: 'budget_warning',
          read: false,
          created_at: todayStr,
        });
      } else if (ratio >= 0.85) {
        alerts.push({
          id: `alert-budget-warning-${b.id}`,
          user_id: 'current',
          title: `Orçamento próximo ao limite (${b.category_name || 'Categoria'})`,
          message: `Você já consumiu ${(ratio * 100).toFixed(0)}% do limite definido (${formatCurrency(spent)} de ${formatCurrency(b.monthly_limit)}).`,
          type: 'budget_warning',
          read: false,
          created_at: todayStr,
        });
      }
    }
  }

  return alerts;
}
