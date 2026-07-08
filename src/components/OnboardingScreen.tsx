"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { createAccount, createUserProfile, linkUserToAccount, getAccountById } from "@/lib/auth/db";
import { Wallet, Users, ArrowRight, Hash, CheckCircle } from "lucide-react";

// ─── Onboarding: exibido quando o usuário está autenticado mas sem accountId ──
export function OnboardingScreen() {
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateFamily = async () => {
    if (!user) return;
    if (!name.trim()) { setError("Informe um nome para sua família."); return; }
    setError("");
    setLoading(true);
    try {
      const accountId = await createAccount(name.trim(), user.uid);
      await createUserProfile(user.uid, user.email ?? "", user.displayName ?? name.trim(), accountId);
      // Força recarga para o AuthContext reler o perfil
      window.location.reload();
    } catch (err: any) {
      setError(err.message ?? "Erro ao criar família. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!user) return;
    if (!code.trim()) { setError("Informe o código da conta."); return; }
    setError("");
    setLoading(true);
    try {
      const account = await getAccountById(code.trim());
      if (!account) throw new Error("Código de conta não encontrado. Verifique e tente novamente.");
      await linkUserToAccount(user.uid, code.trim());
      await createUserProfile(user.uid, user.email ?? "", user.displayName ?? user.email ?? "", code.trim());
      window.location.reload();
    } catch (err: any) {
      setError(err.message ?? "Erro ao entrar na conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="m-auto w-full max-w-md px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-xl shadow-primary/30 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bem-vindo(a)!</h1>
          <p className="text-slate-400 mt-1 text-sm">{user?.email}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {mode === "choose" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Como deseja começar?</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Crie uma família nova ou entre em uma existente com o código compartilhado.
                </p>
              </div>

              <button
                onClick={() => setMode("create")}
                className="w-full flex items-center gap-4 p-5 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 rounded-2xl transition-all duration-200 group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Criar nova família</p>
                  <p className="text-slate-400 text-xs mt-0.5">Comece do zero e convide outros membros</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
              </button>

              <button
                onClick={() => setMode("join")}
                className="w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-200 group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Hash className="w-6 h-6 text-slate-300" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Entrar em uma família</p>
                  <p className="text-slate-400 text-xs mt-0.5">Use o código compartilhado por outro membro</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white/50 transition-colors" />
              </button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
              <button
                onClick={() => { setMode("choose"); setError(""); setName(""); }}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors mb-2"
              >
                ← Voltar
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">Criar nova família</h2>
                <p className="text-slate-400 text-sm mt-1">Dê um nome para identificar sua família no sistema.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome da família</label>
                <input
                  type="text"
                  placeholder="Ex: Família Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
              <button
                onClick={handleCreateFamily}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Criando...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" />Criar Família</>
                )}
              </button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
              <button
                onClick={() => { setMode("choose"); setError(""); setCode(""); }}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors mb-2"
              >
                ← Voltar
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">Entrar em uma família</h2>
                <p className="text-slate-400 text-sm mt-1">Cole o código que outro membro compartilhou com você em Configurações → Conta.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Código da conta</label>
                <input
                  type="text"
                  placeholder="Cole o código aqui"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
              <button
                onClick={handleJoinFamily}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Entrando...</>
                ) : (
                  <><ArrowRight className="w-4 h-4" />Entrar na Família</>
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-6">
          <button
            onClick={() => signOut()}
            className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
          >
            Sair da conta
          </button>
        </p>
      </div>
    </div>
  );
}
