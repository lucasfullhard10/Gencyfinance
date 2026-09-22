import React, { useState } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Wallet,
  Tag,
  ChevronDown,
  ChevronUp,
  Clock,
  Repeat,
  Layers,
  AlertCircle,
} from 'lucide-react';
import {
  Account,
  Category,
  Transaction,
  TransactionType,
  RecurrenceFrequency,
} from '../../types';
import { getTodayDateString } from '../../lib/financialMath';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  onSave: (
    txData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    options?: { installments?: number }
  ) => Promise<void>;
  onOpenNewAccount: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  initialType = 'expense',
  editingTransaction = null,
  onSave,
  onOpenNewAccount,
}) => {
  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type || initialType
  );
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [amountStr, setAmountStr] = useState(
    editingTransaction ? String(editingTransaction.amount) : ''
  );
  const [accountId, setAccountId] = useState(
    editingTransaction?.account_id || (accounts.length > 0 ? accounts[0].id : '')
  );
  const [destinationAccountId, setDestinationAccountId] = useState(
    editingTransaction?.destination_account_id || (accounts.length > 1 ? accounts[1].id : '')
  );
  const [categoryId, setCategoryId] = useState(
    editingTransaction?.category_id || ''
  );
  const [dueDate, setDueDate] = useState(
    editingTransaction?.due_date || getTodayDateString()
  );
  const [isPaid, setIsPaid] = useState(
    editingTransaction
      ? editingTransaction.status === 'paid' || editingTransaction.status === 'received'
      : false
  );
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [notes, setNotes] = useState(editingTransaction?.notes || '');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>(
    editingTransaction?.recurrence_type || 'none'
  );
  const [installments, setInstallments] = useState<number>(1);
  const [reminderDays, setReminderDays] = useState<number>(
    editingTransaction?.reminder_days_before || 3
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = categories.filter((c) =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, informe um valor financeiro válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setError('Por favor, informe a descrição da movimentação.');
      return;
    }

    if (!accountId) {
      setError('Selecione uma conta para a movimentação.');
      return;
    }

    if (type === 'transfer') {
      if (!destinationAccountId) {
        setError('Selecione a conta de destino para a transferência.');
        return;
      }
      if (accountId === destinationAccountId) {
        setError('A conta de origem e destino não podem ser a mesma.');
        return;
      }
    }

    setLoading(true);
    try {
      let status = editingTransaction?.status || 'pending';
      if (type === 'expense') {
        status = isPaid ? 'paid' : 'pending';
      } else if (type === 'income') {
        status = isPaid ? 'received' : 'planned';
      } else if (type === 'transfer') {
        status = 'completed';
      }

      await onSave(
        {
          type,
          description: description.trim(),
          amount: Math.round(amount * 100) / 100,
          account_id: accountId,
          destination_account_id: type === 'transfer' ? destinationAccountId : undefined,
          category_id: type !== 'transfer' ? categoryId || undefined : undefined,
          due_date: dueDate,
          payment_date: isPaid ? dueDate : undefined,
          status,
          notes: notes.trim() || undefined,
          recurrence_type: recurrence,
          reminder_days_before: reminderDays,
        },
        type !== 'transfer' && !editingTransaction && installments > 1
          ? { installments }
          : undefined
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar movimentação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-[#0c1424] border border-slate-700/80 p-6 shadow-2xl text-slate-100 my-8">
        {/* Header with Type Selector */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {editingTransaction ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        {!editingTransaction && (
          <div className="grid grid-cols-3 gap-2 mt-4 p-1.5 rounded-2xl bg-[#080e1a] border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Receita
            </button>
            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setCategoryId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                type === 'transfer'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              Transferência
            </button>
          </div>
        )}

        {/* No Accounts Warning */}
        {accounts.length === 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Você precisa cadastrar uma conta primeiro!</span>
            </div>
            <p className="text-slate-300">
              Para vincular receitas, despesas e saldos reais, cadastre sua conta inicial.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewAccount();
              }}
              className="mt-1 self-start px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
            >
              + Adicionar primeira conta
            </button>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                R$
              </span>
              <input
                type="text"
                required
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#09101c] border border-slate-700/80 text-white font-bold text-xl placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'expense'
                  ? 'Ex.: Supermercado, Aluguel...'
                  : type === 'income'
                  ? 'Ex.: Salário, Venda de serviço...'
                  : 'Ex.: Reserva de emergência...'
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Accounts & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account (Origem) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {type === 'transfer' ? 'Conta de Origem' : 'Conta'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.institution ? `(${a.institution})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account for Transfer OR Category for Income/Expense */}
            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Conta de Destino
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">Selecione o destino</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} {a.institution ? `(${a.institution})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">Sem categoria</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {type === 'expense'
                  ? 'Data de Vencimento'
                  : type === 'income'
                  ? 'Data Prevista'
                  : 'Data da Transferência'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {type !== 'transfer' && (
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 cursor-pointer hover:border-slate-600 transition">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs font-medium text-slate-200">
                    {type === 'expense' ? 'Já foi paga hoje' : 'Já foi recebida hoje'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Expandable "Mais opções" */}
          <div>
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition"
            >
              {showMoreOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showMoreOptions ? 'Menos opções' : 'Mais opções (Parcelas, Recorrência, Notas)'}</span>
            </button>

            {showMoreOptions && (
              <div className="mt-3 p-4 rounded-2xl bg-[#080e1a] border border-slate-800 space-y-3 animate-fade-in">
                {type !== 'transfer' && !editingTransaction && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Parcelamento */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Parcelamento
                      </label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none"
                      >
                        <option value={1}>À vista (1x)</option>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                          <option key={n} value={n}>
                            {n}x parcelas mensais
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Recorrência */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                        Recorrência
                      </label>
                      <select
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency)}
                        className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none"
                      >
                        <option value="none">Não se repete</option>
                        <option value="monthly">Mensalmente</option>
                        <option value="weekly">Semanalmente</option>
                        <option value="yearly">Anualmente</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Reminder days */}
                {type === 'expense' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Lembrete de Vencimento
                    </label>
                    <select
                      value={reminderDays}
                      onChange={(e) => setReminderDays(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none"
                    >
                      <option value={0}>No dia do vencimento</option>
                      <option value={1}>1 dia antes</option>
                      <option value={3}>3 dias antes</option>
                      <option value={7}>7 dias antes</option>
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informações adicionais, número de boleto ou anotações..."
                    className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || accounts.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
