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
  ChevronRight
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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    user1: "Maria Cecília",
    user2: "Vinícius",
    email: "familia@exemplo.com",
    apiKey: "",
    projectId: ""
  });

  const fetchSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      if (data) {
        setFormData(prev => ({
          ...prev,
          ...(data as typeof prev)
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await updateSettings({
        user1: formData.user1,
        user2: formData.user2,
        email: formData.email
      });
      alert("Informações atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar informações:", error);
      alert("Erro ao salvar informações.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFirebase = async () => {
    setSaving(true);
    try {
      await updateSettings({
        apiKey: formData.apiKey,
        projectId: formData.projectId
      });
      alert("Configurações do Firebase atualizadas!");
    } catch (error) {
      console.error("Erro ao salvar firebase:", error);
      alert("Erro ao salvar configurações do Firebase.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-slate-500">Carregando configurações...</p>
      </div>
    );
  }

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
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-3" />
              Sair da Conta
            </Button>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Casal</CardTitle>
              <CardDescription>Atualize os nomes e detalhes que aparecem no sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="email">E-mail da Família</Label>
                <Input 
                  id="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveInfo} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuração do Firebase</CardTitle>
              <CardDescription>Para conectar ao seu banco de dados, insira suas chaves aqui ou use o arquivo .env.local.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                <SettingsIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Estado da Conexão</p>
                  <p className="text-sm text-amber-700">Conectado ao Firestore. Os dados serão persistidos no seu projeto.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apikey">API Key</Label>
                <Input 
                  id="apikey" 
                  type="password" 
                  placeholder="••••••••••••••••••••" 
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectid">Project ID</Label>
                <Input 
                  id="projectid" 
                  placeholder="controlefinancas-123" 
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                />
              </div>
              <Button variant="outline" onClick={handleSaveFirebase} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
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
