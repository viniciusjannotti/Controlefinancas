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
  Gift,
  DollarSign,
  Users
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
import { 
  addInvestment, 
  getInvestments, 
  updateInvestment, 
  updateInvestmentValue, 
  deleteInvestment,
  addDividend,
  getDividends,
  deleteDividend
} from "@/lib/firebase/db";
import { fetchStockPrices } from "@/lib/stockApi";

const assetTypes = ["Ações", "ETFs", "Renda Fixa", "Crypto", "Outro"];
const dividendTypes = ["Dividendo", "JCP", "Rendimento", "Outro"];

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
function consolidateInvestments(investments: any[], dividends: any[]) {
  const groups: Record<string, any> = {};

  for (const inv of investments) {
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
        totalDividends: 0,
        dividendEntries: [],
      };
    }
    const assetGroup = groups[key];
    assetGroup.totalInvested += Number(inv.invested) || 0;
    assetGroup.totalQuantity += Number(inv.quantity) || 0;
    assetGroup.totalCurrentValue += Number(inv.currentValue) || 0;
    assetGroup.entries.push(inv);
  }

  for (const div of dividends) {
    const key = div.ticker ? div.ticker.toUpperCase().trim() : div.name;
    if (groups[key]) {
      groups[key].totalDividends += Number(div.amount) || 0;
      groups[key].dividendEntries.push(div);
    }
  }

  return Object.values(groups).map((g: any) => {
    const gpValorization = g.totalCurrentValue - g.totalInvested;
    const totalReturn = gpValorization + g.totalDividends;
    return {
      ...g,
      avgPurchasePrice: g.totalQuantity > 0 ? g.totalInvested / g.totalQuantity : 0,
      gp: gpValorization,
      totalReturn,
      gpPct: g.totalInvested > 0 ? (totalReturn / g.totalInvested) * 100 : 0,
    };
  });
}

