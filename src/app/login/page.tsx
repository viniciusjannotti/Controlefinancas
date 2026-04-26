"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Eye, EyeOff, LogIn, UserPlus, Wallet } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function translateFirebaseError(code: string): string {
  const msgs: Record<string, string> = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Nenhuma conta com este e-mail.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha deve ter ao menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
    "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
  };
  return msgs[code] ?? "Ocorreu um erro. Tente novamente.";
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkAccount, setLinkAccount] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    accountId: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(form.email, form.password);
      } else {
        if (!form.name.trim()) {
          setError("Informe seu nome.");
          setLoading(false);
          return;
        }
        await signUp(
          form.email,
          form.password,
          form.name,
          linkAccount && form.accountId ? form.accountId : undefined
        );
      }
      router.replace("/dashboard");
    } catch (err: any) {
      setError(translateFirebaseError(err.code ?? ""));
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-xl shadow-primary/30 mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">M &amp; V Finanças</h1>
          <p className="text-slate-400 mt-1 text-sm">Gestão financeira do casal</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 gap-1 mb-8">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "login"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "register"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name (register only) */}
            {mode === "register" && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Seu Nome
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Cecília"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Account link option (register only) */}
            {mode === "register" && (
              <div className="animate-in slide-in-from-top-2 duration-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      linkAccount ? "bg-primary border-primary" : "border-slate-500 group-hover:border-slate-300"
                    }`}
                    onClick={() => setLinkAccount((v) => !v)}
                  >
                    {linkAccount && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-300">Entrar em uma conta existente</span>
                </label>

                {linkAccount && (
                  <div className="animate-in slide-in-from-top-1 duration-150">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Código da Conta
                    </label>
                    <input
                      type="text"
                      placeholder="Cole o código da conta aqui"
                      value={form.accountId}
                      onChange={(e) => update("accountId", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      O código está disponível em Configurações → Conta
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 animate-in fade-in duration-200">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl py-3.5 text-sm transition-all duration-200 shadow-lg shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Aguarde...
                </>
              ) : mode === "login" ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar Conta
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Seus dados são privados e protegidos com criptografia.
        </p>
      </div>
    </div>
  );
}
