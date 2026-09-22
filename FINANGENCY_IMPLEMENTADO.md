# MEMÓRIA TÉCNICA DO PROJETO — FINANGENCY

## # IMPLEMENTADO
- **Identidade Visual & Branding**:
  - Tema dark fintech de alto padrão (paleta azul-marinho profundo `#070b14`, `#0c1424`, grafite, verde esmeralda `#10b981` e teal `#34d399`).
  - Ícone oficial do Finangency com a letra 'F' estilizada e barras de crescimento financeiro ascendentes (`/public/icon.svg`).
  - Geração de ícones PNG PWA em alta definição (`192x192`, `512x512` e `apple-touch-icon.png`).
- **Arquitetura & Configuração**:
  - PWA completo configurado via `vite-plugin-pwa` com suporte a instalação offline, `manifest.json` com `standalone` display e service worker.
  - Script `.env.example` atualizado com documentação para `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
  - Tipografia moderna Google Fonts (Plus Jakarta Sans) com padrão de moeda BRL (R$) e formato brasileiro de datas (DD/MM/AAAA).
  - Configuração de metadados em `metadata.json` e `index.html`.

## # EM DESENVOLVIMENTO
- **Banco de Dados & Supabase**:
  - Script SQL completo com tabelas, índices, triggers e Row Level Security (RLS) para profiles, accounts, categories, transactions, budgets, goals, goal_contributions e notifications (`supabase/schema.sql`).
  - Camada de serviço híbrida: Conexão direta com Supabase quando configurado e fallback de persistência local segura (LocalStorage com criptografia de sessão e isolamento de usuário).
- **Módulos Centrais do Aplicativo**:
  - Autenticação (Login, Cadastro, Recuperação de Senha, Sessão persistente).
  - Contas (Gerenciamento de contas manuais, saldos calculados em tempo real, transferências).
  - Movimentações (Receitas, Despesas, Transferências, filtros avançados, parcelamentos e recorrências).
  - Dashboard Financeiro (Saldo total, Saldo disponível real, receitas/despesas do período, próximos vencimentos, previsão financeira e alertas).
  - Calendário Financeiro Interativo (Mapeamento diário de vencimentos e recebimentos).
  - Orçamentos por Categoria (Limites mensais, barras de progresso com alertas em 70%, 90% e 100%).
  - Metas Financeiras (Objetivo, histórico de contribuições, cálculo de prazo e valor restante).
  - Relatórios & Análises (Receitas x Despesas, distribuição por categoria, evolução patrimonial, comparações mensais).
  - Central de Notificações & Lembretes de Vencimento.
  - Configurações & Gestão de Dados (Perfil, Tema Escuro/Claro, Privacidade de Saldos, Backup/Restauração).

## # PENDENTE
- Notificações nativas locais com Capacitor para Android e iOS.
- Futura integração com FINANGENCY AI (IA para insights e assistente de finanças).

## # PROBLEMAS CONHECIDOS
- Nenhum no momento.

## # DECISÕES TÉCNICAS
- **Zero Dados Fictícios (Princípio Fundamental)**: Usuário novo inicia rigorosamente com 0 contas, 0 movimentações e saldo R$ 0,00. Estados vazios elegantes instruem o início do uso.
- **Precisão Monetária**: Todos os valores são calculados em centavos (inteiros) ou tratados com precisão decimal rigorosa, evitando erros de floating point.
- **Tratamento de Fuso Horário**: Manipulação de datas sem desvios de UTC para manter o padrão brasileiro (DD/MM/AAAA) exato.
- **Fonte Única de Verdade**: Cálculos financeiros e de previsão centralizados em utilitários reutilizáveis (`src/lib/financialMath.ts`).

## # ÚLTIMA ALTERAÇÃO
- Criação da memória técnica inicial, configuração do PWA e identidade visual do Finangency.
