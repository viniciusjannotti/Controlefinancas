"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download,
  Calendar as CalendarIcon,
  User,
  CreditCard,
  Target,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/Card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/Tabs";
import { Button, Input, Label, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/index";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addEarning, getEarnings, updateEarning, deleteEarning } from "@/lib/firebase/db";
// import { toast } from "sonner"; 

export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState("maria");
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEarning, setEditingEarning] = useState<any | null>(null);

  const fetchEarnings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEarnings(activeTab);
      setEarnings(data);
    } catch (error) {
      console.error("Erro ao buscar ganhos:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este ganho?")) {
      try {
        await deleteEarning(id);
        fetchEarnings();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir registro.");
      }
    }
  };

  const handleEdit = (earning: any) => {
    setEditingEarning(earning);
    document.getElementById("earnings-form-card")?.scrollIntoView({ behavior: 'smooth' });
  };

  const totalMonthly = earnings.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ganhos</h2>
          <p className="text-slate-500 text-lg">Gerencie as receitas individuais do casal.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => document.getElementById("date")?.focus()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Ganho
          </Button>
        </div>
      </div>

      <Tabs>
        <TabsList className="bg-slate-200/50">
          <TabsTrigger value="maria" activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setEditingEarning(null); }}>
            Maria Cecília
          </TabsTrigger>
          <TabsTrigger value="vinicius" activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setEditingEarning(null); }}>
            Vinícius
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maria" activeTab={activeTab}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <EarningsTable 
                type="maria" 
                data={earnings} 
                loading={loading} 
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </div>
            <div className="space-y-6">
              <div id="earnings-form-card">
                <AddEarningsForm 
                  type="maria" 
                  onSave={() => { fetchEarnings(); setEditingEarning(null); }}
                  editingEarning={editingEarning}
                  onCancel={() => setEditingEarning(null)}
                />
              </div>
              <MonthlySummary value={totalMonthly} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vinicius" activeTab={activeTab}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <EarningsTable 
                type="vinicius" 
                data={earnings} 
                loading={loading} 
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </div>
            <div className="space-y-6">
              <div id="earnings-form-card">
                <AddEarningsForm 
                  type="vinicius" 
                  onSave={() => { fetchEarnings(); setEditingEarning(null); }}
                  editingEarning={editingEarning}
                  onCancel={() => setEditingEarning(null)}
                />
              </div>
              <MonthlySummary value={totalMonthly} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EarningsTable({ 
  type, data, loading, onDelete, onEdit 
}: { 
  type: "maria" | "vinicius", 
  data: any[], 
  loading: boolean,
  onDelete: (id: string) => void,
  onEdit: (item: any) => void
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Carregando dados...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Ganhos</CardTitle>
        <CardDescription>Mostrando os registros salvos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>{type === "maria" ? "Paciente" : "Cliente"}</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.date?.seconds ? formatDate(new Date(item.date.seconds * 1000)) : formatDate(new Date(item.date))}
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                      {item.type || item.service}
                    </span>
                  </TableCell>
                  <TableCell>{item.method || "-"}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="relative">
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {openMenuId === item.id && (
                      <div className="absolute right-full top-0 mr-2 z-50 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => { onEdit(item); setOpenMenuId(null); }}
                        >
                          Editar
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => { onDelete(item.id); setOpenMenuId(null); }}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddEarningsForm({ 
  type, 
  onSave, 
  editingEarning, 
  onCancel 
}: { 
  type: "maria" | "vinicius",
  onSave: () => void,
  editingEarning?: any | null,
  onCancel?: () => void
}) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState(["Empresa X", "Cliente Y", "Startup Z"]);
  const [newClient, setNewClient] = useState("");
  const [showAddClient, setShowAddClient] = useState(false);

  const defaultForm = {
    date: new Date().toISOString().split('T')[0],
    name: "",
    type: "",
    service: "online",
    notes: "",
    method: "Pix",
    amount: ""
  };
  const [formData, setFormData] = useState(defaultForm);

  React.useEffect(() => {
    if (editingEarning) {
      let dateStr = "";
      if (editingEarning.date?.seconds) {
        dateStr = new Date(editingEarning.date.seconds * 1000).toISOString().split('T')[0];
      } else if (editingEarning.date) {
        dateStr = new Date(editingEarning.date).toISOString().split('T')[0];
      }
      setFormData({
        date: dateStr,
        name: editingEarning.name || "",
        type: editingEarning.type || "",
        service: editingEarning.service || "online",
        notes: editingEarning.notes || "",
        method: editingEarning.method || "Pix",
        amount: editingEarning.amount?.toString() || ""
      });
    } else {
      setFormData(defaultForm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEarning]);

  const addClient = () => {
    if (newClient && !clients.includes(newClient)) {
      setClients([...clients, newClient]);
      setFormData({ ...formData, name: newClient });
      setNewClient("");
      setShowAddClient(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) {
      alert("Por favor, preencha o nome e o valor.");
      return;
    }

    setLoading(true);
    try {
      const data = { ...formData, amount: Number(formData.amount), date: formData.date };
      if (editingEarning) {
        await updateEarning(editingEarning.id, data);
      } else {
        await addEarning(type, data);
      }
      setFormData(defaultForm);
      onSave();
    } catch (error) {
      console.error("Erro ao salvar ganho:", error);
      alert("Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingEarning ? "Editar Ganho" : "Adicionar Novo"}</CardTitle>
        <CardDescription>
          {editingEarning ? "Atualize os detalhes do recebimento." : "Insira os detalhes do novo recebimento."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              id="date" 
              type="date" 
              className="pl-10" 
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">{type === "maria" ? "Nome do Paciente" : "Nome do Cliente"}</Label>
          {type === "maria" ? (
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                id="name" 
                placeholder="Ex: Ana Maria" 
                className="pl-10" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select 
                  id="name" 
                  className={selectClass + " pl-10 appearance-none"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowAddClient(!showAddClient)}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {showAddClient && type === "vinicius" && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-xs">Novo Cliente</Label>
            <div className="flex gap-2">
              <Input 
                value={newClient} 
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="Nome..." 
                className="h-9 text-xs" 
              />
              <Button size="sm" onClick={addClient}>Add</Button>
            </div>
          </div>
        )}

        {type === "maria" ? (
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Consulta</Label>
            <Input 
              id="type" 
              placeholder="Ex: Psicoterapia" 
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="service">Tipo de Serviço</Label>
              <select 
                id="service" 
                className={selectClass}
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              >
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observação <span className="text-slate-400 font-normal">(Opcional)</span></Label>
              <Input 
                id="notes" 
                placeholder="Detalhes adicionais..." 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="method">Método de Pagamento</Label>
          <select
            id="method"
            className={selectClass}
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
          >
            <option value="Pix">Pix</option>
            <option value="Cartão">Cartão</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Transferência">Transferência</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              id="amount" 
              type="number" 
              placeholder="0,00" 
              className="pl-10" 
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {editingEarning && (
            <Button
              variant="outline"
              className="flex-1 mt-4"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          <Button 
            className="flex-1 mt-4" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Salvando..." : (editingEarning ? "Atualizar" : "Salvar Registro")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlySummary({ value }: { value: number }) {
  return (
    <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20">
      <CardHeader>
        <CardTitle className="text-white">Total do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">{formatCurrency(value)}</p>
          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <p className="mt-4 text-sm text-blue-100 flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>Meta Mensal: {formatCurrency(8000)}</span>
        </p>
        <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${(value / 8000) * 100}%` }}></div>
        </div>
      </CardContent>
    </Card>
  );
}
