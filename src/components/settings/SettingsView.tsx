import React, { useState } from 'react';
import {
  Settings,
  User,
  ShieldCheck,
  HardDrive,
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  Tag,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, Category } from '../../types';
import { isSupabaseConfigured, setCustomSupabaseCredentials } from '../../services/supabase';
import { DataService } from '../../services/dataService';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface SettingsViewProps {
  user: UserProfile;
  categories: Category[];
  onAddCategory: (cat: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  categories,
  onAddCategory,
  onRefreshData,
  onShowToast,
  onClearAllData,
}) => {
  const supabaseActive = isSupabaseConfigured();

  // Category state
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#10b981');
  const [savingCat, setSavingCat] = useState(false);

  // Custom Supabase input
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setSavingCat(true);
    try {
      await onAddCategory({
        name: catName.trim(),
        type: catType,
        color: catColor,
        icon: 'Tag',
        is_default: false,
      });
      setCatName('');
      onShowToast('success', 'Categoria criada com sucesso!');
    } catch (err: any) {
      onShowToast('error', err.message || 'Erro ao criar categoria.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await DataService.exportAllData();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `finangency_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast('success', 'Backup JSON gerado com sucesso!');
    } catch (err) {
      onShowToast('error', 'Erro ao exportar dados.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await DataService.importData(json);
        await onRefreshData();
        onShowToast('success', 'Dados restaurados com sucesso!');
      } catch (err) {
        onShowToast('error', 'Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSupabaseConfig = () => {
    if (!customUrl.trim() || !customKey.trim()) {
      onShowToast('error', 'Informe a URL e a Anon Key do seu projeto Supabase.');
      return;
    }
    setCustomSupabaseCredentials(customUrl.trim(), customKey.trim());
    onShowToast('success', 'Credenciais salvas! A página será atualizada.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12" id="settings-view">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Configurações & Sistema
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Gerencie seu perfil, categorias personalizadas, backup e sincronização
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <User className="w-4 h-4 text-emerald-400" />
            Perfil Financeiro
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Nome
              </label>
              <div className="mt-1 text-sm font-semibold text-white p-2.5 rounded-xl bg-[#09101c] border border-slate-800">
                {user.name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                E-mail
              </label>
              <div className="mt-1 text-sm font-semibold text-white p-2.5 rounded-xl bg-[#09101c] border border-slate-800">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Moeda Padrão
              </label>
              <div className="mt-1 text-sm font-semibold text-emerald-400 p-2.5 rounded-xl bg-[#09101c] border border-slate-800">
                Real Brasileiro (BRL / R$)
              </div>
            </div>
          </div>
        </div>

        {/* Database & Cloud Sync */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Database className="w-4 h-4 text-emerald-400" />
            Sincronização & Supabase
          </h3>

          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              supabaseActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {supabaseActive ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <HardDrive className="w-5 h-5 text-blue-400" />
              )}
              <div>
                <div className="text-xs font-bold">
                  {supabaseActive ? 'Supabase Nuvem Ativo' : 'Armazenamento Local Ativo'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {supabaseActive
                    ? 'Dados sincronizados em PostgreSQL com RLS seguro'
                    : 'Dados persistidos com segurança no navegador com fallback'}
                </div>
              </div>
            </div>
          </div>

          {/* Connect custom Supabase */}
          <div className="pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Conectar projeto Supabase personalizado
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Supabase Anon Key"
                className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveSupabaseConfig}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition"
              >
                Conectar e Recarregar
              </button>
            </div>
          </div>
        </div>

        {/* Custom Categories Management */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Tag className="w-4 h-4 text-emerald-400" />
            Criar Nova Categoria
          </h3>

          <form onSubmit={handleCreateCategory} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Nome da categoria"
                className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <select
                value={catType}
                onChange={(e) => setCatType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#09101c] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Cor:</span>
                {['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatColor(c)}
                    className={`w-6 h-6 rounded-full transition ${
                      catColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={savingCat}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                {savingCat ? 'Salvando...' : '+ Adicionar'}
              </button>
            </div>
          </form>

          {/* List of existing categories */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 mb-2">
              Categorias Cadastradas ({categories.length})
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium border"
                  style={{
                    backgroundColor: `${c.color}15`,
                    borderColor: `${c.color}35`,
                    color: c.color,
                  }}
                >
                  {c.name} {c.type === 'income' ? '(Receita)' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Data & Backup */}
        <div className="p-6 rounded-3xl bg-[#0c1424] border border-slate-800/90 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Download className="w-4 h-4 text-emerald-400" />
            Backup & Segurança de Dados
          </h3>

          <p className="text-xs text-slate-400">
            Você tem controle total sobre seus registros. Exporte um arquivo de backup em JSON para manter uma cópia offline ou transferir entre dispositivos.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Backup Completo (JSON)</span>
            </button>

            <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Restaurar Backup (JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={onClearAllData}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar Todos os Dados Locais</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
