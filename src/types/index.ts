export type AccountType =
  | 'checking'      // Conta corrente
  | 'savings'       // Poupança
  | 'digital'       // Conta digital
  | 'wallet'        // Carteira
  | 'cash'          // Dinheiro
  | 'investment'    // Investimento
  | 'other';        // Outro

export type TransactionType = 'income' | 'expense' | 'transfer';

export type ExpenseStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type IncomeStatus = 'planned' | 'received' | 'overdue' | 'cancelled';
export type TransactionStatus = ExpenseStatus | IncomeStatus | 'completed';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  theme: 'dark' | 'light' | 'system';
  hide_balances_by_default: boolean;
  currency: string;
  reminder_days: number[]; // e.g. [7, 3, 1, 0]
  reminder_time: string; // e.g. "08:00"
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  institution?: string;
  initial_balance: number; // in cents or currency unit
  color: string;
  icon: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed property
  current_balance?: number;
}

export interface Category {
  id: string;
  user_id: string | null; // null for system defaults
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_custom: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  description: string;
  amount: number; // always positive in currency units (R$ 10.50)
  category_id?: string;
  category?: Category;
  account_id: string;
  account_name?: string;
  destination_account_id?: string;
  destination_account_name?: string;
  due_date: string; // YYYY-MM-DD
  payment_date?: string; // YYYY-MM-DD
  purchase_date?: string; // YYYY-MM-DD
  status: TransactionStatus;
  payment_method?: string;
  recurrence_type?: RecurrenceFrequency;
  recurrence_id?: string;
  installment_group_id?: string;
  installment_number?: number;
  installment_total?: number;
  reminder_days_before?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name?: string;
  month: string; // YYYY-MM
  monthly_limit: number;
  amount_limit?: number;
  alert_threshold_percent?: number;
  period?: 'monthly' | 'weekly' | 'yearly';
  created_at: string;
  updated_at: string;
  // Computed properties
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // YYYY-MM-DD
  description?: string;
  color: string;
  icon?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  date: string;
  notes?: string;
  account_id?: string;
  created_at: string;
}

export interface FinancialNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'due_soon' | 'overdue' | 'budget_warning' | 'goal_reached' | 'forecast_alert' | 'system';
  read: boolean;
  created_at: string;
  related_id?: string;
}

export interface FinancialSummary {
  total_balance: number;
  real_available_balance: number;
  period_incomes: number;
  period_expenses: number;
  period_net_result: number;
  pending_expenses: number;
  planned_incomes: number;
  overdue_expenses: number;
  overdue_incomes: number;
}

export interface ForecastPeriodSummary {
  days: number;
  label: string;
  starting_balance: number;
  projected_incomes: number;
  projected_expenses: number;
  projected_final_balance: number;
  is_at_risk: boolean;
}

export type ViewTab =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'calendar'
  | 'budgets'
  | 'goals'
  | 'reports'
  | 'settings';
