import { Category, AccountType } from '../types';

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'user_id'>[] = [
  { id: 'cat-inc-1', name: 'Salário', type: 'income', icon: 'Briefcase', color: '#10b981', is_custom: false },
  { id: 'cat-inc-2', name: 'Venda', type: 'income', icon: 'ShoppingBag', color: '#34d399', is_custom: false },
  { id: 'cat-inc-3', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#06b6d4', is_custom: false },
  { id: 'cat-inc-4', name: 'Comissão', type: 'income', icon: 'Percent', color: '#3b82f6', is_custom: false },
  { id: 'cat-inc-5', name: 'PIX', type: 'income', icon: 'Zap', color: '#8b5cf6', is_custom: false },
  { id: 'cat-inc-6', name: 'Investimentos', type: 'income', icon: 'TrendingUp', color: '#10b981', is_custom: false },
  { id: 'cat-inc-7', name: 'Rendimentos', type: 'income', icon: 'Coins', color: '#14b8a6', is_custom: false },
  { id: 'cat-inc-8', name: 'Outros', type: 'income', icon: 'PlusCircle', color: '#64748b', is_custom: false },
];

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'user_id'>[] = [
  { id: 'cat-exp-1', name: 'Moradia', type: 'expense', icon: 'Home', color: '#f43f5e', is_custom: false },
  { id: 'cat-exp-2', name: 'Alimentação', type: 'expense', icon: 'Utensils', color: '#fb923c', is_custom: false },
  { id: 'cat-exp-3', name: 'Transporte', type: 'expense', icon: 'Car', color: '#f59e0b', is_custom: false },
  { id: 'cat-exp-4', name: 'Saúde', type: 'expense', icon: 'HeartPulse', color: '#ef4444', is_custom: false },
  { id: 'cat-exp-5', name: 'Educação', type: 'expense', icon: 'GraduationCap', color: '#8b5cf6', is_custom: false },
  { id: 'cat-exp-6', name: 'Lazer', type: 'expense', icon: 'Gamepad2', color: '#ec4899', is_custom: false },
  { id: 'cat-exp-7', name: 'Compras', type: 'expense', icon: 'ShoppingCart', color: '#d946ef', is_custom: false },
  { id: 'cat-exp-8', name: 'Assinaturas', type: 'expense', icon: 'Film', color: '#6366f1', is_custom: false },
  { id: 'cat-exp-9', name: 'Internet', type: 'expense', icon: 'Wifi', color: '#0ea5e9', is_custom: false },
  { id: 'cat-exp-10', name: 'Energia', type: 'expense', icon: 'Lightbulb', color: '#eab308', is_custom: false },
  { id: 'cat-exp-11', name: 'Água', type: 'expense', icon: 'Droplet', color: '#06b6d4', is_custom: false },
  { id: 'cat-exp-12', name: 'Telefone', type: 'expense', icon: 'Phone', color: '#14b8a6', is_custom: false },
  { id: 'cat-exp-13', name: 'Impostos', type: 'expense', icon: 'FileText', color: '#64748b', is_custom: false },
  { id: 'cat-exp-14', name: 'Dívidas', type: 'expense', icon: 'AlertTriangle', color: '#dc2626', is_custom: false },
  { id: 'cat-exp-15', name: 'Cartão', type: 'expense', icon: 'CreditCard', color: '#a855f7', is_custom: false },
  { id: 'cat-exp-16', name: 'Outros', type: 'expense', icon: 'MoreHorizontal', color: '#94a3b8', is_custom: false },
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Conta poupança',
  digital: 'Conta digital',
  wallet: 'Carteira',
  cash: 'Dinheiro',
  investment: 'Investimento',
  other: 'Outro',
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  checking: 'Building2',
  savings: 'PiggyBank',
  digital: 'Smartphone',
  wallet: 'Wallet',
  cash: 'Banknote',
  investment: 'TrendingUp',
  other: 'CreditCard',
};
