"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ChevronRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { getEarnings, getExpenses } from "@/lib/firebase/db";
import { startOfMonth, subMonths, format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const investmentDataMock = [
  { name: "Jan", balance: 10000 },
  { name: "Fev", balance: 11500 },
  { name: "Mar", balance: 12100 },
  { name: "Abr", balance: 13500 },
  { name: "Mai", balance: 14800 },
  { name: "Jun", balance: 16200 },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    monthlyEarnings: 0,
    monthlyExpenses: 0,
    netBalance: 0,
    totalInvested: 16200, // Keep mock for now
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [detailedCategoryData, setDetailedCategoryData] = useState<Record<string, any[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [mariaEarnings, viniciusEarnings, allExpenses] = await Promise.all([
          getEarnings("maria") as Promise<any[]>,
          getEarnings("vinicius") as Promise<any[]>,
          getExpenses() as Promise<any[]>
        ]);

        const allEarnings = [...mariaEarnings, ...viniciusEarnings];
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        
        // 1. Calculate Summary Metrics (Current Month)
        const currentMonthEarnings = allEarnings
          .filter(e => {
            const d = e.date?.seconds ? new Date(e.date.seconds * 1000) : new Date(e.date + 'T00:00:00');
            return d >= startOfCurrentMonth;
          })
          .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        const currentMonthExpenses = allExpenses
          .filter(e => {
            const d = e.date?.seconds ? new Date(e.date.seconds * 1000) : new Date(e.date + 'T00:00:00');
            return d >= startOfCurrentMonth;
          })
          .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        setMetrics(prev => ({
          ...prev,
          monthlyEarnings: currentMonthEarnings,
          monthlyExpenses: currentMonthExpenses,
          netBalance: currentMonthEarnings - currentMonthExpenses
        }));

        // 2. Aggregate Monthly Data (Last 6 Months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = subMonths(now, 5 - i);
          return {
            name: format(d, 'MMM', { locale: ptBR }),
            monthKey: format(d, 'yyyy-MM'),
            earnings: 0,
            expenses: 0
          };
        });

        allEarnings.forEach(e => {
          const d = e.date?.seconds ? new Date(e.date.seconds * 1000) : new Date(e.date + 'T00:00:00');
          const key = format(d, 'yyyy-MM');
          const monthIdx = last6Months.findIndex(m => m.monthKey === key);
          if (monthIdx !== -1) {
            last6Months[monthIdx].earnings += (Number(e.amount) || 0);
          }
        });

        allExpenses.forEach(e => {
          const d = e.date?.seconds ? new Date(e.date.seconds * 1000) : new Date(e.date + 'T00:00:00');
          const key = format(d, 'yyyy-MM');
          const monthIdx = last6Months.findIndex(m => m.monthKey === key);
          if (monthIdx !== -1) {
            last6Months[monthIdx].expenses += (Number(e.amount) || 0);
          }
        });

        setMonthlyData(last6Months);

        // 3. Aggregate Expenses by Category
        const expensesByCategory: Record<string, number> = {};
        allExpenses.forEach(e => {
          const parentCategory = (e.category || "Outros").split(" > ")[0];
          expensesByCategory[parentCategory] = (expensesByCategory[parentCategory] || 0) + (Number(e.amount) || 0);
        });

        const colors = [
          "#3B82F6", // Blue
          "#8B5CF6", // Purple
          "#10B981", // Emerald
          "#F59E0B", // Amber
          "#EC4899", // Pink
          "#6366F1", // Indigo
          "#14B8A6", // Teal
          "#F43F5E", // Rose
          "#84CC16", // Lime
          "#EAB308", // Yellow
        ];
        const catData = Object.entries(expensesByCategory)
          .map(([name, value], i) => ({
            name,
            value,
            color: colors[i % colors.length]
          }))
          .sort((a, b) => b.value - a.value);

        setCategoryData(catData);

        // 4. Aggregate Detailed Data for Sub-categories
        const detailedDetails: Record<string, any[]> = {};
        allExpenses.forEach(e => {
          const parts = (e.category || "Outros").split(" > ");
          const parent = parts[0];
          const sub = parts[1] || parent;
          
          if (!detailedDetails[parent]) detailedDetails[parent] = [];
          
          const existing = detailedDetails[parent].find(s => s.name === sub);
          if (existing) {
            existing.value += (Number(e.amount) || 0);
          } else {
            detailedDetails[parent].push({
              name: sub,
              value: (Number(e.amount) || 0),
              color: colors[detailedDetails[parent].length % colors.length]
            });
          }
        });

        // Sort subcategories by value
        Object.keys(detailedDetails).forEach(cat => {
          detailedDetails[cat].sort((a, b) => b.value - a.value);
        });

        setDetailedCategoryData(detailedDetails);

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 animate-pulse">Carregando dados do dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Painel</h2>
        <p className="text-slate-500 text-lg">Bem-vindos de volta, Maria Cecília & Vinícius.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Receita Mensal" 
          value={metrics.monthlyEarnings} 
          trend="+12%" 
          trendType="up"
          icon={TrendingUp}
          color="blue"
        />
        <SummaryCard 
          title="Gastos Mensais" 
          value={metrics.monthlyExpenses} 
          trend="+5%" 
          trendType="down"
          icon={TrendingDown}
          color="blue"
        />
        <SummaryCard 
          title="Saldo Líquido" 
          value={metrics.netBalance} 
          trend="+18%" 
          trendType="up"
          icon={DollarSign}
          color="blue"
        />
        <SummaryCard 
          title="Total Investido" 
          value={metrics.totalInvested} 
          trend="+4.5%" 
          trendType="up"
          icon={LineChartIcon}
          color="blue"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ganhos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="earnings" name="Ganhos" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <div className="w-full h-full relative" onClick={() => categoryData[0]?.name && setSelectedCategory(categoryData[0].name)}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart cx="50%" cy="50%">
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      onClick={(data) => data && data.name && setSelectedCategory(data.name)}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-400 font-medium">Clique para</span>
                  <span className="text-xs text-slate-400 font-medium font-bold">detalhes</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Nenhum gasto registrado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Overlay */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-300 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="w-2 h-8 bg-primary rounded-full" />
                  Detalhamento de Gastos
                </CardTitle>
                <p className="text-slate-500 text-sm mt-1">Navegue pelas categorias para ver as subcategorias de cada uma.</p>
              </div>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden flex-1 flex flex-col md:flex-row">
              
              {/* Sidebar with Categories */}
              <div className="w-full md:w-1/3 bg-slate-50/50 border-r border-slate-100 overflow-x-auto md:overflow-y-auto flex flex-row md:flex-col p-4 gap-2 shrink-0 md:h-full">
                {categoryData.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={cn(
                      "text-left px-4 py-3 rounded-xl transition-all font-medium text-sm flex justify-between items-center whitespace-nowrap md:whitespace-normal group",
                      selectedCategory === cat.name 
                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                        : "bg-white border border-slate-200 text-slate-600 hover:border-primary/30 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className={cn("text-xs ml-4 shrink-0", selectedCategory === cat.name ? "text-primary-foreground/80" : "text-slate-400 group-hover:text-slate-600")}>
                      {formatCurrency(cat.value)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Detail View */}
              <div className="w-full md:w-2/3 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-slate-800">{selectedCategory}</h3>
                  <span className="text-xl font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full">
                    {formatCurrency(categoryData.find(c => c.name === selectedCategory)?.value || 0)}
                  </span>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  <div className="h-[250px] flex items-center justify-center bg-white rounded-2xl border border-slate-100 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={detailedCategoryData[selectedCategory] || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {(detailedCategoryData[selectedCategory] || []).map((entry: any, index: number) => (
                            <Cell key={`cell-detailed-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any) => formatCurrency(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-500 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Subcategorias</h4>
                    <div className="space-y-2">
                      {(detailedCategoryData[selectedCategory] || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between group p-3 bg-slate-50 hover:bg-slate-100 hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            <span className="text-sm font-bold text-slate-900">{formatCurrency(item.value)}</span>
                            <span className="text-[10px] text-slate-500 font-medium bg-white border border-slate-200 px-1.5 py-0.5 rounded-md min-w-[40px] text-center">
                              {((item.value / categoryData.find(c => c.name === selectedCategory)?.value) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="pt-0.5">
                    <h5 className="text-sm font-bold text-blue-900">Insight Rápido</h5>
                    <p className="text-xs text-blue-700/80 leading-relaxed mt-1">
                      <strong className="font-semibold">{detailedCategoryData[selectedCategory]?.[0]?.name}</strong> representa a maior parte dos gastos em {selectedCategory}. 
                      Monitorar de perto essa subcategoria pode ajudar a identificar oportunidades de economia.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Evolução dos Investimentos</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={investmentDataMock} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
</div>
  );
}

function SummaryCard({ title, value, trend, trendType, icon: Icon, color }: any) {
  return (
    <Card className="hover:scale-[1.02] transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            trendType === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trendType === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
