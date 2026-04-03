"use client";

import React, { useState } from "react";
import { 
  Plus, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Building2,
  Briefcase
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from "recharts";
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
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { addInvestment, getInvestments, updateInvestment, updateInvestmentValue, deleteInvestment } from "@/lib/firebase/db";
import { fetchStockPrices } from "@/lib/stockApi";
import { MoreVertical, Trash2, Edit3, PlusCircle } from "lucide-react";

const assetTypes = ["Ações", "ETFs", "Renda Fixa", "Crypto", "Outro"];

const mockInvestments = {
  maria: [
    { id: 1, name: "Tesouro IPCA+", type: "Renda Fixa", broker: "XP", invested: 5000, current: 5250, date: "2023-11-15" },
    { id: 2, name: "IVVB11", type: "ETFs", broker: "Inter", invested: 2000, current: 2340, date: "2024-01-10" },
  ],
  vinicius: [
    { id: 1, name: "Bitcoin", type: "Crypto", broker: "Binance", invested: 3000, current: 4100, date: "2023-12-05" },
    { id: 2, name: "WEGE3", type: "Ações", broker: "BTG Pactual", invested: 4000, current: 3950, date: "2024-02-20" },
    { id: 3, name: "CDB 110% CDI", type: "Renda Fixa", broker: "Inter", invested: 2500, current: 2580, date: "2024-01-20" },
  ]
};

const growthData = [
  { month: "Jan", total: 15000 },
  { month: "Fev", total: 16200 },
  { month: "Mar", total: 18450 },
  { month: "Abr", total: 19800 },
  { month: "Mai", total: 21500 },
  { month: "Jun", total: 23220 },
];

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState("maria");
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any | null>(null);
  const [isContribution, setIsContribution] = useState(false);

  const fetchInvestments = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInvestments(activeTab);
      setInvestments(data);
    } catch (error) {
      console.error("Erro ao buscar investimentos:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const handleRefreshQuotes = async () => {
    const tickers = investments
      .filter(inv => inv.ticker)
      .map(inv => inv.ticker);

    if (tickers.length === 0) {
      alert("Nenhum ativo com Ticker cadastrado para atualizar.");
      return;
    }

    setLoading(true);
    try {
      const prices = await fetchStockPrices(tickers);
      let updatedCount = 0;

      for (const inv of investments) {
        if (inv.ticker) {
          const rawTicker = inv.ticker.toUpperCase();
          const saTicker = `${rawTicker}.SA`;
          const currentPrice = prices[rawTicker] || prices[saTicker];

          if (currentPrice) {
            const newTotalValue = (Number(inv.quantity) || 1) * currentPrice;
            await updateInvestmentValue(inv.id, newTotalValue);
            updatedCount++;
          }
        }
      }
      
      await fetchInvestments();
      alert(`${updatedCount} ativos atualizados com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao atualizar cotações:", error);
      if (error?.message === 'BRAPI_AUTH_REQUIRED') {
        alert(
          "🔐 A API da Brapi requer um token gratuito para acessar este ativo.\n\n" +
          "Como configurar:\n" +
          "1. Acesse https://brapi.dev e crie uma conta gratuita\n" +
          "2. Copie seu token na seção 'Dashboard'\n" +
          "3. Crie o arquivo .env.local na raiz do projeto\n" +
          "4. Adicione a linha: NEXT_PUBLIC_BRAPI_TOKEN=seu_token_aqui\n" +
          "5. Reinicie o servidor (npm run dev)\n\n" +
          "O plano gratuito permite 15.000 consultas/mês."
        );
      } else {
        alert("Erro ao conectar com a API de cotações. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const totalInvested = investments.reduce((acc, curr) => acc + (Number(curr.invested) || 0), 0);
  const currentValue = investments.reduce((acc, curr) => acc + (Number(curr.currentValue) || 0), 0);
  const profitLoss = currentValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  const distribution = Object.entries(
    investments.reduce((acc, curr) => {
      acc[curr.type || curr.assetType] = (acc[curr.type || curr.assetType] || 0) + (Number(curr.currentValue) || 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Investimentos</h2>
          <p className="text-slate-500 text-lg">Acompanhe a evolução do patrimônio.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchInvestments} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Sincronizar Banco
          </Button>
          <Button onClick={handleRefreshQuotes} disabled={loading}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Atualizar Cotações
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard title="Total Investido" value={totalInvested} icon={Briefcase} />
        <StatsCard title="Valor Atual" value={currentValue} icon={Activity} />
        <ProfitCard value={profitLoss} percentage={profitPercentage} />
      </div>

      <Tabs>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="maria" activeTab={activeTab} setActiveTab={setActiveTab}>Maria Cecília</TabsTrigger>
            <TabsTrigger value="vinicius" activeTab={activeTab} setActiveTab={setActiveTab}>Vinícius</TabsTrigger>
          </TabsList>
          <Button 
            variant={showForm ? "ghost" : "outline"} 
            size="sm" 
            onClick={() => {
              if (showForm) {
                setEditingInvestment(null);
                setIsContribution(false);
              }
              setShowForm(!showForm);
            }}
          >
            <Plus className={cn("w-4 h-4 mr-2 transition-transform", showForm && "rotate-45")} />
            {showForm ? "Cancelar" : "Novo Ativo"}
          </Button>
        </div>

        <TabsContent value="maria" activeTab={activeTab}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {showForm && (
                <AddInvestmentForm 
                  type="maria" 
                  onSave={() => {
                    setShowForm(false);
                    setEditingInvestment(null);
                    setIsContribution(false);
                    fetchInvestments();
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingInvestment(null);
                    setIsContribution(false);
                  }}
                  editingInvestment={editingInvestment}
                  isContribution={isContribution}
                />
              )}
              <InvestmentsTable 
                data={investments} 
                loading={loading} 
                onEdit={(asset) => {
                  setEditingInvestment(asset);
                  setIsContribution(false);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={async (id) => {
                  if (confirm("Deseja realmente excluir este ativo?")) {
                    await deleteInvestment(id);
                    fetchInvestments();
                  }
                }}
                onNewContribution={(asset) => {
                  setEditingInvestment(asset);
                  setIsContribution(true);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
            <div className="space-y-6">
              <AllocationCard distribution={distribution} COLORS={COLORS} />
              <SmartAllocationCard distribution={distribution} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vinicius" activeTab={activeTab}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {showForm && (
                <AddInvestmentForm 
                  type="vinicius" 
                  onSave={() => {
                    setShowForm(false);
                    setEditingInvestment(null);
                    setIsContribution(false);
                    fetchInvestments();
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingInvestment(null);
                    setIsContribution(false);
                  }}
                  editingInvestment={editingInvestment}
                  isContribution={isContribution}
                />
              )}
              <InvestmentsTable 
                data={investments} 
                loading={loading} 
                onEdit={(asset) => {
                  setEditingInvestment(asset);
                  setIsContribution(false);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={async (id) => {
                  if (confirm("Deseja realmente excluir este ativo?")) {
                    await deleteInvestment(id);
                    fetchInvestments();
                  }
                }}
                onNewContribution={(asset) => {
                  setEditingInvestment(asset);
                  setIsContribution(true);
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
            <div className="space-y-6">
              <AllocationCard distribution={distribution} COLORS={COLORS} />
              <SmartAllocationCard distribution={distribution} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Crescimento do Patrimônio</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: "#3B82F6" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function InvestmentsTable({ 
  data, 
  loading,
  onEdit,
  onDelete,
  onNewContribution
}: { 
  data: any[], 
  loading: boolean,
  onEdit: (asset: any) => void,
  onDelete: (id: string) => void,
  onNewContribution: (asset: any) => void
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
        <CardTitle>Meus Ativos</CardTitle>
        <CardDescription>Portfólio atual detalhado por ativo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Corretora</TableHead>
              <TableHead className="text-right">Investido</TableHead>
              <TableHead className="text-right">Atual</TableHead>
              <TableHead className="text-right">G/P</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Nenhum ativo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((asset) => {
                const gp = (asset.currentValue || 0) - (asset.invested || 0);
                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-semibold">{asset.name} {asset.ticker && <span className="text-xs font-normal text-slate-400">({asset.ticker})</span>}</TableCell>
                    <TableCell>{asset.assetType}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">{asset.broker}</span>
                        {asset.quantity && <span className="text-[10px] text-slate-400">{asset.quantity} un. à {formatCurrency(asset.purchasePrice || (asset.invested / asset.quantity))}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(asset.invested)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(asset.currentValue)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      gp >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {gp >= 0 ? "+" : ""}{formatCurrency(gp)}
                      <div className="text-[10px] opacity-80">
                        {((gp / (asset.invested || 1)) * 100).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="relative px-0">
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => setOpenMenuId(openMenuId === asset.id ? null : asset.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {openMenuId === asset.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            onClick={() => {
                              onNewContribution(asset);
                              setOpenMenuId(null);
                            }}
                          >
                            <PlusCircle className="w-4 h-4 text-primary" />
                            Novo Aporte
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            onClick={() => {
                              onEdit(asset);
                              setOpenMenuId(null);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                            Editar Ativo
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                            onClick={() => {
                              onDelete(asset.id);
                              setOpenMenuId(null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AddInvestmentForm({ 
  type, 
  onSave,
  onCancel,
  editingInvestment,
  isContribution
}: { 
  type: "maria" | "vinicius", 
  onSave: () => void,
  onCancel: () => void,
  editingInvestment?: any | null,
  isContribution?: boolean
}) {
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    name: "",
    ticker: "",
    assetType: "Ações",
    broker: "",
    quantity: "",
    purchasePrice: "",
    invested: "",
    currentValue: "",
    date: new Date().toISOString().split('T')[0]
  };
  const [formData, setFormData] = useState(defaultForm);

  React.useEffect(() => {
    if (editingInvestment) {
      setFormData({
        name: editingInvestment.name || "",
        ticker: editingInvestment.ticker || "",
        assetType: editingInvestment.assetType || "Ações",
        broker: editingInvestment.broker || "",
        // Se for Novo Aporte, limpamos quantidade e preço médio
        quantity: isContribution ? "" : (editingInvestment.quantity?.toString() || ""),
        purchasePrice: isContribution ? "" : (editingInvestment.purchasePrice?.toString() || ""),
        invested: isContribution ? "" : (editingInvestment.invested?.toString() || ""),
        currentValue: isContribution ? "" : (editingInvestment.currentValue?.toString() || ""),
        date: isContribution ? new Date().toISOString().split('T')[0] : (editingInvestment.date || new Date().toISOString().split('T')[0])
      });
    } else {
      setFormData(defaultForm);
    }
  }, [editingInvestment, isContribution]);

  const handleSubmit = async () => {
    const qty = Number(formData.quantity) || 0;
    const pPrice = Number(formData.purchasePrice) || 0;
    const manualInvested = Number(formData.invested) || 0;

    // Calcula o valor final: ou o manual, ou o auto-calculado
    const investedVal = manualInvested || (qty * pPrice);
    const purchasePriceVal = pPrice || (manualInvested / (qty || 1));

    if (!formData.name) {
      alert("Por favor, preencha o nome do ativo.");
      return;
    }

    if (!investedVal || investedVal <= 0) {
      alert("Por favor, preencha o valor investido ou a quantidade e o preço médio.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        ticker: formData.ticker.toUpperCase().trim(),
        quantity: qty || 1,
        purchasePrice: purchasePriceVal,
        invested: investedVal,
        currentValue: Number(formData.currentValue || investedVal)
      };

      if (editingInvestment && !isContribution) {
        await updateInvestment(editingInvestment.id, payload);
      } else {
        await addInvestment(type, payload);
      }
      onSave();
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      alert("Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>
          {isContribution ? "Novo Aporte" : (editingInvestment ? "Editar Ativo" : "Novo Ativo")}
        </CardTitle>
        <CardDescription>
          {isContribution 
            ? `Registre uma nova compra de ${formData.name}.` 
            : (editingInvestment ? "Atualize as informações do ativo." : "Registre um novo investimento no portfólio.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Ativo</Label>
            <Input 
              id="name" 
              placeholder="Ex: BB Seguridade, Bitcoin" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker (para cotação)</Label>
            <Input 
              id="ticker" 
              placeholder="Ex: BBSE3, IVVB11" 
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assetType">Tipo</Label>
            <select 
              id="assetType" 
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={formData.assetType}
              onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
            >
              {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="broker">Corretora</Label>
            <Input 
              id="broker" 
              placeholder="Ex: XP, BTG, Inter" 
              value={formData.broker}
              onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input 
              id="quantity" 
              type="number" 
              placeholder="0" 
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pPrice">Preço Médio (Cota)</Label>
            <Input 
              id="pPrice" 
              type="number" 
              placeholder="0,00" 
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invested">Total Investido</Label>
            <Input 
              id="invested" 
              type="number" 
              placeholder="Automático" 
              value={formData.invested || (Number(formData.quantity) * Number(formData.purchasePrice) || "")}
              readOnly={!!(formData.quantity && formData.purchasePrice)}
              onChange={(e) => setFormData({ ...formData, invested: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data da Compra</Label>
            <Input 
              id="date" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current">Valor Atual (Total)</Label>
            <Input 
              id="current" 
              type="number" 
              placeholder="Opcional" 
              value={formData.currentValue}
              onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Salvando..." : (editingInvestment && !isContribution ? "Atualizar Ativo" : "Registrar Ativo")}
          </Button>
          {(!!editingInvestment || !!onCancel) && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-primary">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(value)}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfitCard({ value, percentage }: { value: number, percentage: number }) {
  const isPositive = value >= 0;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Rentabilidade Total</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn(
                "text-2xl font-bold",
                isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                {formatCurrency(value)}
              </h3>
              <span className={cn(
                "text-sm font-bold",
                isPositive ? "text-emerald-500" : "text-red-500"
              )}>
                {isPositive ? "+" : ""}{percentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AllocationCard({ distribution, COLORS }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alocação</CardTitle>
        <CardDescription>Distribuição por classe de ativos.</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {distribution.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {distribution.map((item: any, index: number) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-slate-600">{item.name}</span>
              </div>
              <span className="font-semibold">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SmartAllocationCard({ distribution }: any) {
  return (
    <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      <CardHeader>
        <CardTitle className="text-white">Alocação Inteligente</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-400 text-sm leading-relaxed">
          Seu portfólio está concentrado em <span className="text-white font-bold">{distribution[0]?.name || "N/A"}</span>. Para maior segurança, diversifique em outras classes.
        </p>
        <Button className="w-full mt-6 bg-white text-slate-900 hover:bg-slate-100 border-none">
          Ver Sugestões
        </Button>
      </CardContent>
    </Card>
  );
}

function TrendingDown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  )
}
