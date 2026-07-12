"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Plus, X, Trash2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getReminders, addReminder, deleteReminder, getEarnings, getExpenses } from "@/lib/firebase/db";
import { Button, Input, Label } from "@/components/ui/index";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";

type Reminder = {
  id?: string;
  name: string;
  type: "ganho" | "gasto";
  dueDay: number;
  notifyDaysBefore: number;
  userId: string;
};

export function NotificationsDropdown() {
  const { accountId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Reminder>({
    name: "",
    type: "gasto",
    dueDay: 10,
    notifyDaysBefore: 5,
    userId: "familia"
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = React.useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const [fetchedReminders, allEarningsRaw, expenses] = await Promise.all([
        getReminders(accountId),
        getEarnings(accountId),
        getExpenses(accountId)
      ]);

      const allEarnings = (allEarningsRaw as any[]);
      const allExpenses = expenses as any[];
      const now = new Date();
      const currentDay = now.getDate();

      // Filter transactions to current month only
      const currentMonthEarnings = allEarnings.filter((e: any) => {
        const d = e.date?.seconds ? new Date(e.date.seconds * 1000) : new Date(e.date + 'T00:00:00');
        return isSameMonth(d, now);
      });
      
      const currentMonthExpenses = allExpenses.filter((e: any) => {
        const d = e.date?.seconds ? new Date(e.date.seconds * 1000) : new Date(e.date + 'T00:00:00');
        return isSameMonth(d, now);
      });

      const alerts: any[] = [];

      fetchedReminders.forEach((reminder: any) => {
        let isPaid = false;
        
        // Simple heuristic: check if there's any transaction this month matching the reminder name
        const matchName = (txName: string = "") => txName.toLowerCase().includes(reminder.name.toLowerCase());

        if (reminder.type === "ganho") {
          isPaid = currentMonthEarnings.some((e: any) => matchName(e.patient || e.description || e.service));
        } else {
          isPaid = currentMonthExpenses.some((e: any) => matchName(e.category || e.description));
        }

        if (!isPaid) {
          // Check if we are within the notification window
          const notifyStartDay = reminder.dueDay - reminder.notifyDaysBefore;
          if (currentDay >= notifyStartDay) {
            alerts.push({
              ...reminder,
              isLate: currentDay > reminder.dueDay,
              daysLeft: reminder.dueDay - currentDay
            });
          }
        }
      });

      setReminders(fetchedReminders as Reminder[]);
      // Sort alerts: late first, then upcoming
      setActiveAlerts(alerts.sort((a, b) => a.daysLeft - b.daysLeft));

    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      // Also fetch once on mount to get the badge counter
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleSave = async () => {
    if (!formData.name || !accountId) return alert("Preencha o nome do lembrete.");
    try {
      setLoading(true);
      await addReminder(accountId, formData);
      setShowForm(false);
      setFormData({ name: "", type: "gasto", dueDay: 10, notifyDaysBefore: 5, userId: "familia" });
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar lembrete.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este lembrete recorrente?")) return;
    try {
      await deleteReminder(id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-full transition-all text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-400"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {activeAlerts.length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white translate-x-1/4 -translate-y-1/4">
            {activeAlerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 md:left-auto md:right-0 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 dark:bg-slate-900 dark:border-slate-700">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/50">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Lembretes & Alertas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Avisos de contas e ganhos recorrentes</p>
            </div>
            {!showForm && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
            {showForm && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            {showForm ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                  <Label>Nome do Lembrete</Label>
                  <Input 
                    placeholder="Ex: Aluguel, Cemig, Cliente X" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Dica: Use um nome parecido com o que você cadastra no Ganho/Gasto para a baixa automática.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                      <option value="gasto">Gasto</option>
                      <option value="ganho">Ganho</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dia do Mês</Label>
                    <Input 
                      type="number" min="1" max="31"
                      value={formData.dueDay}
                      onChange={e => setFormData({...formData, dueDay: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Avisar quantos dias antes?</Label>
                  <Input 
                    type="number" min="1" max="30"
                    value={formData.notifyDaysBefore}
                    onChange={e => setFormData({...formData, notifyDaysBefore: Number(e.target.value)})}
                  />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Lembrete"}
                </Button>
                
                {/* List of ALL reminders for management */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Lembretes Cadastrados</h4>
                  {reminders.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">Nenhum lembrete configurado.</p>
                  ) : (
                    <div className="space-y-2">
                      {reminders.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="text-sm font-semibold dark:text-slate-100">{r.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Dia {r.dueDay} • {r.type}</p>
                          </div>
                          <button onClick={() => handleDelete(r.id!)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 opacity-20" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Tudo certo por aqui!</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Nenhum alerta pendente para os próximos dias.</p>
                  </div>
                ) : (
                  activeAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={cn(
                        "p-3 rounded-xl border flex items-start gap-3",
                        alert.isLate ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                      )}
                    >
                      {alert.isLate ? (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                      )}
                      <div>
                        <p className={cn("text-sm font-bold", alert.isLate ? "text-red-900" : "text-amber-900")}>
                          {alert.name}
                        </p>
                        <p className={cn("text-xs mt-0.5", alert.isLate ? "text-red-700" : "text-amber-700")}>
                          {alert.isLate 
                            ? `Atrasado! Venceu dia ${alert.dueDay}` 
                            : alert.daysLeft === 0 ? "Vence hoje!" : `Vence em ${alert.daysLeft} dia(s), no dia ${alert.dueDay}`}
                        </p>
                        <p className="text-[10px] mt-1 font-medium bg-white/50 px-1.5 py-0.5 rounded inline-block text-slate-600">
                          {alert.type === 'ganho' ? "Recebimento pendente" : "Pagamento pendente"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