// ──────────────────────────────────────
// Main Page
// ──────────────────────────────────────
export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState("maria");
  const [allInvestments, setAllInvestments] = useState<any[]>([]);
  const [allDividends, setAllDividends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDivForm, setShowDivForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any | null>(null);
  const [selectedAssetForDiv, setSelectedAssetForDiv] = useState<any | null>(null);
  const [isContribution, setIsContribution] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [mariaInv, viniciusInv, mariaDiv, viniciusDiv] = await Promise.all([
        getInvestments("maria"),
        getInvestments("vinicius"),
        getDividends("maria"),
        getDividends("vinicius")
      ]);
      
      const combinedInv = [
        ...mariaInv.map(i => ({ ...i, user: 'maria' })), 
        ...viniciusInv.map(i => ({ ...i, user: 'vinicius' }))
      ];
      const combinedDiv = [
        ...mariaDiv.map(d => ({ ...d, user: 'maria' })), 
        ...viniciusDiv.map(d => ({ ...d, user: 'vinicius' }))
      ];

      setAllInvestments(combinedInv);
      setAllDividends(combinedDiv);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefreshQuotes = async () => {
    const tickers = allInvestments
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

      for (const inv of allInvestments) {
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

      await fetchData();

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
    fetchData();
  }, [fetchData]);

  // Tab-specific filtered data for the table
  const selectedInvestments = useMemo(() => allInvestments.filter(i => i.user === activeTab), [allInvestments, activeTab]);
  const selectedDividends = useMemo(() => allDividends.filter(d => d.user === activeTab), [allDividends, activeTab]);

  const consolidatedTotal = useMemo(() => consolidateInvestments(allInvestments, allDividends), [allInvestments, allDividends]);
  const consolidatedTable = useMemo(() => consolidateInvestments(selectedInvestments, selectedDividends), [selectedInvestments, selectedDividends]);

  // GLOBAL Portfolio Stats (Sum of both accounts)
  const totalInvested = allInvestments.reduce((acc, curr) => acc + (Number(curr.invested) || 0), 0);
  const currentValue = allInvestments.reduce((acc, curr) => acc + (Number(curr.currentValue) || 0), 0);
  const totalDivsReceived = allDividends.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalProfitLoss = (currentValue - totalInvested) + totalDivsReceived;
  const profitPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const distribution = Object.entries(
    allInvestments.reduce((acc, curr) => {
      const type = curr.type || curr.assetType || "Outro";
      acc[type] = (acc[type] || 0) + (Number(curr.currentValue) || 0);
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

  React.useEffect(() => {
    if (selectedAsset) {
      const updated = consolidatedTotal.find(g => g.key === selectedAsset.key);
      if (updated) setSelectedAsset(updated);
    }
  }, [consolidatedTotal]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full w-fit mb-2">
            <Users className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Patrimônio Consolidado</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Resumo da Família</h2>
          <p className="text-slate-500 text-lg">Acompanhe o total de Maria Cecília + Vinícius.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Sincronizar
          </Button>
          <Button onClick={handleRefreshQuotes} disabled={loading}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Atualizar Cotações
          </Button>
        </div>
      </div>

      {/* GLOBAL Stats Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard title="Investimento Total (Família)" value={totalInvested} icon={Briefcase} />
        <StatsCard title="Saldo Atual + Proventos" value={currentValue + totalDivsReceived} icon={Activity} subtitle={`Total Recebido: ${formatCurrency(totalDivsReceived)}`} />
        <ProfitCard title="Rentabilidade Geral" value={totalProfitLoss} percentage={profitPercentage} />
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
                    onSave={() => { closeForm(); fetchData(); }}
                    onCancel={closeForm}
                    editingInvestment={editingInvestment}
                    isContribution={isContribution}
                  />
                )}
                <ConsolidatedTable 
                  consolidated={consolidatedTable}
                  loading={loading}
                  onRowClick={(assetGroup: any) => setSelectedAsset(assetGroup)}
                  onNewContribution={(assetGroup: any) => {
                    openForm(assetGroup.entries[0], true);
                    setSelectedAsset(null);
                  }}
                />
              </div>
              <div className="space-y-6">
                {/* GLOBAL Allocation - Shows dashboard total context */}
                <AllocationCard distribution={distribution} COLORS={COLORS} title="Alocação da Família" />
                <SmartAllocationCard distribution={distribution} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Crescimento do Patrimônio Combinado</CardTitle>
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
          assetGroup={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onNewContribution={() => {
            openForm(selectedAsset.entries[0], true);
            setSelectedAsset(null);
          }}
          onEditEntry={(entry: any) => {
            openForm(entry, false);
            setSelectedAsset(null);
          }}
          onDeleteEntry={async (id: string) => {
            if (confirm("Excluir esta entrada do histórico?")) {
              await deleteInvestment(id);
              fetchData();
              setSelectedAsset(null);
            }
          }}
          onAddDividend={() => {
            setSelectedAssetForDiv(selectedAsset);
            setShowDivForm(true);
          }}
          onDeleteDividend={async (id: string) => {
            if (confirm("Excluir este provento?")) {
              await deleteDividend(id);
              fetchData();
            }
          }}
        />
      )}

      {/* Dividend Form Overlay */}
      {showDivForm && selectedAssetForDiv && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDivForm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Novo Provento — {selectedAssetForDiv.name}</h3>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowDivForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <AddDividendForm 
              asset={selectedAssetForDiv}
              userId={activeTab} // Uses current active user for saving
              onSave={() => {
                setShowDivForm(false);
                fetchData();
              }}
              onCancel={() => setShowDivForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────
// Consolidated Table
// ──────────────────────────────────────
function ConsolidatedTable({ consolidated, loading, onRowClick, onNewContribution }: any) {
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
        <CardDescription>Portfólio individual. Clique para ver detalhes e proventos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Investido</TableHead>
              <TableHead className="text-right">Atual</TableHead>
              <TableHead className="text-right">G/P Total</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consolidated.map((assetGroup: any) => (
              <TableRow key={assetGroup.key} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => onRowClick(assetGroup)}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{assetGroup.name}</span>
                    <span className="text-xs text-slate-400">{assetGroup.ticker || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell><span className="text-sm text-slate-600">{assetGroup.assetType}</span></TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{assetGroup.totalQuantity.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-slate-400">PM {formatCurrency(assetGroup.avgPurchasePrice)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-slate-700">{formatCurrency(assetGroup.totalInvested)}</TableCell>
                <TableCell className="text-right font-bold">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(assetGroup.totalCurrentValue)}</span>
                    {assetGroup.totalDividends > 0 && <span className="text-[9px] text-emerald-600">+{formatCurrency(assetGroup.totalDividends)} prov.</span>}
                  </div>
                </TableCell>
                <TableCell className={cn("text-right font-medium", assetGroup.totalReturn >= 0 ? "text-emerald-500" : "text-red-500")}>
                  <div className="flex flex-col items-end">
                    <span>{assetGroup.totalReturn >= 0 ? "+" : ""}{formatCurrency(assetGroup.totalReturn)}</span>
                    <span className="text-[10px] opacity-80">{assetGroup.gpPct.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="px-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setOpenMenuKey(openMenuKey === assetGroup.key ? null : assetGroup.key)}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────
// Asset Detail Panel
// ──────────────────────────────────────
function AssetDetailPanel({ assetGroup, onClose, onNewContribution, onEditEntry, onDeleteEntry, onAddDividend, onDeleteDividend }: any) {
  const gpTotal = assetGroup.totalReturn;
  const isPositive = gpTotal >= 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{assetGroup.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{assetGroup.ticker || "N/A"}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-bold">{assetGroup.user === 'maria' ? 'CECÍLIA' : 'VINÍCIUS'}</span>
            </div>
          </div>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-3">
            <DetailStat label="Total Investido" value={formatCurrency(assetGroup.totalInvested)} />
            <DetailStat label="Valor de Mercado" value={formatCurrency(assetGroup.totalCurrentValue)} />
            <DetailStat label="Dividendos Totais" value={formatCurrency(assetGroup.totalDividends)} color="text-emerald-600" />
            <DetailStat 
              label="Resultado Total" 
              value={`${isPositive ? "+" : ""}${formatCurrency(gpTotal)}`} 
              subtitle={`${assetGroup.gpPct.toFixed(2)}%`}
              color={isPositive ? "text-emerald-600" : "text-red-600"}
              bg={isPositive ? "bg-emerald-50" : "bg-red-50"}
            />
          </div>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><History className="w-4 h-4" /> Histórico de Aportes</div>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onNewContribution}><Plus className="w-3 h-3 mr-1" /> Aporte</Button>
            </div>
            <div className="space-y-2">
              {assetGroup.entries
                .slice()
                .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""))
                .map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group/item">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{formatDate(entry.date)}</p>
                    <p className="text-[10px] text-slate-400">{entry.quantity} un. @ {formatCurrency(entry.purchasePrice)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">{formatCurrency(entry.invested)}</span>
                    <div className="hidden group-hover/item:flex items-center gap-1">
                      <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => onEditEntry(entry)}><Edit3 className="w-3 h-3" /></Button>
                      <Button variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => onDeleteEntry(entry.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><Gift className="w-4 h-4" /> Proventos Recebidos</div>
              <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={onAddDividend}>
                <Plus className="w-3 h-3 mr-1" /> Provento
              </Button>
            </div>
            {assetGroup.dividendEntries.length > 0 ? (
              <div className="space-y-2">
                {assetGroup.dividendEntries
                  .slice()
                  .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""))
                  .map((div: any) => (
                  <div key={div.id} className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl group/div">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">{formatDate(div.date)}</p>
                      <p className="text-[10px] text-emerald-600/70">{div.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(div.amount)}</span>
                      <Button variant="ghost" className="h-7 w-7 p-0 text-emerald-600 opacity-0 group-hover/div:opacity-100 hover:bg-emerald-100" onClick={() => onDeleteDividend(div.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-xs">
                Nenhum provento registrado.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, subtitle, color = "text-slate-900", bg = "bg-slate-50" }: any) {
  return (
    <div className={cn("p-4 rounded-xl", bg)}>
      <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-semibold">{label}</p>
      <p className={cn("text-lg font-bold leading-none", color)}>{value}</p>
      {subtitle && <p className={cn("text-[10px] mt-1 font-bold", color)}>{subtitle}</p>}
    </div>
  );
}

// ──────────────────────────────────────
// Add Dividend Form
// ──────────────────────────────────────
function AddDividendForm({ asset, userId, onSave, onCancel }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    type: "Dividendo",
    ticker: asset.ticker || "",
    name: asset.name
  });

  const handleSubmit = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) { alert("Informe um valor válido."); return; }
    setLoading(true);
    try {
      await addDividend(userId, { ...formData, amount: Number(formData.amount) });
      onSave();
    } catch (error) {
      alert("Erro ao salvar provento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Data do Pagamento</Label>
        <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Valor Total Recebido</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-9" type="number" placeholder="0,00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <select className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
          value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
          {dividendTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : "Confirmar Recebimento"}</Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Forms / Cards Helpers (as before)
// ──────────────────────────────────────
function AddInvestmentForm({ type, onSave, onCancel, editingInvestment, isContribution }: any) {
  const [loading, setLoading] = useState(false);
  const defaultForm = { name: "", ticker: "", assetType: "Ações", broker: "", quantity: "", purchasePrice: "", invested: "", currentValue: "", date: new Date().toISOString().split('T')[0] };
  const [formData, setFormData] = useState(defaultForm);
  React.useEffect(() => {
    if (editingInvestment) {
      setFormData({
        name: editingInvestment.name || "", ticker: editingInvestment.ticker || "", assetType: editingInvestment.assetType || "Ações",
        broker: editingInvestment.broker || "", quantity: isContribution ? "" : (editingInvestment.quantity?.toString() || ""),
        purchasePrice: isContribution ? "" : (editingInvestment.purchasePrice?.toString() || ""),
        invested: isContribution ? "" : (editingInvestment.invested?.toString() || ""), 
        currentValue: isContribution ? "" : (editingInvestment.currentValue?.toString() || ""),
        date: isContribution ? new Date().toISOString().split('T')[0] : (editingInvestment.date || new Date().toISOString().split('T')[0])
      });
    } else { setFormData(defaultForm); }
  }, [editingInvestment, isContribution]);

  const handleSubmit = async () => {
    const qty = Number(formData.quantity) || 0;
    const pPrice = Number(formData.purchasePrice) || 0;
    const manualInvested = Number(formData.invested) || 0;
    if (!formData.name) { alert("Nome obrigatório"); return; }
    setLoading(true);
    try {
      const payload = { ...formData, ticker: (formData.ticker || "").toUpperCase().trim(), quantity: qty || 1, 
        purchasePrice: pPrice || (manualInvested / (qty || 1)), invested: manualInvested || (qty * pPrice),
        currentValue: Number(formData.currentValue || manualInvested || (qty * pPrice))
      };
      if (editingInvestment && !isContribution) { await updateInvestment(editingInvestment.id, payload); }
      else { await addInvestment(type, payload); }
      onSave();
    } catch (error) { alert("Erro ao salvar"); } finally { setLoading(false); }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader><CardTitle>{isContribution ? `Novo Aporte — ${formData.name}` : (editingInvestment ? "Editar Ativo" : "Novo Ativo")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Ticker</Label><Input placeholder="PETR4, BBSE3" value={formData.ticker} onChange={(e) => setFormData({ ...formData, ticker: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Qtd</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></div>
          <div className="space-y-2"><Label>Preço Unit.</Label><Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} /></div>
          <div className="space-y-2"><Label>Investido Total</Label><Input type="number" value={formData.invested || (Number(formData.quantity) * Number(formData.purchasePrice) || "")} onChange={(e) => setFormData({ ...formData, invested: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
          <div className="space-y-2"><Label>Corretora</Label><Input value={formData.broker} onChange={(e) => setFormData({ ...formData, broker: e.target.value })} /></div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : "Salvar Registro"}</Button>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ title, value, icon: Icon, subtitle }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-primary"><Icon className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(value)}</h3>
            {subtitle && <p className="text-[10px] text-emerald-600 font-bold">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfitCard({ title, value, percentage }: { title: string, value: number, percentage: number }) {
  const isPositive = value >= 0;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={isPositive ? "bg-emerald-50 text-emerald-600 p-3 rounded-xl" : "bg-red-50 text-red-600 p-3 rounded-xl"}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={cn("text-2xl font-bold", isPositive ? "text-emerald-600" : "text-red-600")}>{formatCurrency(value)}</h3>
              <span className={cn("text-sm font-bold", isPositive ? "text-emerald-500" : "text-red-500")}>{isPositive ? "+" : ""}{percentage.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AllocationCard({ distribution, COLORS, title = "Alocação" }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {distribution.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-1">
          {distribution.map((item: any, index: number) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div> {item.name}</div>
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
    <Card className="bg-slate-900 text-white border-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
      <CardHeader><CardTitle className="text-white text-lg">Dica de Gestão Família</CardTitle></CardHeader>
      <CardContent>
        <p className="text-slate-400 text-xs leading-relaxed">Sua maior alocação familiar está em <span className="text-white font-bold">{distribution[0]?.name || "N/A"}</span>. Considere diversificar entre as contas para otimização fiscal e redução de risco.</p>
        <Button className="w-full mt-4 bg-white text-slate-900 border-none h-9 text-xs">Análise Detalhada</Button>
      </CardContent>
    </Card>
  );
}
