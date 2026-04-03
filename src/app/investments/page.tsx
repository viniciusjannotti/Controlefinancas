"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Briefcase,
  ChevronRight,
  X,
  History,
  PlusCircle,
  Trash2,
  Edit3,
  MoreVertical,
  Gift
} from "lucide-react";
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
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

const assetTypes = ["Ações", "ETFs", "Renda Fixa", "Crypto", "Outro"];

const growthData = [
  { month: "Jan", total: 15000 },
  { month: "Fev", total: 16200 },
  { month: "Mar", total: 18450 },
  { month: "Abr", total: 19800 },
  { month: "Mai", total: 21500 },
  { month: "Jun", total: 23220 },
];

// ──────────────────────────────────────
// Consolidation logic
// ──────────────────────────────────────
function consolidateInvestments(investments: any[]) {
  const groups: Record<string, any> = {};

  for (const inv of investments) {
    // Group key: ticker (uppercase) or name if no ticker
    const key = inv.ticker ? inv.ticker.toUpperCase().trim() : inv.name;
    if (!groups[key]) {
      groups[key] = {
        key,
        ticker: inv.ticker?.toUpperCase().trim() || "",
        name: inv.name,
        assetType: inv.assetType || inv.type,
        broker: inv.broker,
        totalInvested: 0,
        totalQuantity: 0,
        totalCurrentValue: 0,
        entries: [],
      };
    }
    const group = groups[key];
    group.totalInvested += Number(inv.invested) || 0;
    group.totalQuantity += Number(inv.quantity) || 0;
    group.totalCurrentValue += Number(inv.currentValue) || 0;
    group.entries.push(inv);
  }

  return Object.values(groups).map((g) => ({
    ...g,
    avgPurchasePrice: g.totalQuantity > 0 ? g.totalInvested / g.totalQuantity : 0,
    gp: g.totalCurrentValue - g.totalInvested,
    gpPct: g.totalInvested > 0 ? ((g.totalCurrentValue - g.totalInvested) / g.totalInvested) * 100 : 0,
  }));
}

