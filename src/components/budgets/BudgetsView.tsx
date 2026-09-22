import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { Budget, Category, Transaction } from '../../types';
import {
  formatCurrency,
  getTodayDateString,
} from '../../lib/financialMath';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  hideBalance: boolean;
  onSaveBudget: (budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onDeleteBudget: (budget: Budget) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  transactions,
  hideBalance,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [amountLimitStr, setAmountLimitStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const currentMonthPrefix = todayStr.substring(0, 7); // 'YYYY-MM'

  // Calculate actual spending per category for this month
  const categorySpendingThisMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (
        tx.type === 'expense' &&
        tx.due_date.startsWith(currentMonthPrefix) &&
        tx.category_id
      ) {
        const prev = map.get(tx.category_id) || 0;
        map.set(tx.category_id, prev + tx.amount);
      }
    }
    return map;
  }, [transactions, currentMonthPrefix]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setCategoryId(categories.length > 0 ? categories[0].id : '');
    setAmountLimitStr('');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.category_id);
    setAmountLimitStr(String(b.amount_limit));
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const limit = parseFloat(amountLimitStr.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) {
      setError('Por favor, informe um limite orçamentário maior que zero.');
      return;
    }

    if (!categoryId) {
      setError('Selecione uma categoria para o orçamento.');
      return;
    }

    setLoading(true);
    try {
      await onSaveBudget({
        category_id: categoryId,
        amount_limit: Math.round(limit * 100) / 100,
        period: 'monthly',
        alert_threshold_percent: 80,
      });
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar orçamento.');
    } finally {
      setLoading(false);
    }
  };

  // Only expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-6 pb-12" id="budgets-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Orçamentos por Categoria
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Defina limites de gastos mensais e evite surpresas
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Definir Novo Orçamento</span>
        </button>
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c1424] border border-slate-800/80 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <PieChart className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum orçamento definido</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Estabeleça metas de teto de gastos para alimentação, transporte, lazer e receba avisos preventivos ao atingir 80% do limite.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            + Definir primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const cat = categories.find((c) => c.id === budget.category_id);
            const spent = categorySpendingThisMonth.get(budget.category_id) || 0;
            const remaining = Math.max(0, budget.amount_limit - spent);
            const percentUsed = Math.min(
              200,
              Math.round((spent / budget.amount_limit) * 100)
            );
            const isExceeded = spent > budget.amount_limit;
            const isWarning = percentUsed >= (budget.alert_threshold_percent || 80);

            return (
              <div
                key={budget.id}
                className="p-5 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat?.color || '#10b981' }}
                      />
                      <h3 className="text-sm font-bold text-white">
                        {cat?.name || 'Categoria'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(budget)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Editar orçamento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBudget(budget)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Excluir orçamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#09101c] border border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400">Gasto este mês:</span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {formatCurrency(spent, hideBalance)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Limite orçado:</span>
                      <p className="text-sm font-bold text-slate-300 mt-0.5">
                        {formatCurrency(budget.amount_limit, hideBalance)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">{percentUsed}% utilizado</span>
                      <span
                        className={
                          isExceeded
                            ? 'text-rose-400 font-bold'
                            : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {isExceeded
                          ? `Excedido em ${formatCurrency(spent - budget.amount_limit, hideBalance)}`
                          : `Resta ${formatCurrency(remaining, hideBalance)}`}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, percentUsed)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Status Callout */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  {isExceeded ? (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Limite mensal ultrapassado!</span>
                    </div>
                  ) : isWarning ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Atenção: 80% do limite atingido</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Dentro do orçamento previsto</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Create/Edit Budget */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-slate-700/80 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingBudget ? 'Editar Orçamento' : 'Novo Limite Orçamentário'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Categoria de Despesa
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Limite Mensal Máximo (R$)
                </label>
                <input
                  type="text"
                  required
                  inputMode="decimal"
                  value={amountLimitStr}
                  onChange={(e) => setAmountLimitStr(e.target.value)}
                  placeholder="Ex.: 1500,00"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
                >
                  {loading ? 'Salvando...' : 'Salvar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
