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

const monthlyData = [
  { name: "Jan", earnings: 4500, expenses: 3200 },
  { name: "Fev", earnings: 5200, expenses: 3800 },
  { name: "Mar", earnings: 4800, expenses: 3100 },
  { name: "Abr", earnings: 6100, expenses: 4200 },
  { name: "Mai", earnings: 5900, expenses: 3900 },
  { name: "Jun", earnings: 6500, expenses: 4100 },
];

const categoryData = [
  { name: "Moradia", value: 4500, color: "#3B82F6" },
  { name: "Alimentação", value: 1200, color: "#60A5FA" },
  { name: "Transporte", value: 800, color: "#93C5FD" },
  { name: "Saúde", value: 600, color: "#BFDBFE" },
  { name: "Lazer", value: 1000, color: "#DBEAFE" },
];

const investmentData = [
  { name: "Jan", balance: 10000 },
  { name: "Fev", balance: 11500 },
  { name: "Mar", balance: 12100 },
  { name: "Abr", balance: 13500 },
  { name: "Mai", balance: 14800 },
  { name: "Jun", balance: 16200 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-slate-500 text-lg">Bem-vindos de volta, Maria Cecília & Vinícius.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Receita Mensal" 
          value={6500} 
          trend="+12%" 
          trendType="up"
          icon={TrendingUp}
          color="blue"
        />
        <SummaryCard 
          title="Despesas Mensais" 
          value={4100} 
          trend="+5%" 
          trendType="down"
          icon={TrendingDown}
          color="blue"
        />
        <SummaryCard 
          title="Saldo Líquido" 
          value={2400} 
          trend="+18%" 
          trendType="up"
          icon={DollarSign}
          color="blue"
        />
        <SummaryCard 
          title="Total Investido" 
          value={16200} 
          trend="+4.5%" 
          trendType="up"
          icon={LineChartIcon}
          color="blue"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ganhos vs Despesas</CardTitle>
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
                />
                <Bar dataKey="earnings" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" fill="#DBEAFE" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
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
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Evolução dos Investimentos</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={investmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
