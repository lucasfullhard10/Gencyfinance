import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  TrendingUp,
} from 'lucide-react';
import { Goal } from '../../types';
import { formatCurrency, formatDateBR, getTodayDateString } from '../../lib/financialMath';

interface GoalsViewProps {
  goals: Goal[];
  hideBalance: boolean;
  onSaveGoal: (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateGoalProgress: (goalId: string, additionalAmount: number) => Promise<void>;
  onDeleteGoal: (goal: Goal) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  hideBalance,
  onSaveGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('0,00');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#10b981');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmountStr('');
    setCurrentAmountStr('0,00');
    setTargetDate('');
    setColor('#10b981');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (g: Goal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setTargetAmountStr(String(g.target_amount));
    setCurrentAmountStr(String(g.current_amount));
    setTargetDate(g.target_date || '');
    setColor(g.color || '#10b981');
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetAmount = parseFloat(targetAmountStr.replace(',', '.'));
    const currentAmount = parseFloat(currentAmountStr.replace(',', '.')) || 0;

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setError('Informe um valor alvo válido maior que zero.');
      return;
    }

    if (!title.trim()) {
      setError('Informe o título do seu objetivo.');
      return;
    }

    setLoading(true);
    try {
      await onSaveGoal({
        title: title.trim(),
        target_amount: Math.round(targetAmount * 100) / 100,
        current_amount: Math.round(currentAmount * 100) / 100,
        target_date: targetDate || undefined,
        color,
      });
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar meta.');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;

    const amount = parseFloat(depositAmountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    setLoading(true);
    try {
      await onUpdateGoalProgress(depositGoal.id, amount);
      setShowDepositModal(false);
      setDepositGoal(null);
      setDepositAmountStr('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="goals-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Metas & Objetivos Financeiros
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Acompanhe o acúmulo de patrimônio para suas conquistas
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Meta</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c1424] border border-slate-800/80 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhuma meta criada ainda</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Planeje sua reserva de emergência, viagem, aquisição de bens ou investimentos futuros com acompanhamento percentual claro.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            + Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percent = Math.min(
              100,
              Math.round((goal.current_amount / goal.target_amount) * 100)
            );
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);
            const isCompleted = goal.current_amount >= goal.target_amount;

            return (
              <div
                key={goal.id}
                className="p-5 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: goal.color || '#10b981' }}
                      >
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{goal.title}</h3>
                        {goal.target_date && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Alvo: {formatDateBR(goal.target_date)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-[#09101c] border border-slate-800">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Acumulado:</span>
                      <span className="text-lg font-extrabold text-emerald-400">
                        {formatCurrency(goal.current_amount, hideBalance)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/60 text-xs">
                      <span className="text-slate-400">Objetivo total:</span>
                      <span className="font-semibold text-slate-300">
                        {formatCurrency(goal.target_amount, hideBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-400">{percent}% concluído</span>
                      <span className="text-slate-400">
                        {isCompleted
                          ? 'Meta atingida! 🎉'
                          : `Falta ${formatCurrency(remaining, hideBalance)}`}
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color || '#10b981',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Deposit Quick Button */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {isCompleted ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Parabéns, objetivo concluído!
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setDepositGoal(goal);
                        setDepositAmountStr('');
                        setShowDepositModal(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Adicionar Aporte</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Create/Edit Goal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-slate-700/80 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
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
                  Título da Meta
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Reserva de Emergência, Viagem..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Valor Alvo (R$)
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="decimal"
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(e.target.value)}
                    placeholder="10000,00"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700 text-white font-semibold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Já Acumulado (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={currentAmountStr}
                    onChange={(e) => setCurrentAmountStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700 text-white font-semibold text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Data Alvo Desejada (Opcional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
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
                  {loading ? 'Salvando...' : 'Salvar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {showDepositModal && depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0c1424] border border-slate-700/80 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Aporte: {depositGoal.title}
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Valor a adicionar (R$)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  inputMode="decimal"
                  value={depositAmountStr}
                  onChange={(e) => setDepositAmountStr(e.target.value)}
                  placeholder="Ex.: 250,00"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
