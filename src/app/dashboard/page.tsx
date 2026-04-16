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
  ChevronRight,
  ChevronLeft,
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
import { getEarnings, getExpenses, getInvestments, getDividends } from "@/lib/firebase/db";
import { startOfMonth, subMonths, format, isWithinInterval, parseISO, isSameMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    monthlyEarnings: 0,
    monthlyExpenses: 0,
    netBalance: 0,
    totalInvested: 0,
    totalMarketValue: 0,
    totalDividends: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [allExpensesList, setAllExpensesList] = useState<any[]>([]);
  const [categoryMonth, setCategoryMonth] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [
          mariaEarnings, 
          viniciusEarnings, 
          allExpenses,
          mariaInvestments,
          viniciusInvestments,
          mariaDividends,
          viniciusDividends
        ] = await Promise.all([
          getEarnings("maria") as Promise<any[]>,
          getEarnings("vinicius") as Promise<any[]>,
          getExpenses() as Promise<any[]>,
          getInvestments("maria") as Promise<any[]>,
          getInvestments("vinicius") as Promise<any[]>,
          getDividends("maria") as Promise<any[]>,
          getDividends("vinicius") as Promise<any[]>
        ]);

        const allEarnings = [...mariaEarnings, ...viniciusEarnings];
        const allInvestments = [...mariaInvestments, ...viniciusInvestments];
        const allDividends = [...mariaDividends, ...viniciusDividends];
        
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

        // 2. Investment Metrics (Family Consolidated)
        const familyTotalInvested = allInvestments.reduce((acc, curr) => acc + (Number(curr.invested) || 0), 0);
        const familyTotalMarketValue = allInvestments.reduce((acc, curr) => acc + (Number(curr.currentValue) || 0), 0);
        const familyTotalDividends = allDividends.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        setMetrics({
          monthlyEarnings: currentMonthEarnings,
          monthlyExpenses: currentMonthExpenses,
          netBalance: currentMonthEarnings - currentMonthExpenses,
          totalInvested: familyTotalInvested,
          totalMarketValue: familyTotalMarketValue,
          totalDividends: familyTotalDividends
        });

        // 3. Aggregate Monthly Data (Last 6 Months)
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
        setAllExpensesList(allExpenses);

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const { categoryData, detailedCategoryData } = React.useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    const detailedDetails: Record<string, any[]> = {};
    const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#F43F5E", "#84CC16", "#EAB308"];

    const filtered = allExpensesList.filter(e => {
      const d = e.date?.seconds 
        ? new Date(e.date.seconds * 1000) 
        : (typeof e.date === 'string' ? new Date(e.date + 'T00:00:00') : new Date(e.date));
      return isSameMonth(d, categoryMonth);
    });

    filtered.forEach(e => {
      const parts = (e.category || "Outros").split(" > ");
      const parent = parts[0];
      const sub = parts[1] || parent;
      
      expensesByCategory[parent] = (expensesByCategory[parent] || 0) + (Number(e.amount) || 0);

      if (!detailedDetails[parent]) detailedDetails[parent] = [];
      const existing = detailedDetails[parent].find((s: any) => s.name === sub);
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

    const catData = Object.entries(expensesByCategory)
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value);

    Object.keys(detailedDetails).forEach(cat => {
      detailedDetails[cat].sort((a: any, b: any) => b.value - a.value);
    });

    return { categoryData: catData, detailedCategoryData: detailedDetails };
  }, [allExpensesList, categoryMonth]);

  const profitLoss = (metrics.totalMarketValue - metrics.totalInvested) + metrics.totalDividends;
  const profitPercentage = metrics.totalInvested > 0 ? (profitLoss / metrics.totalInvested) * 100 : 0;

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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Painel Geral</h2>
        <p className="text-slate-500 text-lg">Visão consolidada da saúde financeira da família.</p>
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
          title="Patrimônio Total" 
          value={metrics.totalMarketValue + metrics.totalDividends} 
          trend={`${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%`} 
          trendType={profitPercentage >= 0 ? "up" : "down"}
          icon={Briefcase}
          color="blue"
          subtitle={`Investido: ${formatCurrency(metrics.totalInvested)}`}
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Gastos por Categoria</CardTitle>
            <span className="text-xs font-semibold text-slate-500 capitalize bg-slate-100 px-2 py-1 rounded-md">
              {format(categoryMonth, 'MMMM', { locale: ptBR })}
            </span>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <div className="w-full h-full relative">
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
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button className="p-1 hover:bg-slate-200 rounded-lg text-slate-600" onClick={() => setCategoryMonth(subMonths(categoryMonth, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold w-24 text-center capitalize text-slate-700">
                      {format(categoryMonth, 'MMM yyyy', { locale: ptBR })}
                    </span>
                    <button className="p-1 hover:bg-slate-200 rounded-lg text-slate-600" onClick={() => setCategoryMonth(addMonths(categoryMonth, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-500 text-sm hidden sm:block">Navegue pelas categorias para ver as subcategorias de cada uma.</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden flex-1 flex flex-col md:flex-row">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly History Block */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Histórico Mensal Detalhado</CardTitle>
          <p className="text-slate-500 text-sm">Acompanhe a evolução de ganhos e gastos mês a mês para controle ao longo do tempo.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mês</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ganhos</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Líquido</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-40">Proporção</th>
                </tr>
              </thead>
              <tbody>
                {[...monthlyData].reverse().map((month, i) => {
                  const saldo = month.earnings - month.expenses;
                  const isPositive = saldo >= 0;
                  const maxVal = Math.max(month.earnings, month.expenses, 1);
                  const earningsWidth = Math.round((month.earnings / maxVal) * 100);
                  const expensesWidth = Math.round((month.expenses / maxVal) * 100);
                  return (
                    <tr key={month.monthKey || i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-700 capitalize">{month.name}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-emerald-600">{formatCurrency(month.earnings)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-red-500">{formatCurrency(month.expenses)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={cn("font-bold text-base", isPositive ? "text-emerald-600" : "text-red-600")}>
                          {isPositive ? "+" : ""}{formatCurrency(saldo)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${earningsWidth}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-red-400 h-1.5 rounded-full transition-all" style={{ width: `${expensesWidth}%` }} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 rounded-xl">
                  <td className="py-4 px-4 font-bold text-slate-900">Total (6 meses)</td>
                  <td className="py-4 px-4 text-right font-black text-emerald-600">
                    {formatCurrency(monthlyData.reduce((acc, m) => acc + m.earnings, 0))}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-red-500">
                    {formatCurrency(monthlyData.reduce((acc, m) => acc + m.expenses, 0))}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {(() => {
                      const totalSaldo = monthlyData.reduce((acc, m) => acc + (m.earnings - m.expenses), 0);
                      return (
                        <span className={cn("font-black text-base", totalSaldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                          {totalSaldo >= 0 ? "+" : ""}{formatCurrency(totalSaldo)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-4 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* NEW: Family Investment Context Summary */}
      <Card className="w-full bg-slate-900 text-white border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl text-white">Resumo de Investimentos da Família</CardTitle>
          <p className="text-slate-400">Visão consolidada de todas as contas.</p>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Investido Total</p>
              <p className="text-3xl font-black text-white">{formatCurrency(metrics.totalInvested)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Patrimônio Atual</p>
              <p className="text-3xl font-black text-emerald-400">{formatCurrency(metrics.totalMarketValue + metrics.totalDividends)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Retorno Total acumulado</p>
              <div className="flex items-baseline gap-3">
                <p className={cn("text-3xl font-black", profitLoss >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatCurrency(profitLoss)}
                </p>
                <span className={cn("text-lg font-bold", profitLoss >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {profitPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4 text-sm text-slate-300">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500" />
                 <span>Rendimento Passivo (Proventos): <strong>{formatCurrency(metrics.totalDividends)}</strong></span>
               </div>
             </div>
             <a href="/investments" className="text-xs font-bold bg-white text-slate-900 px-6 py-2.5 rounded-full hover:bg-slate-100 transition-colors">
               Ver Detalhes dos Ativos
             </a>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}

function SummaryCard({ title, value, trend, trendType, icon: Icon, color, subtitle }: any) {
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
          {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
