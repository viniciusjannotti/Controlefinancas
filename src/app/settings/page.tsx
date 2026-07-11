"use client";

import React, { useState } from "react";
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  CreditCard,
  LogOut,
  ChevronRight,
  Copy,
  Check
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/Card";
import { 
  Button, 
  Input, 
  Label 
} from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { getSettings, updateSettings } from "@/lib/firebase/db";
import { useAuth } from "@/lib/auth/AuthContext";

export default function SettingsPage() {
  const { user, accountId, userName, signOut, memberLabels } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    user1: memberLabels.maria,
    user2: memberLabels.vinicius,
  });

  const fetchSettings = React.useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await getSettings(accountId);
      if (data) {
        setFormData(prev => ({
          ...prev,
          ...(data as typeof prev)
        }));
      } else {
        // Sem configuração salva ainda: usa os nomes já resolvidos (reais ou padrão)
        setFormData({ user1: memberLabels.maria, user2: memberLabels.vinicius });
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    } finally {
      setLoading(false);
    }
  }, [accountId, memberLabels]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveInfo = async () => {
    if (!accountId) return;
    setSaving(true);
    try {
      await updateSettings(accountId, {
        user1: formData.user1,
        user2: formData.user2,
      });
      alert("Informações atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar informações:", error);
      alert("Erro ao salvar informações.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAccountId = () => {
    if (accountId) {
      navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    if (confirm("Tem certeza que deseja sair?")) {
      await signOut();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h2>
        <p className="text-slate-500 text-lg">Gerencie seu perfil e preferências do sistema.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1 space-y-2">
          <SettingsNavLink icon={User} label="Perfil" active />
          <SettingsNavLink icon={Bell} label="Notificações" />
          <SettingsNavLink icon={Shield} label="Segurança" />
          <SettingsNavLink icon={Database} label="Dados & Firebase" />
          <SettingsNavLink icon={CreditCard} label="Plano" />
          <div className="pt-4 mt-4 border-t border-slate-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sair da Conta
            </Button>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          {/* Logged-in user info */}
          <Card>
            <CardHeader>
              <CardTitle>Usuário Atual</CardTitle>
              <CardDescription>Suas informações de login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {(userName || user?.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{userName || "Usuário"}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Compartilhar Conta</CardTitle>
              <CardDescription>
                Compartilhe este código com outros usuários para que acessem os mesmos dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={accountId || "Carregando..."}
                  className="font-mono text-sm bg-slate-50"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  className={cn("shrink-0 transition-colors", copied && "border-emerald-500 text-emerald-600")}
                  onClick={handleCopyAccountId}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                O segundo usuário deve criar uma conta e, ao se cadastrar, marcar a opção "Entrar em uma conta existente" e colar este código.
              </p>
            </CardContent>
          </Card>

          {/* Names config */}
          <Card>
            <CardHeader>
              <CardTitle>Nomes dos Usuários</CardTitle>
              <CardDescription>Atualize os nomes que aparecem no sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-slate-400 text-sm">Carregando...</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user1">Usuário 1</Label>
                      <Input 
                        id="user1" 
                        value={formData.user1} 
                        onChange={(e) => setFormData({ ...formData, user1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user2">Usuário 2</Label>
                      <Input 
                        id="user2" 
                        value={formData.user2} 
                        onChange={(e) => setFormData({ ...formData, user2: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveInfo} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsNavLink({ icon: Icon, label, active = false }: any) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
      active 
        ? "bg-primary text-white shadow-md shadow-primary/20" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    )}>
      <div className="flex items-center">
        <Icon className="w-4 h-4 mr-3" />
        {label}
      </div>
      <ChevronRight className={cn("w-4 h-4", active ? "text-white/70" : "text-slate-400")} />
    </button>
  );
}
