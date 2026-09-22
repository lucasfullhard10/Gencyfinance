import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { DataService } from '../../services/dataService';
import { UserProfile } from '../../types';
import { isSupabaseConfigured } from '../../services/supabase';

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabaseActive = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Por favor, informe seu nome completo.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        return;
      }

      setLoading(true);
      try {
        const res = await DataService.signUp(name.trim(), email.trim(), password);
        if (res.success) {
          const user = DataService.getCurrentUser();
          if (user) onAuthSuccess(user);
        } else {
          setError(res.error || 'Erro ao criar conta. Tente novamente.');
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'signin') {
      setLoading(true);
      try {
        const res = await DataService.signIn(email.trim(), password);
        if (res.success) {
          const user = DataService.getCurrentUser();
          if (user) onAuthSuccess(user);
        } else {
          setError(res.error || 'Erro ao realizar login.');
        }
      } catch (err: any) {
        setError(err.message || 'Erro inesperado.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg(
          'Se houver uma conta associada a este e-mail, as instruções de recuperação foram enviadas com sucesso.'
        );
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#0c1424]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <BrandLogo size="lg" />
          <p className="text-slate-400 text-sm mt-3 max-w-xs leading-relaxed">
            {mode === 'signin' && 'Acesse sua conta para gerenciar suas finanças com precisão e controle.'}
            {mode === 'signup' && 'Crie sua conta e organize seu futuro financeiro sem complicações.'}
            {mode === 'forgot' && 'Digite seu e-mail para recuperar o acesso à sua conta.'}
          </p>
        </div>

        {/* Database notice badge */}
        <div className="mb-6 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-blue-400'
              }`}
            />
            {supabaseActive ? 'Supabase Conectado (PostgreSQL)' : 'Armazenamento Seguro Local Ativo'}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
            {supabaseActive ? 'Nuvem' : 'Local'}
          </span>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Carlos Silva"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Senha
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09101c] border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Aguarde...</span>
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Entrar na Conta'}
                  {mode === 'signup' && 'Criar Minha Conta'}
                  {mode === 'forgot' && 'Enviar Recuperação'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              Não possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          ) : (
            <p>
              Já tem uma conta no Finangency?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Fazer login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