// ──────────────────────────────────────
// Main Page
// ──────────────────────────────────────
export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState("maria");
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any | null>(null);
  const [isContribution, setIsContribution] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

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
      const failedTickers: string[] = [];

      for (const inv of investments) {
        if (inv.ticker) {
          const tickerUpper = inv.ticker.toUpperCase().trim();
          const currentPrice = prices[tickerUpper] || prices[`${tickerUpper}.SA`];
          if (currentPrice) {
            const newTotalValue = (Number(inv.quantity) || 1) * currentPrice;
            await updateInvestmentValue(inv.id, newTotalValue);
            updatedCount++;
          } else {
            if (!failedTickers.includes(tickerUpper)) failedTickers.push(tickerUpper);
          }
        }
      }

      await fetchInvestments();

      if (updatedCount === 0 && tickers.length > 0) {
        alert(`❌ Nenhum dos ativos foi atualizado.\n\nTentamos buscar: ${[...new Set(tickers)].join(', ')}\n\nVerifique os tickers e se o Token está configurado no Vercel.`);
      } else if (failedTickers.length > 0) {
        alert(`✅ ${updatedCount} registros atualizados. Não encontramos preço para: ${failedTickers.join(', ')}`);
      } else {
        alert(`✅ ${updatedCount} registros atualizados com sucesso!`);
      }
    } catch (error: any) {
      if (error?.message === 'BRAPI_AUTH_REQUIRED') {
        alert("🔐 Token da Brapi necessário.\n\nAcesse https://brapi.dev, crie uma conta gratuita e adicione NEXT_PUBLIC_BRAPI_TOKEN no Vercel.");
      } else {
        alert(`Erro na API: ${error?.message || "Erro desconhecido"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const consolidated = useMemo(() => consolidateInvestments(investments), [investments]);

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

  const openForm = (template?: any, contribution = false) => {
    setEditingInvestment(template || null);
    setIsContribution(contribution);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingInvestment(null);
    setIsContribution(false);
  };

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
            Sincronizar
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
            onClick={() => showForm ? closeForm() : openForm()}
          >
            <Plus className={cn("w-4 h-4 mr-2 transition-transform", showForm && "rotate-45")} />
            {showForm ? "Cancelar" : "Novo Ativo"}
          </Button>
        </div>

        {["maria", "vinicius"].map(tab => (
          <TabsContent key={tab} value={tab} activeTab={activeTab}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {showForm && (
                  <AddInvestmentForm 
                    type={tab as "maria" | "vinicius"} 
                    onSave={() => { closeForm(); fetchInvestments(); }}
                    onCancel={closeForm}
                    editingInvestment={editingInvestment}
                    isContribution={isContribution}
                  />
                )}
                <ConsolidatedTable 
                  consolidated={consolidated}
                  loading={loading}
                  onRowClick={(group) => setSelectedAsset(group)}
                  onNewContribution={(group) => {
                    // Use the first entry as a template for the new contribution
                    openForm(group.entries[0], true);
                    setSelectedAsset(null);
                  }}
                />
              </div>
              <div className="space-y-6">
                <AllocationCard distribution={distribution} COLORS={COLORS} />
                <SmartAllocationCard distribution={distribution} />
              </div>
            </div>
          </TabsContent>
        ))}
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
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: "#3B82F6" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Asset Detail Panel */}
      {selectedAsset && (
        <AssetDetailPanel
          group={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onNewContribution={() => {
            openForm(selectedAsset.entries[0], true);
            setSelectedAsset(null);
          }}
          onEditEntry={(entry) => {
            openForm(entry, false);
            setSelectedAsset(null);
          }}
          onDeleteEntry={async (id) => {
            if (confirm("Excluir esta entrada do histórico?")) {
              await deleteInvestment(id);
              fetchInvestments();
              setSelectedAsset(null);
            }
          }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────
// Consolidated Table
// ──────────────────────────────────────
function ConsolidatedTable({ consolidated, loading, onRowClick, onNewContribution }: {
  consolidated: any[],
  loading: boolean,
  onRowClick: (group: any) => void,
  onNewContribution: (group: any) => void,
}) {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          Carregando...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Ativos</CardTitle>
        <CardDescription>
          {consolidated.length > 0 
            ? `${consolidated.length} ativo${consolidated.length > 1 ? 's' : ''} na carteira. Clique para ver o histórico.`
            : "Nenhum ativo cadastrado ainda."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Investido</TableHead>
              <TableHead className="text-right">Atual</TableHead>
              <TableHead className="text-right">G/P</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consolidated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Adicione seu primeiro investimento clicando em "Novo Ativo".
                </TableCell>
              </TableRow>
            ) : (
              consolidated.map((group) => (
                <TableRow 
                  key={group.key}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => onRowClick(group)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{group.name}</span>
                      {group.ticker && <span className="text-xs text-slate-400">{group.ticker}</span>}
                      {group.entries.length > 1 && (
                        <span className="text-[10px] text-primary font-medium">{group.entries.length} aportes</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{group.assetType}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{group.totalQuantity.toLocaleString('pt-BR')}</span>
                      <span className="text-[10px] text-slate-400">PM {formatCurrency(group.avgPurchasePrice)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-700">{formatCurrency(group.totalInvested)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(group.totalCurrentValue)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    group.gp >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    <div className="flex flex-col items-end">
                      <span>{group.gp >= 0 ? "+" : ""}{formatCurrency(group.gp)}</span>
                      <span className="text-[10px] opacity-80">{group.gpPct.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="relative px-1" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => setOpenMenuKey(openMenuKey === group.key ? null : group.key)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    {openMenuKey === group.key && (
                      <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 overflow-hidden">
                        <button 
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          onClick={() => { onNewContribution(group); setOpenMenuKey(null); }}
                        >
                          <PlusCircle className="w-4 h-4 text-primary" />
                          Novo Aporte
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          onClick={() => { onRowClick(group); setOpenMenuKey(null); }}
                        >
                          <History className="w-4 h-4" />
                          Ver Histórico
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

// ──────────────────────────────────────
// Asset Detail Panel (Modal/Drawer)
// ──────────────────────────────────────
function AssetDetailPanel({ group, onClose, onNewContribution, onEditEntry, onDeleteEntry }: {
  group: any,
  onClose: () => void,
  onNewContribution: () => void,
  onEditEntry: (entry: any) => void,
  onDeleteEntry: (id: string) => void,
}) {
  const gp = group.gp;
  const isPositive = gp >= 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{group.name}</h3>
            {group.ticker && <p className="text-sm text-slate-400">{group.ticker} · {group.assetType}</p>}
          </div>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Total Investido</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(group.totalInvested)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Valor Atual</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(group.totalCurrentValue)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Qtd. Total</p>
              <p className="text-lg font-bold text-slate-900">{group.totalQuantity.toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-slate-400">PM: {formatCurrency(group.avgPurchasePrice)}</p>
            </div>
            <div className={cn(
              "rounded-xl p-4",
              isPositive ? "bg-emerald-50" : "bg-red-50"
            )}>
              <p className="text-xs text-slate-500 mb-1">Ganho/Prejuízo</p>
              <p className={cn("text-lg font-bold", isPositive ? "text-emerald-600" : "text-red-600")}>
                {isPositive ? "+" : ""}{formatCurrency(gp)}
              </p>
              <p className={cn("text-xs font-medium", isPositive ? "text-emerald-500" : "text-red-500")}>
                {group.gpPct.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Purchase History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="font-semibold text-slate-700">Histórico de Aportes</h4>
            </div>
            <div className="space-y-2">
              {group.entries
                .slice()
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group/entry">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800">
                        {entry.date ? new Date(`${entry.date}T00:00:00`).toLocaleDateString('pt-BR') : '—'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {Number(entry.quantity || 0).toLocaleString('pt-BR')} un. · {formatCurrency(entry.purchasePrice || (entry.invested / (entry.quantity || 1)))} cada
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">{formatCurrency(entry.invested)}</span>
                      <div className="hidden group-hover/entry:flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => onEditEntry(entry)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteEntry(entry.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* Dividends Section (placeholder) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-slate-400" />
              <h4 className="font-semibold text-slate-700">Proventos</h4>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
              <Gift className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Registre dividendos e JCP aqui em breve.</p>
            </div>
          </div>

          {/* Actions */}
          <Button className="w-full" onClick={onNewContribution}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Aporte em {group.name}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Add/Edit Form
// ──────────────────────────────────────
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
    name: "", ticker: "", assetType: "Ações", broker: "",
    quantity: "", purchasePrice: "", invested: "", currentValue: "",
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
    const investedVal = manualInvested || (qty * pPrice);
    const purchasePriceVal = pPrice || (manualInvested / (qty || 1));

    if (!formData.name) { alert("Por favor, preencha o nome do ativo."); return; }
    if (!investedVal || investedVal <= 0) { alert("Preencha o valor investido ou a quantidade e o preço médio."); return; }

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

  const autoInvested = Number(formData.quantity) * Number(formData.purchasePrice) || 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>
          {isContribution ? `Novo Aporte — ${formData.name}` : (editingInvestment ? "Editar Ativo" : "Novo Ativo")}
        </CardTitle>
        <CardDescription>
          {isContribution ? "Registre uma nova compra deste ativo." : (editingInvestment ? "Atualize as informações." : "Registre um novo investimento no portfólio.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inv-name">Nome do Ativo</Label>
            <Input id="inv-name" placeholder="Ex: BB Seguridade, Bitcoin" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-ticker">Ticker (para cotação)</Label>
            <Input id="inv-ticker" placeholder="Ex: BBSE3, IVVB11" value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inv-type">Tipo</Label>
            <select id="inv-type" className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={formData.assetType} onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}>
              {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-broker">Corretora</Label>
            <Input id="inv-broker" placeholder="Ex: XP, BTG, Inter" value={formData.broker}
              onChange={(e) => setFormData({ ...formData, broker: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inv-qty">Quantidade</Label>
            <Input id="inv-qty" type="number" placeholder="0" value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-price">Preço Médio (cota)</Label>
            <Input id="inv-price" type="number" placeholder="0,00" value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-invested">Total Investido</Label>
            <Input id="inv-invested" type="number" placeholder="Automático"
              value={formData.invested || (autoInvested > 0 ? autoInvested : "")}
              readOnly={!!(formData.quantity && formData.purchasePrice)}
              onChange={(e) => setFormData({ ...formData, invested: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inv-date">Data da Compra</Label>
            <Input id="inv-date" type="date" value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-current">Valor Atual (Total)</Label>
            <Input id="inv-current" type="number" placeholder="Opcional" value={formData.currentValue}
              onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : (editingInvestment && !isContribution ? "Atualizar Ativo" : "Registrar Ativo")}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────
// Stats / Chart Components
// ──────────────────────────────────────
function StatsCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-primary"><Icon className="w-6 h-6" /></div>
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
          <div className={cn("p-3 rounded-xl", isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
            {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Rentabilidade Total</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn("text-2xl font-bold", isPositive ? "text-emerald-600" : "text-red-600")}>
                {formatCurrency(value)}
              </h3>
              <span className={cn("text-sm font-bold", isPositive ? "text-emerald-500" : "text-red-500")}>
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
            <Pie data={distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {distribution.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  );
}
