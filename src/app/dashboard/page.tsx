"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
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

        const colors = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE", "#1D4ED8", "#1E40AF"];
        const catData = Object.entries(expensesByCategory)
          .map(([name, value], i) => ({
            name,
            value,
            color: colors[i % colors.length]
          }))
          .sort((a, b) => b.value - a.value);

        setCategoryData(catData);

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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
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
                <Bar dataKey="earnings" name="Ganhos" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" name="Gastos" fill="#DBEAFE" radius={[4, 4, 0, 0]} barSize={20} />
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm italic">Nenhum gasto registrado.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
