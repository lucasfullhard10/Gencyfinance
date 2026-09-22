import React, { useState } from 'react';
import { X, Wallet, Building2, Smartphone, PiggyBank, Banknote, TrendingUp, CreditCard } from 'lucide-react';
import { Account, AccountType } from '../../types';
import { ACCOUNT_TYPE_LABELS } from '../../lib/constants';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
  onSave: (accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const COLOR_PALETTE = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#64748b', // Slate
  '#14b8a6', // Teal
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount = null,
  onSave,
}) => {
  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<AccountType>(editingAccount?.type || 'checking');
  const [institution, setInstitution] = useState(editingAccount?.institution || '');
  const [initialBalanceStr, setInitialBalanceStr] = useState(
    editingAccount ? String(editingAccount.initial_balance) : '0,00'
  );
  const [color, setColor] = useState(editingAccount?.color || '#10b981');
  const [notes, setNotes] = useState(editingAccount?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe o nome da conta.');
      return;
    }

    const initialBalance = parseFloat(initialBalanceStr.replace(',', '.'));
    if (isNaN(initialBalance)) {
      setError('Informe um saldo inicial válido.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        institution: institution.trim() || undefined,
        initial_balance: Math.round(initialBalance * 100) / 100,
        color,
        icon: 'Wallet',
        notes: notes.trim() || undefined,
        is_active: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#0c1424] border border-slate-700/80 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            {editingAccount ? 'Editar Conta' : 'Nova Conta Financeira'}
          </h3>
          <button
            onClick={onClose}
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
          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Nome da Conta
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Conta Corrente Principal, Carteira..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tipo de Conta
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            >
              {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((tKey) => (
                <option key={tKey} value={tKey}>
                  {ACCOUNT_TYPE_LABELS[tKey]}
                </option>
              ))}
            </select>
          </div>

          {/* Financial Institution (manual typing - never forced mock) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Instituição Financeira (Opcional)
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Ex.: Digite o banco ou cooperativa"
              className="w-full px-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Initial Balance */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Saldo Inicial (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                R$
              </span>
              <input
                type="text"
                required
                inputMode="decimal"
                value={initialBalanceStr}
                onChange={(e) => setInitialBalanceStr(e.target.value)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white font-semibold text-base placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              O saldo inicial serve como ponto de partida para os cálculos reais de movimentações.
            </p>
          </div>

          {/* Color selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition transform ${
                    color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0c1424]' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Conta de recebimento de honorários..."
              className="w-full px-4 py-2 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Actions */}
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
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
