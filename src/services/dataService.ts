import {
  Account,
  Category,
  Transaction,
  Budget,
  Goal,
  GoalContribution,
  FinancialNotification,
  UserProfile,
  TransactionType,
  AccountType,
} from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../lib/constants';
import { addDays, getTodayDateString } from '../lib/financialMath';

// Local storage keys per user
const STORAGE_PREFIX = 'finangency_';

function getStorageKey(userEmail: string, entity: string): string {
  const safeEmail = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${STORAGE_PREFIX}${safeEmail}_${entity}`;
}

export class DataService {
  private static currentUser: UserProfile | null = null;

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------

  static async initSession(): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          this.currentUser = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatar_url: profile.avatar_url,
            theme: profile.theme || 'dark',
            hide_balances_by_default: profile.hide_balances_by_default || false,
            currency: profile.currency || 'BRL',
            reminder_days: profile.reminder_days || [7, 3, 1, 0],
            reminder_time: profile.reminder_time || '08:00',
            created_at: profile.created_at,
          };
          return this.currentUser;
        }
      }
    }

    // Check local session
    const localSession = localStorage.getItem('finangency_session');
    if (localSession) {
      try {
        this.currentUser = JSON.parse(localSession);
        return this.currentUser;
      } catch {
        localStorage.removeItem('finangency_session');
      }
    }

    return null;
  }

  static getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  static async signUp(name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { name },
        },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        this.currentUser = {
          id: data.user.id,
          name,
          email,
          theme: 'dark',
          hide_balances_by_default: false,
          currency: 'BRL',
          reminder_days: [7, 3, 1, 0],
          reminder_time: '08:00',
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('finangency_session', JSON.stringify(this.currentUser));
        return { success: true };
      }
    }

    // Local authentication (fully functional when Supabase is not yet connected)
    const usersStore = JSON.parse(localStorage.getItem('finangency_users') || '{}');
    if (usersStore[email.toLowerCase()]) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }

    const newUser: UserProfile = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      name,
      email: email.toLowerCase(),
      theme: 'dark',
      hide_balances_by_default: false,
      currency: 'BRL',
      reminder_days: [7, 3, 1, 0],
      reminder_time: '08:00',
      created_at: new Date().toISOString(),
    };

    usersStore[email.toLowerCase()] = {
      profile: newUser,
      password: pass, // In local mode
    };
    localStorage.setItem('finangency_users', JSON.stringify(usersStore));

    this.currentUser = newUser;
    localStorage.setItem('finangency_session', JSON.stringify(newUser));

    return { success: true };
  }

  static async signIn(email: string, pass: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        this.currentUser = {
          id: data.user.id,
          name: profile?.name || data.user.user_metadata?.name || email.split('@')[0],
          email: data.user.email || email,
          theme: profile?.theme || 'dark',
          hide_balances_by_default: profile?.hide_balances_by_default || false,
          currency: profile?.currency || 'BRL',
          reminder_days: profile?.reminder_days || [7, 3, 1, 0],
          reminder_time: profile?.reminder_time || '08:00',
          created_at: profile?.created_at || new Date().toISOString(),
        };
        localStorage.setItem('finangency_session', JSON.stringify(this.currentUser));
        return { success: true };
      }
    }

    // Local authentication
    const usersStore = JSON.parse(localStorage.getItem('finangency_users') || '{}');
    const existing = usersStore[email.toLowerCase()];
    if (!existing) {
      return { success: false, error: 'Usuário não encontrado. Verifique seu e-mail ou cadastre-se.' };
    }
    if (existing.password !== pass) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    this.currentUser = existing.profile;
    localStorage.setItem('finangency_session', JSON.stringify(this.currentUser));
    return { success: true };
  }

  static async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    this.currentUser = null;
    localStorage.removeItem('finangency_session');
  }

  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem('finangency_session', JSON.stringify(this.currentUser));

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('profiles').update(updates).eq('id', this.currentUser.id);
    } else {
      const usersStore = JSON.parse(localStorage.getItem('finangency_users') || '{}');
      if (usersStore[this.currentUser.email.toLowerCase()]) {
        usersStore[this.currentUser.email.toLowerCase()].profile = this.currentUser;
        localStorage.setItem('finangency_users', JSON.stringify(usersStore));
      }
    }

    return this.currentUser;
  }

  // -------------------------------------------------------------
  // ACCOUNTS (Strictly 0 accounts for new users!)
  // -------------------------------------------------------------

  static async getAccounts(_userId?: string): Promise<Account[]> {
    if (!this.currentUser) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: true });
      if (!error && data) return data as Account[];
    }

    const key = getStorageKey(this.currentUser.email, 'accounts');
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  static async addAccount(accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Account> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const newAccount: Account = {
      ...accountData,
      id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: this.currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('accounts').insert(newAccount).select().single();
      if (!error && data) return data as Account;
    }

    const accounts = await this.getAccounts();
    accounts.push(newAccount);
    const key = getStorageKey(this.currentUser.email, 'accounts');
    localStorage.setItem(key, JSON.stringify(accounts));
    return newAccount;
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('accounts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) return data as Account;
    }

    const accounts = await this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Conta não encontrada');

    accounts[idx] = { ...accounts[idx], ...updates, updated_at: new Date().toISOString() };
    const key = getStorageKey(this.currentUser.email, 'accounts');
    localStorage.setItem(key, JSON.stringify(accounts));
    return accounts[idx];
  }

  static async deleteAccount(id: string): Promise<void> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('accounts').delete().eq('id', id);
    }

    const accounts = await this.getAccounts();
    const filtered = accounts.filter((a) => a.id !== id);
    const key = getStorageKey(this.currentUser.email, 'accounts');
    localStorage.setItem(key, JSON.stringify(filtered));

    // Also remove associated transactions
    const transactions = await this.getTransactions();
    const filteredTx = transactions.filter((t) => t.account_id !== id && t.destination_account_id !== id);
    const txKey = getStorageKey(this.currentUser.email, 'transactions');
    localStorage.setItem(txKey, JSON.stringify(filteredTx));
  }

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------

  static async getCategories(_userId?: string): Promise<Category[]> {
    if (!this.currentUser) return [];

    const defaultCats: Category[] = [
      ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, user_id: null })),
      ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, user_id: null })),
    ];

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${this.currentUser.id}`);
      if (data && data.length > 0) return data as Category[];
    }

    const key = getStorageKey(this.currentUser.email, 'custom_categories');
    const stored = localStorage.getItem(key);
    const customCats: Category[] = stored ? JSON.parse(stored) : [];

    return [...defaultCats, ...customCats];
  }

  static async addCustomCategory(cat: Omit<Category, 'id' | 'user_id' | 'is_custom'>): Promise<Category> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const newCat: Category = {
      ...cat,
      id: 'cat_custom_' + Date.now(),
      user_id: this.currentUser.id,
      is_custom: true,
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('categories').insert(newCat);
    }

    const key = getStorageKey(this.currentUser.email, 'custom_categories');
    const stored = localStorage.getItem(key);
    const customCats: Category[] = stored ? JSON.parse(stored) : [];
    customCats.push(newCat);
    localStorage.setItem(key, JSON.stringify(customCats));

    return newCat;
  }

  // -------------------------------------------------------------
  // TRANSACTIONS (Strictly 0 transactions for new users!)
  // -------------------------------------------------------------

  static async getTransactions(_userId?: string): Promise<Transaction[]> {
    if (!this.currentUser) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('due_date', { ascending: false });
      if (data) return data as Transaction[];
    }

    const key = getStorageKey(this.currentUser.email, 'transactions');
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  static async addTransaction(
    txData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    options?: {
      installments?: number; // e.g. 12
      installmentIntervalMonths?: number;
    }
  ): Promise<Transaction[]> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const createdTransactions: Transaction[] = [];
    const now = new Date().toISOString();

    // Check if installments requested
    if (options?.installments && options.installments > 1) {
      const groupId = 'inst_grp_' + Date.now();
      const count = options.installments;
      const installmentAmount = Math.round((txData.amount / count) * 100) / 100;
      // Adjust first installment for any rounding cent difference
      const totalCalculated = installmentAmount * count;
      const diff = Math.round((txData.amount - totalCalculated) * 100) / 100;

      let currentDate = txData.due_date; // YYYY-MM-DD

      for (let i = 1; i <= count; i++) {
        const itemAmount = i === 1 ? installmentAmount + diff : installmentAmount;
        const item: Transaction = {
          ...txData,
          id: 'tx_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 5),
          user_id: this.currentUser.id,
          description: `${txData.description} (${i}/${count})`,
          amount: Math.round(itemAmount * 100) / 100,
          due_date: currentDate,
          installment_group_id: groupId,
          installment_number: i,
          installment_total: count,
          created_at: now,
          updated_at: now,
        };
        createdTransactions.push(item);

        // Advance by 1 month for next installment
        const parts = currentDate.split('-');
        let year = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10); // 1-12
        const day = parts[2];
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
        currentDate = `${year}-${String(month).padStart(2, '0')}-${day}`;
      }
    } else {
      const singleTx: Transaction = {
        ...txData,
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: this.currentUser.id,
        created_at: now,
        updated_at: now,
      };
      createdTransactions.push(singleTx);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('transactions').insert(createdTransactions);
    }

    const allTx = await this.getTransactions();
    allTx.unshift(...createdTransactions);
    const key = getStorageKey(this.currentUser.email, 'transactions');
    localStorage.setItem(key, JSON.stringify(allTx));

    return createdTransactions;
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('transactions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (data) return data as Transaction;
    }

    const allTx = await this.getTransactions();
    const idx = allTx.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Movimentação não encontrada');

    allTx[idx] = { ...allTx[idx], ...updates, updated_at: new Date().toISOString() };
    const key = getStorageKey(this.currentUser.email, 'transactions');
    localStorage.setItem(key, JSON.stringify(allTx));
    return allTx[idx];
  }

  static async deleteTransaction(id: string): Promise<void> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('transactions').delete().eq('id', id);
    }

    const allTx = await this.getTransactions();
    const filtered = allTx.filter((t) => t.id !== id);
    const key = getStorageKey(this.currentUser.email, 'transactions');
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // Actions for Expenses
  static async markExpensePaid(id: string, paymentDate?: string, accountId?: string, actualAmount?: number): Promise<Transaction> {
    const today = getTodayDateString();
    const updates: Partial<Transaction> = {
      status: 'paid',
      payment_date: paymentDate || today,
    };
    if (accountId) updates.account_id = accountId;
    if (actualAmount !== undefined && actualAmount > 0) updates.amount = actualAmount;

    return this.updateTransaction(id, updates);
  }

  static async undoExpensePaid(id: string): Promise<Transaction> {
    return this.updateTransaction(id, {
      status: 'pending',
      payment_date: undefined,
    });
  }

  // Actions for Incomes
  static async markIncomeReceived(id: string, receivedDate?: string, accountId?: string, actualAmount?: number): Promise<Transaction> {
    const today = getTodayDateString();
    const updates: Partial<Transaction> = {
      status: 'received',
      payment_date: receivedDate || today,
    };
    if (accountId) updates.account_id = accountId;
    if (actualAmount !== undefined && actualAmount > 0) updates.amount = actualAmount;

    return this.updateTransaction(id, updates);
  }

  static async undoIncomeReceived(id: string): Promise<Transaction> {
    return this.updateTransaction(id, {
      status: 'planned',
      payment_date: undefined,
    });
  }

  // -------------------------------------------------------------
  // BUDGETS
  // -------------------------------------------------------------

  static async getBudgets(month?: string): Promise<Budget[]> {
    if (!this.currentUser) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('budgets').select('*').eq('user_id', this.currentUser.id);
      if (month) query = query.eq('month', month);
      const { data } = await query;
      if (data) return data as Budget[];
    }

    const key = getStorageKey(this.currentUser.email, 'budgets');
    const stored = localStorage.getItem(key);
    const budgets: Budget[] = stored ? JSON.parse(stored) : [];
    return month ? budgets.filter((b) => b.month === month) : budgets;
  }

  static async saveBudget(categoryId: string, month: string, monthlyLimit: number): Promise<Budget> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const budgets = await this.getBudgets();
    const existingIdx = budgets.findIndex((b) => b.category_id === categoryId && b.month === month);

    const now = new Date().toISOString();
    let budget: Budget;

    if (existingIdx >= 0) {
      budget = { ...budgets[existingIdx], monthly_limit: monthlyLimit, updated_at: now };
      budgets[existingIdx] = budget;
    } else {
      budget = {
        id: 'bdg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        user_id: this.currentUser.id,
        category_id: categoryId,
        month,
        monthly_limit: monthlyLimit,
        created_at: now,
        updated_at: now,
      };
      budgets.push(budget);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('budgets').upsert(budget);
    }

    const key = getStorageKey(this.currentUser.email, 'budgets');
    localStorage.setItem(key, JSON.stringify(budgets));
    return budget;
  }

  static async deleteBudget(id: string): Promise<void> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('budgets').delete().eq('id', id);
    }

    const budgets = await this.getBudgets();
    const filtered = budgets.filter((b) => b.id !== id);
    const key = getStorageKey(this.currentUser.email, 'budgets');
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  // -------------------------------------------------------------
  // GOALS & CONTRIBUTIONS
  // -------------------------------------------------------------

  static async getGoals(_userId?: string): Promise<Goal[]> {
    if (!this.currentUser) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });
      if (data) return data as Goal[];
    }

    const key = getStorageKey(this.currentUser.email, 'goals');
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  static async addGoal(goalData: Omit<Goal, 'id' | 'user_id' | 'current_amount' | 'status' | 'created_at' | 'updated_at'>): Promise<Goal> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const newGoal: Goal = {
      ...goalData,
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: this.currentUser.id,
      current_amount: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('financial_goals').insert(newGoal);
    }

    const goals = await this.getGoals();
    goals.push(newGoal);
    const key = getStorageKey(this.currentUser.email, 'goals');
    localStorage.setItem(key, JSON.stringify(goals));
    return newGoal;
  }

  static async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('financial_goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    const goals = await this.getGoals();
    const idx = goals.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Meta não encontrada');

    goals[idx] = { ...goals[idx], ...updates, updated_at: new Date().toISOString() };
    const key = getStorageKey(this.currentUser.email, 'goals');
    localStorage.setItem(key, JSON.stringify(goals));
    return goals[idx];
  }

  static async deleteGoal(id: string): Promise<void> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('financial_goals').delete().eq('id', id);
    }

    const goals = await this.getGoals();
    const filtered = goals.filter((g) => g.id !== id);
    const key = getStorageKey(this.currentUser.email, 'goals');
    localStorage.setItem(key, JSON.stringify(filtered));
  }

  static async getGoalContributions(goalId: string): Promise<GoalContribution[]> {
    if (!this.currentUser) return [];

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('goal_id', goalId)
        .order('date', { ascending: false });
      if (data) return data as GoalContribution[];
    }

    const key = getStorageKey(this.currentUser.email, `goal_contribs_${goalId}`);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  static async addGoalContribution(
    goalId: string,
    amount: number,
    date = getTodayDateString(),
    notes?: string,
    accountId?: string
  ): Promise<GoalContribution> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const contribution: GoalContribution = {
      id: 'gc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      goal_id: goalId,
      user_id: this.currentUser.id,
      amount,
      date,
      notes,
      account_id: accountId,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('goal_contributions').insert(contribution);
    }

    // Save contribution
    const key = getStorageKey(this.currentUser.email, `goal_contribs_${goalId}`);
    const contribs = await this.getGoalContributions(goalId);
    contribs.unshift(contribution);
    localStorage.setItem(key, JSON.stringify(contribs));

    // Update goal accumulated amount
    const goals = await this.getGoals();
    const gIdx = goals.findIndex((g) => g.id === goalId);
    if (gIdx >= 0) {
      const newAmount = Math.round((goals[gIdx].current_amount + amount) * 100) / 100;
      const newStatus = newAmount >= goals[gIdx].target_amount ? 'completed' : 'active';
      await this.updateGoal(goalId, {
        current_amount: newAmount,
        status: newStatus,
      });
    }

    return contribution;
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------

  static async getNotifications(): Promise<FinancialNotification[]> {
    if (!this.currentUser) return [];

    const key = getStorageKey(this.currentUser.email, 'read_notifications');
    const readIds: string[] = JSON.parse(localStorage.getItem(key) || '[]');

    // Dynamic alerts based on real accounts and transactions
    const accounts = await this.getAccounts();
    const transactions = await this.getTransactions();
    const budgets = await this.getBudgets();

    const { generateRealFinancialAlerts } = await import('../lib/financialMath');
    const alerts = generateRealFinancialAlerts(accounts, transactions, budgets);

    return alerts.map((a) => ({
      ...a,
      read: readIds.includes(a.id),
    }));
  }

  static async markNotificationRead(id: string): Promise<void> {
    if (!this.currentUser) return;
    const key = getStorageKey(this.currentUser.email, 'read_notifications');
    const readIds: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(key, JSON.stringify(readIds));
    }
  }

  static async markAllNotificationsRead(): Promise<void> {
    if (!this.currentUser) return;
    const notifs = await this.getNotifications();
    const readIds = notifs.map((n) => n.id);
    const key = getStorageKey(this.currentUser.email, 'read_notifications');
    localStorage.setItem(key, JSON.stringify(readIds));
  }

  // -------------------------------------------------------------
  // DATA BACKUP & EXPORT
  // -------------------------------------------------------------

  static async exportUserData(): Promise<string> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const accounts = await this.getAccounts();
    const transactions = await this.getTransactions();
    const budgets = await this.getBudgets();
    const goals = await this.getGoals();
    const customCats = (await this.getCategories()).filter((c) => c.is_custom);

    const backup = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      user: this.currentUser,
      accounts,
      transactions,
      budgets,
      goals,
      custom_categories: customCats,
    };

    return JSON.stringify(backup, null, 2);
  }

  static async exportAllData(): Promise<any> {
    const jsonStr = await this.exportUserData();
    return JSON.parse(jsonStr);
  }

  static async importData(data: any): Promise<{ success: boolean; error?: string }> {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    return this.importUserData(jsonStr);
  }

  // Convenience aliases and adapters
  static async createAccount(
    arg1: string | Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    arg2?: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Account> {
    const data = typeof arg1 === 'string' ? arg2! : arg1;
    return this.addAccount(data);
  }

  static async createTransaction(
    arg1: string | Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    arg2?: any,
    arg3?: any
  ): Promise<Transaction> {
    const data = typeof arg1 === 'string' ? arg2 : arg1;
    const options = typeof arg1 === 'string' ? arg3 : arg2;
    const list = await this.addTransaction(data, options);
    return list[0];
  }

  static async createCategory(
    arg1: string | Omit<Category, 'id' | 'user_id' | 'is_custom'>,
    arg2?: Omit<Category, 'id' | 'user_id' | 'is_custom'>
  ): Promise<Category> {
    const data = typeof arg1 === 'string' ? arg2! : arg1;
    return this.addCustomCategory(data);
  }

  static async createBudget(
    arg1: string | any,
    arg2?: any
  ): Promise<Budget> {
    const data = typeof arg1 === 'string' ? arg2! : arg1;
    const month = data.month || new Date().toISOString().substring(0, 7);
    const limit = data.monthly_limit || data.amount_limit || 0;
    return this.saveBudget(data.category_id, month, limit);
  }

  static async updateBudget(
    id: string,
    updates: Partial<Budget>
  ): Promise<Budget> {
    const budgets = await this.getBudgets();
    const idx = budgets.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Orçamento não encontrado');
    budgets[idx] = { ...budgets[idx], ...updates, updated_at: new Date().toISOString() };
    if (updates.monthly_limit || updates.amount_limit) {
      budgets[idx].monthly_limit = updates.monthly_limit || updates.amount_limit || budgets[idx].monthly_limit;
    }
    const key = getStorageKey(this.currentUser!.email, 'budgets');
    localStorage.setItem(key, JSON.stringify(budgets));
    return budgets[idx];
  }

  static async createGoal(
    arg1: string | Omit<Goal, 'id' | 'user_id' | 'current_amount' | 'status' | 'created_at' | 'updated_at'>,
    arg2?: Omit<Goal, 'id' | 'user_id' | 'current_amount' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<Goal> {
    const data = typeof arg1 === 'string' ? arg2! : arg1;
    return this.addGoal(data);
  }


  static async importUserData(jsonString: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    try {
      const data = JSON.parse(jsonString);
      if (!data.accounts || !data.transactions) {
        return { success: false, error: 'Arquivo de backup inválido.' };
      }

      const email = this.currentUser.email;
      localStorage.setItem(getStorageKey(email, 'accounts'), JSON.stringify(data.accounts || []));
      localStorage.setItem(getStorageKey(email, 'transactions'), JSON.stringify(data.transactions || []));
      localStorage.setItem(getStorageKey(email, 'budgets'), JSON.stringify(data.budgets || []));
      localStorage.setItem(getStorageKey(email, 'goals'), JSON.stringify(data.goals || []));
      if (data.custom_categories) {
        localStorage.setItem(getStorageKey(email, 'custom_categories'), JSON.stringify(data.custom_categories));
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao importar arquivo.' };
    }
  }
}
