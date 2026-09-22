import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  ViewTab,
  Account,
  Transaction,
  Category,
  Budget,
  Goal,
  FinancialNotification,
} from './types';
import { DataService } from './services/dataService';
import {
  calculateFinancialSummary,
  calculateAccountBalance,
  generateFinancialAlerts,
} from './lib/financialMath';

// Layout & Common
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileMoreDrawer } from './components/layout/MobileMoreDrawer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { ConfirmModal } from './components/common/ConfirmModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Views
import { AuthScreen } from './components/auth/AuthScreen';
import { DashboardView } from './components/dashboard/DashboardView';
import { AccountsView } from './components/accounts/AccountsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { CalendarView } from './components/calendar/CalendarView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { GoalsView } from './components/goals/GoalsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { TransactionModal } from './components/transactions/TransactionModal';
import { AccountModal } from './components/accounts/AccountModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => DataService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Entities
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<FinancialNotification[]>([]);

  // User Preferences
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('finangency_hide_balance') === 'true';
  });

  // Modals & Drawers
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, message },
    ]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Toggle Privacy
  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      localStorage.setItem('finangency_hide_balance', String(next));
      return next;
    });
  };

  // Load User Data
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [accs, txs, cats, bdgs, gls] = await Promise.all([
        DataService.getAccounts(user.id),
        DataService.getTransactions(user.id),
        DataService.getCategories(user.id),
        DataService.getBudgets(user.id),
        DataService.getGoals(user.id),
      ]);

      setAccounts(accs);
      setTransactions(txs);
      setCategories(cats);
      setBudgets(bdgs);
      setGoals(gls);

      // Generate notifications from real data
      const alerts = generateFinancialAlerts(accs, txs, bdgs);
      setNotifications(alerts);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

  // Auth Handlers
  const handleAuthSuccess = (loggedUser: UserProfile) => {
    setUser(loggedUser);
    addToast('success', `Bem-vindo(a) de volta, ${loggedUser.name}!`);
  };

  const handleLogout = async () => {
    await DataService.signOut();
    setUser(null);
    setAccounts([]);
    setTransactions([]);
    setCategories([]);
    setBudgets([]);
    setGoals([]);
    addToast('info', 'Sessão encerrada com segurança.');
  };

  // Transaction Operations
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    options?: { installments?: number }
  ) => {
    if (!user) return;

    if (editingTransaction) {
      const updated = await DataService.updateTransaction(editingTransaction.id, txData);
      setTransactions((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...updated, account: accounts.find(a => a.id === updated.account_id), category: categories.find(c => c.id === updated.category_id) } : t))
      );
      addToast('success', 'Movimentação atualizada com sucesso!');
    } else {
      const created = await DataService.createTransaction(user.id, txData, options);
      // reload data to include relations correctly
      await loadData();
      addToast(
        'success',
        options?.installments && options.installments > 1
          ? `${options.installments} parcelas geradas com sucesso!`
          : 'Movimentação adicionada com sucesso!'
      );
    }
  };

  const handleToggleStatus = async (tx: Transaction) => {
    let nextStatus = tx.status;
    if (tx.type === 'expense') {
      nextStatus = tx.status === 'paid' ? 'pending' : 'paid';
    } else if (tx.type === 'income') {
      nextStatus = tx.status === 'received' ? 'planned' : 'received';
    }

    const updated = await DataService.updateTransaction(tx.id, {
      status: nextStatus,
      payment_date: nextStatus === 'paid' || nextStatus === 'received' ? new Date().toISOString().split('T')[0] : undefined,
    });

    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, status: nextStatus } : t))
    );

    addToast(
      'success',
      nextStatus === 'paid' || nextStatus === 'received'
        ? 'Marcado como quitado!'
        : 'Status alterado para pendente.'
    );
  };

  const handleDeleteTransaction = (tx: Transaction) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir movimentação?',
      message: `Tem certeza que deseja excluir "${tx.description}"? Essa ação não poderá ser desfeita.`,
      confirmLabel: 'Sim, excluir',
      onConfirm: async () => {
        await DataService.deleteTransaction(tx.id);
        setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        addToast('info', 'Movimentação removida.');
      },
    });
  };

  // Account Operations
  const handleSaveAccount = async (
    accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) return;

    if (editingAccount) {
      const updated = await DataService.updateAccount(editingAccount.id, accountData);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      addToast('success', 'Conta financeira atualizada!');
    } else {
      const created = await DataService.createAccount(user.id, accountData);
      setAccounts((prev) => [...prev, created]);
      addToast('success', 'Nova conta financeira criada com sucesso!');
    }
  };

  const handleDeleteAccount = (acc: Account) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir conta financeira?',
      message: `Tem certeza que deseja remover a conta "${acc.name}"? As movimentações vinculadas podem ser impactadas.`,
      confirmLabel: 'Excluir Conta',
      onConfirm: async () => {
        await DataService.deleteAccount(acc.id);
        setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        addToast('info', 'Conta excluída.');
      },
    });
  };

  // Budget Operations
  const handleSaveBudget = async (
    budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) return;
    const existing = budgets.find((b) => b.category_id === budgetData.category_id);
    if (existing) {
      const updated = await DataService.updateBudget(existing.id, budgetData);
      setBudgets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      addToast('success', 'Orçamento atualizado!');
    } else {
      const created = await DataService.createBudget(user.id, budgetData);
      setBudgets((prev) => [...prev, created]);
      addToast('success', 'Limite orçamentário configurado!');
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir orçamento?',
      message: 'Deseja remover este teto de gastos orçamentário?',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        await DataService.deleteBudget(budget.id);
        setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        addToast('info', 'Orçamento removido.');
      },
    });
  };

  // Goal Operations
  const handleSaveGoal = async (
    goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) return;
    const created = await DataService.createGoal(user.id, goalData);
    setGoals((prev) => [...prev, created]);
    addToast('success', 'Meta financeira criada com sucesso!');
  };

  const handleUpdateGoalProgress = async (goalId: string, additionalAmount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newAmount = Math.round((goal.current_amount + additionalAmount) * 100) / 100;
    const updated = await DataService.updateGoal(goalId, { current_amount: newAmount });
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    addToast('success', 'Aporte registrado com sucesso na meta!');
  };

  const handleDeleteGoal = (goal: Goal) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir meta financeira?',
      message: `Tem certeza que deseja excluir a meta "${goal.title}"?`,
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        await DataService.deleteGoal(goal.id);
        setGoals((prev) => prev.filter((g) => g.id !== goal.id));
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        addToast('info', 'Meta removida.');
      },
    });
  };

  // Notifications
  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'Todas as notificações foram marcadas como lidas.');
  };

  // Custom Category
  const handleAddCategory = async (cat: Omit<Category, 'id' | 'created_at'>) => {
    if (!user) return;
    const created = await DataService.createCategory(user.id, cat);
    setCategories((prev) => [...prev, created]);
  };

  // Clear all data
  const handleClearAllData = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Limpar todos os dados locais?',
      message: 'Todos os registros locais de contas, transações, orçamentos e metas serão excluídos permanentemente. Confirma?',
      confirmLabel: 'Limpar tudo',
      onConfirm: async () => {
        if (user) {
          localStorage.removeItem(`finangency_accounts_${user.id}`);
          localStorage.removeItem(`finangency_txs_${user.id}`);
          localStorage.removeItem(`finangency_budgets_${user.id}`);
          localStorage.removeItem(`finangency_goals_${user.id}`);
          setAccounts([]);
          setTransactions([]);
          setBudgets([]);
          setGoals([]);
        }
        setConfirmModal((m) => ({ ...m, isOpen: false }));
        addToast('info', 'Dados limpos com sucesso.');
      },
    });
  };

  // If user is not authenticated, show AuthScreen
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <OfflineIndicator />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Summary for header & balance
  const summary = calculateFinancialSummary(accounts, transactions);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <OfflineIndicator />

      {/* Global Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((m) => ({ ...m, isOpen: false }))}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        goals={goals}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      {/* Transaction Add/Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        accounts={accounts}
        categories={categories}
        editingTransaction={editingTransaction}
        onSave={handleSaveTransaction}
        onOpenNewAccount={() => {
          setIsAccountModalOpen(true);
        }}
      />

      {/* Account Add/Edit Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
        onSave={handleSaveAccount}
      />

      {/* Mobile More Drawer */}
      <MobileMoreDrawer
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentTab={currentTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* App Layout Container */}
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          user={user}
          onLogout={handleLogout}
          realAvailableBalance={summary.real_available_balance}
          hideBalance={hideBalance}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Header */}
          <Header
            user={user}
            hideBalance={hideBalance}
            onToggleHideBalance={toggleHideBalance}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNewTransaction={() => {
              setEditingTransaction(null);
              setIsTxModalOpen(true);
            }}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            onOpenMobileMenu={() => setIsMobileMoreOpen(true)}
          />

          {/* View Container with Scroll */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
            {currentTab === 'dashboard' && (
              <DashboardView
                user={user}
                accounts={accounts}
                transactions={transactions}
                budgets={budgets}
                hideBalance={hideBalance}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenNewTransaction={() => {
                  setEditingTransaction(null);
                  setIsTxModalOpen(true);
                }}
                onOpenNewAccount={() => {
                  setEditingAccount(null);
                  setIsAccountModalOpen(true);
                }}
                onMarkExpensePaid={async (id) => {
                  const tx = transactions.find((t) => t.id === id);
                  if (tx) await handleToggleStatus(tx);
                }}
              />
            )}

            {currentTab === 'accounts' && (
              <AccountsView
                accounts={accounts}
                transactions={transactions}
                hideBalance={hideBalance}
                onOpenNewAccount={() => {
                  setEditingAccount(null);
                  setIsAccountModalOpen(true);
                }}
                onEditAccount={(acc) => {
                  setEditingAccount(acc);
                  setIsAccountModalOpen(true);
                }}
                onDeleteAccount={handleDeleteAccount}
                onOpenNewTransaction={() => {
                  setEditingTransaction(null);
                  setIsTxModalOpen(true);
                }}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                accounts={accounts}
                categories={categories}
                hideBalance={hideBalance}
                onOpenNewTransaction={() => {
                  setEditingTransaction(null);
                  setIsTxModalOpen(true);
                }}
                onEditTransaction={(tx) => {
                  setEditingTransaction(tx);
                  setIsTxModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onToggleStatus={handleToggleStatus}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                transactions={transactions}
                accounts={accounts}
                hideBalance={hideBalance}
                onOpenNewTransaction={() => {
                  setEditingTransaction(null);
                  setIsTxModalOpen(true);
                }}
                onToggleStatus={handleToggleStatus}
              />
            )}

            {currentTab === 'budgets' && (
              <BudgetsView
                budgets={budgets}
                categories={categories}
                transactions={transactions}
                hideBalance={hideBalance}
                onSaveBudget={handleSaveBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {currentTab === 'goals' && (
              <GoalsView
                goals={goals}
                hideBalance={hideBalance}
                onSaveGoal={handleSaveGoal}
                onUpdateGoalProgress={handleUpdateGoalProgress}
                onDeleteGoal={handleDeleteGoal}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                transactions={transactions}
                accounts={accounts}
                categories={categories}
                hideBalance={hideBalance}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                user={user}
                categories={categories}
                onAddCategory={handleAddCategory}
                onRefreshData={loadData}
                onShowToast={addToast}
                onClearAllData={handleClearAllData}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsTxModalOpen(true);
        }}
        onOpenMoreMenu={() => setIsMobileMoreOpen(true)}
      />
    </div>
  );
}
