"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Wallet,
  Tag,
  Users,
  CreditCard,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Trash2,
  Edit3,
  History,
  DollarSign
} from "lucide-react";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Pie
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/Card";
import { Button, Input, Label, Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/index";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { addExpense, getExpenses, updateExpense, deleteExpense } from "@/lib/firebase/db";
// import { toast } from "sonner";
import { useGame } from "@/lib/game/GameContext";
import { useAuth } from "@/lib/auth/AuthContext";

// Hierarchical categories matching the household budget structure
const categoryTree: { label: string; sub?: string[] }[] = [
  { label: "PA", sub: ["Aluguel", "CEMIG", "COPASA", "Gás"] },
  { label: "BH", sub: ["COND-BH", "IPTU"] },
  { label: "Internet/Telefone" },
  { label: "Unimed" },
  { label: "Netf/ Spotify/ Google" },
  { label: "Pós/ Curs/ Prov" },
  { label: "Ativ Física" },
  { label: "Alimentação", sub: ["Delivery", "Mercado", "Restaurantes"] },
  { label: "Casa" },
  { label: "Carro", sub: ["Gasolina", "Manut/ Tx"] },
  { label: "Itens Pessoais" },
  { label: "Kikita e Dodora" },
  { label: "Lazer" },
  { label: "Presentes/ Doações" },
  { label: "Saúde" },
  { label: "Transporte" },
  { label: "Trabalho" },
  { label: "Viagens", sub: ["Hospedagem", "Passagem", "Passeios/ Outros"] },
  { label: "DARF/ Txs Gov/ Inve" },
];

// All flat categories for colors/tags (parent + sub combined)
const allCategories = categoryTree.flatMap(c =>
  c.sub ? [c.label, ...c.sub.map(s => `${c.label} > ${s}`)] : [c.label]
);

const categoryColors: Record<string, string> = {
  "PA": "#3B82F6",
  "BH": "#6366F1",
  "Internet/Telefone": "#8B5CF6",
  "Unimed": "#EF4444",
  "Netf/ Spotify/ Google": "#EC4899",
  "Pós/ Curs/ Prov": "#F59E0B",
  "Ativ Física": "#10B981",
  "Alimentação": "#F97316",
  "Casa": "#64748B",
  "Carro": "#0EA5E9",
  "Itens Pessoais": "#A855F7",
  "Kikita e Dodora": "#F43F5E",
  "Lazer": "#14B8A6",
  "Presentes/ Doações": "#D946EF",
  "Saúde": "#EF4444",
  "Transporte": "#F59E0B",
  "Trabalho": "#3B82F6",
  "Viagens": "#22C55E",
  "DARF/ Txs Gov/ Inve": "#94A3B8",
};

// Get display category label (strips parent prefix for sub-categories)
const getCategoryColor = (cat: string) => {
  const parent = cat.split(" > ")[0];
  return categoryColors[parent] || "#CBD5E1";
};

// ──────────────────────────────────────
// Groups entries that share the same "local" (descrição, ou categoria quando
// não há descrição) into a single consolidated row with total + histórico.
// ──────────────────────────────────────
// Normaliza date (string "YYYY-MM-DD" ou Timestamp do Firestore) para uma chave comparável
function dateSortKey(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (raw.seconds) return new Date(raw.seconds * 1000).toISOString();
  return "";
}

function consolidateExpenses(expenses: any[]) {
  const groups: Record<string, any> = {};

  for (const e of expenses) {
    const key = (e.description || "").trim() || e.category || "Outros";
    if (!groups[key]) {
      groups[key] = {
        key,
        description: (e.description || "").trim() || (e.category || "Outros").split(" > ").pop(),
        entries: [],
        total: 0,
      };
    }
    groups[key].entries.push(e);
    groups[key].total += Number(e.amount) || 0;
  }

  return Object.values(groups)
    .map((g: any) => {
      const sortedEntries = g.entries.slice().sort((a: any, b: any) => dateSortKey(b.date).localeCompare(dateSortKey(a.date)));
      const categories = new Set(sortedEntries.map((e: any) => e.category));
      const methods = new Set(sortedEntries.map((e: any) => e.method));
      const payers = new Set(sortedEntries.map((e: any) => e.userId));
      return {
        ...g,
        entries: sortedEntries,
        latestDate: dateSortKey(sortedEntries[0]?.date),
        category: categories.size === 1 ? sortedEntries[0].category : null,
        method: methods.size === 1 ? sortedEntries[0].method : null,
        userId: payers.size === 1 ? sortedEntries[0].userId : null,
      };
    })
    .sort((a: any, b: any) => (b.latestDate || "").localeCompare(a.latestDate || ""));
}

const mockExpenses = [
  { id: 1, date: "2024-03-01", description: "Aluguel", category: "Moradia", paidBy: "Vinícius", amount: 2500, method: "Boleto" },
  { id: 2, date: "2024-03-05", description: "Supermercado", category: "Alimentação", paidBy: "Maria Cecília", amount: 450.50, method: "Cartão" },
  { id: 3, date: "2024-03-08", description: "Netflix", category: "Assinaturas", paidBy: "Vinícius", amount: 55.90, method: "Cartão" },
  { id: 4, date: "2024-03-10", description: "Combustível", category: "Transporte", paidBy: "Maria Cecília", amount: 200, method: "Pix" },
  { id: 5, date: "2024-03-12", description: "Jantar Especial", category: "Lazer", paidBy: "Vinícius", amount: 180, method: "Cartão" },
];

const pieData = Object.entries(
  mockExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>)
).map(([name, value]) => ({ name, value, color: categoryColors[name] || "#CBD5E1" }));

export default function ExpensesPage() {
  const { accountId, memberLabels } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const PAYMENT_METHODS = ["Pix", "Cartão", "Boleto", "Dinheiro", "Transferência"];
  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    startDate: "",
    endDate: "",
    methods: ["Pix", "Cartão", "Boleto", "Dinheiro", "Transferência"] as string[]
  });

  const fetchExpenses = React.useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const data = await getExpenses(accountId);
      setExpenses(data);
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      try {
        await deleteExpense(id);
        fetchExpenses();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir registro.");
      }
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    // Scroll to form
    document.getElementById("form-card")?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredExpenses = expenses.filter(e => {
    const d = e.date?.seconds 
      ? new Date(e.date.seconds * 1000) 
      : (typeof e.date === 'string' 
          ? new Date(e.date + 'T00:00:00') 
          : new Date(e.date));
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (e.description || "").toLowerCase().includes(searchLower) ||
      (e.category || "").toLowerCase().includes(searchLower) ||
      (e.method || "").toLowerCase().includes(searchLower);

    // Category filter
    const [catParent] = (e.category || "").split(" > ");
    const matchesCategory = !filters.category || catParent === filters.category;
    
    // Subcategory filter
    const catSub = (e.category || "").split(" > ")[1] || "";
    const matchesSubcategory = !filters.subcategory || catSub === filters.subcategory;

    // Payment method filter
    const matchesMethod = filters.methods.length === 0 || filters.methods.includes(e.method || "") || (!e.method && filters.methods.includes(""));

    // Date range filter
    let matchesDate = true;
    if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        const start = new Date(filters.startDate + 'T00:00:00');
        if (d < start) matchesDate = false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate + 'T23:59:59');
        if (d > end) matchesDate = false;
      }
    } else {
      matchesDate = isSameMonth(d, currentMonth);
    }

    return matchesSearch && matchesCategory && matchesSubcategory && matchesMethod && matchesDate;
  });

  const totalMonthly = filteredExpenses.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
  const paidByMaria = filteredExpenses.filter((e: any) => e.userId === "maria").reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
  const paidByVinicius = filteredExpenses.filter((e: any) => e.userId === "vinicius").reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

  const pieData = Object.entries(
    filteredExpenses.reduce((acc: Record<string, number>, curr: any) => {
      const parent = (curr.category || "").split(" > ")[0];
      acc[parent] = (acc[parent] || 0) + (Number(curr.amount) || 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: categoryColors[name] || "#CBD5E1" }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Gastos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Controle os gastos compartilhados da casa.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold w-24 text-center capitalize">
              {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => document.getElementById("date")?.focus()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Gasto
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard title="Total no Mês" value={totalMonthly} color="red" />
        <StatsCard title={`Pago por ${memberLabels.maria}`} value={paidByMaria} color="blue" />
        <StatsCard title={`Pago por ${memberLabels.vinicius}`} value={paidByVinicius} color="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <ExpensesTable
            data={filteredExpenses}
            memberLabels={memberLabels}
            loading={loading}
            onDelete={handleDelete}
            onEdit={handleEdit}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setFilters}
            paymentMethods={["Pix", "Cartão", "Boleto", "Dinheiro", "Transferência"]}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div id="form-card">
            <AddExpenseForm
              memberLabels={memberLabels}
              allExpenses={expenses}
              onSave={() => {
                fetchExpenses();
                setEditingExpense(null);
              }}
              editingExpense={editingExpense}
              onCancel={() => setEditingExpense(null)}
            />
          </div>
          <DistributionCard pieData={pieData} />
        </div>
      </div>
    </div>
  );
}

function ExpensesTable({
  data,
  memberLabels,
  loading,
  onDelete,
  onEdit,
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  paymentMethods
}: {
  data: any[],
  memberLabels: { maria: string; vinicius: string },
  loading: boolean,
  onDelete: (id: string) => void,
  onEdit: (expense: any) => void,
  searchTerm: string,
  onSearchChange: (val: string) => void,
  filters: any,
  onFilterChange: (val: any) => void,
  paymentMethods: string[]
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  const consolidated = React.useMemo(() => consolidateExpenses(data), [data]);

  // Keep the open detail panel in sync when the underlying data changes (edit/delete)
  React.useEffect(() => {
    if (!selectedGroup) return;
    const updated = consolidated.find((g: any) => g.key === selectedGroup.key);
    setSelectedGroup(updated || null);
  }, [consolidated]);

  // Get available subcategories for the selected category filter
  const availableSubcategories = React.useMemo(() => {
    if (!filters.category) return [];
    const parent = categoryTree.find(c => c.label === filters.category);
    return parent?.sub || [];
  }, [filters.category]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500 dark:text-slate-400">
          Carregando dados...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Histórico de Gastos</CardTitle>
          <CardDescription>Lista completa de gastos compartilhados.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              className={cn("h-9 px-3", (filters.category || filters.subcategory || filters.startDate || filters.endDate || filters.methods?.length < paymentMethods.length) && "border-primary text-primary")}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
              {(filters.category || filters.subcategory || filters.startDate || filters.endDate || (filters.methods?.length < paymentMethods.length)) && (
                <span className="ml-2 w-2 h-2 rounded-full bg-primary"></span>
              )}
            </Button>

            {showFilters && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-sm">Filtros Avançados</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilters(false)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Categoria</Label>
                      <select 
                        className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-xs px-2 bg-white dark:bg-slate-900"
                        value={filters.category}
                        onChange={(e) => onFilterChange({ ...filters, category: e.target.value, subcategory: "" })}
                      >
                        <option value="">Todas as Categorias</option>
                        {categoryTree.map(c => (
                          <option key={c.label} value={c.label}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {filters.category && availableSubcategories.length > 0 && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                        <Label className="text-xs">Subcategoria</Label>
                        <select 
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-xs px-2 bg-white dark:bg-slate-900"
                          value={filters.subcategory}
                          onChange={(e) => onFilterChange({ ...filters, subcategory: e.target.value })}
                        >
                          <option value="">Todas as Subcategorias</option>
                          {availableSubcategories.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs">Forma de Pagamento</Label>
                        <button
                          className="text-[11px] text-primary font-medium hover:underline"
                          onClick={() => onFilterChange({
                            ...filters,
                            methods: filters.methods?.length === paymentMethods.length ? [] : [...paymentMethods]
                          })}
                        >
                          {filters.methods?.length === paymentMethods.length ? "Limpar" : "Todos"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {paymentMethods.map(method => (
                          <label
                            key={method}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                          >
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-primary focus:ring-primary/30 accent-primary"
                              checked={filters.methods?.includes(method) ?? true}
                              onChange={() => {
                                const current = filters.methods ?? paymentMethods;
                                const next = current.includes(method)
                                  ? current.filter((m: string) => m !== method)
                                  : [...current, method];
                                onFilterChange({ ...filters, methods: next });
                              }}
                            />
                            {method}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">De</Label>
                        <Input 
                          type="date" 
                          className="h-9 text-xs px-2" 
                          value={filters.startDate}
                          onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Até</Label>
                        <Input 
                          type="date" 
                          className="h-9 text-xs px-2" 
                          value={filters.endDate}
                          onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-8 text-xs"
                        onClick={() => onFilterChange({ category: "", subcategory: "", startDate: "", endDate: "", methods: [...paymentMethods] })}
                      >
                        Limpar Tudo
                      </Button>
                      <Button 
                        className="flex-1 h-8 text-xs"
                        onClick={() => setShowFilters(false)}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input 
              placeholder="Buscar..." 
              className="h-9 w-[200px] pl-9" 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600"
                onClick={() => onSearchChange("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Pago por</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consolidated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                  Nenhum gasto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              consolidated.map((group: any) => (
                <TableRow
                  key={group.key}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  onClick={() => setSelectedGroup(group)}
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    {group.entries.length > 1 ? (
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{group.entries.length} lançamentos</span>
                    ) : (
                      (() => {
                        const raw = group.entries[0].date;
                        const d = raw?.seconds
                          ? new Date(raw.seconds * 1000)
                          : (typeof raw === 'string'
                              ? new Date(raw + 'T00:00:00') // Force local midnight
                              : new Date(raw));
                        return formatDate(d);
                      })()
                    )}
                  </TableCell>
                  <TableCell className="font-semibold flex items-center gap-1.5">
                    {group.description}
                    {group.entries.length > 1 && <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
                  </TableCell>
                  <TableCell>
                    {group.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${getCategoryColor(group.category)}15`, color: getCategoryColor(group.category) }}>
                        {group.category}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Várias</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">{group.method || (group.entries.length > 1 ? "Vários" : "-")}</TableCell>
                  <TableCell>
                    {group.userId === "maria" ? memberLabels.maria : group.userId === "vinicius" ? memberLabels.vinicius : (group.userId || "Vários")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {formatCurrency(group.total)}
                  </TableCell>
                  <TableCell className="relative" onClick={(e) => e.stopPropagation()}>
                    {group.entries.length === 1 && (
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(group.entries[0])}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => onDelete(group.entries[0].id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
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

    {selectedGroup && (
      <ExpenseGroupDetailPanel
        group={selectedGroup}
        memberLabels={memberLabels}
        onClose={() => setSelectedGroup(null)}
        onEdit={(expense: any) => { onEdit(expense); setSelectedGroup(null); }}
        onDelete={(id: string) => onDelete(id)}
      />
    )}
    </>
  );
}

// ──────────────────────────────────────
// Expense Group Detail Panel — histórico de lançamentos de um mesmo "local"
// ──────────────────────────────────────
function ExpenseGroupDetailPanel({ group, memberLabels, onClose, onEdit, onDelete }: any) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{group.description}</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {group.entries.length} lançamento{group.entries.length > 1 ? "s" : ""} · Total {formatCurrency(group.total)}
            </p>
          </div>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold mb-2">
            <History className="w-4 h-4" /> Histórico de Lançamentos
          </div>
          {group.entries.map((entry: any) => {
            const raw = entry.date;
            const d = raw?.seconds
              ? new Date(raw.seconds * 1000)
              : (typeof raw === 'string' ? new Date(raw + 'T00:00:00') : new Date(raw));
            return (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group/item">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDate(d)}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {entry.method || "-"} · {entry.userId === "maria" ? memberLabels.maria : entry.userId === "vinicius" ? memberLabels.vinicius : entry.userId}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-600">{formatCurrency(entry.amount)}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(entry)}><Edit3 className="w-3 h-3" /></Button>
                    <Button variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => onDelete(entry.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type ExpenseRow = { date: string; amount: string; method: string };

const emptyRow = (method = "Cartão"): ExpenseRow => ({
  date: new Date().toISOString().split('T')[0],
  amount: "",
  method,
});

function AddExpenseForm({
  memberLabels,
  allExpenses,
  onSave,
  editingExpense,
  onCancel
}: {
  memberLabels: { maria: string; vinicius: string },
  allExpenses: any[],
  onSave: () => void,
  editingExpense?: any | null,
  onCancel?: () => void
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: "PA > Aluguel",
    userId: "maria",
  });
  const [rows, setRows] = useState<ExpenseRow[]>([emptyRow()]);
  const [installments, setInstallments] = useState(1);
  const { onFinancialAction } = useGame();
  const { accountId } = useAuth();

  // Sugestões de "locais" já usados (descrições recorrentes), para autocompletar
  const descriptionSuggestions = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const e of allExpenses) {
      const key = (e.description || "").trim();
      if (!key) continue;
      const existing = map.get(key);
      if (!existing || dateSortKey(e.date) >= dateSortKey(existing.date)) map.set(key, e);
    }
    return Array.from(map.values());
  }, [allExpenses]);

  const handleDescriptionBlur = () => {
    if (editingExpense) return;
    const match = descriptionSuggestions.find(
      e => (e.description || "").trim().toLowerCase() === formData.description.trim().toLowerCase()
    );
    if (match) {
      setFormData(prev => ({ ...prev, category: match.category || prev.category, userId: match.userId || prev.userId }));
    }
  };

  React.useEffect(() => {
    if (editingExpense) {
      let dateStr = "";
      if (editingExpense.date?.seconds) {
        dateStr = new Date(editingExpense.date.seconds * 1000).toISOString().split('T')[0];
      } else if (editingExpense.date) {
        dateStr = new Date(editingExpense.date).toISOString().split('T')[0];
      }

      setFormData({
        description: editingExpense.description || "",
        category: editingExpense.category || "PA > Aluguel",
        userId: editingExpense.userId || "maria",
      });
      setRows([{ date: dateStr, amount: editingExpense.amount?.toString() || "", method: editingExpense.method || "Cartão" }]);
    } else {
      setFormData({
        description: "",
        category: "PA > Aluguel",
        userId: "maria",
      });
      setRows([emptyRow()]);
      setInstallments(1);
    }
  }, [editingExpense]);

  const addRow = () => {
    setRows(prev => [...prev, emptyRow(prev[prev.length - 1]?.method)]);
    setInstallments(1);
  };
  const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));
  const updateRow = (index: number, patch: Partial<ExpenseRow>) =>
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.amount && Number(r.amount) > 0);
    if (validRows.length === 0) {
      alert("Por favor, preencha ao menos um valor.");
      return;
    }
    if (!accountId) return;

    setLoading(true);
    try {
      if (editingExpense) {
        const r = rows[0];
        await updateExpense(editingExpense.id, {
          date: r.date,
          description: formData.description,
          category: formData.category,
          amount: Number(r.amount),
          method: r.method,
          userId: formData.userId // Allow changing user on edit too
        });
      } else {
        if (validRows.length === 1 && validRows[0].method === "Cartão" && installments > 1) {
          const totalAmount = Number(validRows[0].amount);
          const dividedAmount = totalAmount / installments;

          const [year, month, day] = validRows[0].date.split("-").map(Number);

          for (let i = 0; i < installments; i++) {
            const nextDate = addMonths(new Date(year, month - 1, day), i);
            const yyyy = nextDate.getFullYear();
            const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
            const dd = String(nextDate.getDate()).padStart(2, '0');

            const data = {
              date: `${yyyy}-${mm}-${dd}`,
              description: `${formData.description || formData.category.split(" > ").pop()} (Parcela ${i + 1}/${installments})`,
              category: formData.category,
              amount: dividedAmount,
              method: validRows[0].method
            };
            await addExpense(formData.userId, accountId, data);
          }
        } else {
          for (const r of validRows) {
            await addExpense(formData.userId, accountId, {
              date: r.date,
              description: formData.description,
              category: formData.category,
              amount: Number(r.amount),
              method: r.method
            });
          }
        }
        onFinancialAction("expense_created");
      }

      if (editingExpense) {
        // O reset completo ocorre via o efeito acima quando o pai limpa editingExpense
      } else {
        // Mantém descrição/categoria/pago por — permite continuar lançando para o mesmo local
        setRows([emptyRow(rows[rows.length - 1]?.method)]);
        setInstallments(1);
      }
      onSave();
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      alert("Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingExpense ? "Editar Gasto" : "Novo Gasto"}</CardTitle>
        <CardDescription>
          {editingExpense ? "Atualize as informações do gasto." : "Lance um novo gasto compartilhado."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="desc">Descrição / Local <span className="text-slate-400 dark:text-slate-500 font-normal">(Opcional)</span></Label>
          <Input
            id="desc"
            list="expense-descriptions"
            placeholder="Ex: Mercado, Uber, 99..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onBlur={handleDescriptionBlur}
          />
          <datalist id="expense-descriptions">
            {descriptionSuggestions.map(e => <option key={e.description} value={e.description} />)}
          </datalist>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Use o mesmo nome de um local recorrente (ex: "Mercado") para agrupar os lançamentos na tabela.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <CategorySelector
            value={formData.category}
            onChange={(val) => setFormData({ ...formData, category: val })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidBy">Pago por</Label>
          <select
            id="paidBy"
            className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          >
            <option value="maria">{memberLabels.maria}</option>
            <option value="vinicius">{memberLabels.vinicius}</option>
          </select>
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-[1.3] min-w-0 space-y-1">
                {i === 0 && <Label htmlFor={`amount-${i}`}>Valor</Label>}
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    id={`amount-${i}`}
                    type="number"
                    placeholder="0,00"
                    className="pl-9"
                    value={row.amount}
                    onChange={(e) => updateRow(i, { amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="w-[140px] shrink-0 space-y-1">
                {i === 0 && <Label htmlFor={`date-${i}`}>Data</Label>}
                <Input
                  id={`date-${i}`}
                  type="date"
                  value={row.date}
                  onChange={(e) => updateRow(i, { date: e.target.value })}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                {i === 0 && <Label htmlFor={`method-${i}`}>Pagamento</Label>}
                <select
                  id={`method-${i}`}
                  className={selectClass}
                  value={row.method}
                  onChange={(e) => updateRow(i, { method: e.target.value })}
                >
                  <option value="Cartão">Cartão</option>
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
              {rows.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-red-500 hover:bg-red-50" onClick={() => removeRow(i)} title="Remover">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          {!editingExpense && (
            <Button type="button" variant="outline" className="w-full" onClick={addRow}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar outro lançamento
            </Button>
          )}

          {rows.length > 1 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Total: {formatCurrency(rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0))} em {rows.length} lançamentos
            </p>
          )}
        </div>

        {rows.length === 1 && rows[0].method === "Cartão" && !editingExpense && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="installments">Parcelamento (Sem Juros)</Label>
            <select
              id="installments"
              className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            >
              {[...Array(12)].map((_, i) => {
                const isValido = Number(rows[0].amount) > 0;
                const vlParcela = isValido ? formatCurrency(Number(rows[0].amount) / (i + 1)) : "";
                return (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}x {i + 1 > 1 && isValido ? `de ${vlParcela}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          {editingExpense && (
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
            {loading ? "Salvando..." : (editingExpense ? "Atualizar" : "Adicionar Gasto")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionCard({ pieData }: { pieData: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição</CardTitle>
        <CardDescription>Gastos por categoria este mês.</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {pieData.slice(0, 3).map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
              </div>
              <span className="font-semibold">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ title, value, color }: { title: string, value: number, color: "red" | "blue" }) {
  return (
    <Card className="card-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h3 className={cn(
              "text-2xl font-bold mt-1",
              color === "red" ? "text-red-600" : "text-primary"
            )}>
              {formatCurrency(value)}
            </h3>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            color === "red" ? "bg-red-50 text-red-500" : "bg-blue-50 text-primary"
          )}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Hierarchical Category Selector ────────────────────────────────────────────
function CategorySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  // Parse existing value into parent + sub
  const parts = value.split(" > ");
  const selectedParent = parts[0] || "";
  const selectedSub = parts[1] || "";

  const parentNode = categoryTree.find(c => c.label === selectedParent);
  const hasSub = parentNode?.sub && parentNode.sub.length > 0;

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parent = e.target.value;
    const node = categoryTree.find(c => c.label === parent);
    // If this parent has sub-categories, default to first sub
    if (node?.sub?.length) {
      onChange(`${parent} > ${node.sub[0]}`);
    } else {
      onChange(parent);
    }
  };

  const handleSubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(`${selectedParent} > ${e.target.value}`);
  };

  const selectClass =
    "flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all";

  return (
    <div className="space-y-2">
      {/* Parent category selector */}
      <select className={selectClass} value={selectedParent} onChange={handleParentChange}>
        {categoryTree.map(c => (
          <option key={c.label} value={c.label}>
            {c.label}{c.sub ? " ▸" : ""}
          </option>
        ))}
      </select>

      {/* Sub-category selector — only shown when parent has children */}
      {hasSub && (
        <select className={selectClass} value={selectedSub} onChange={handleSubChange}>
          {parentNode!.sub!.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {/* Preview chip */}
      {value && (
        <div className="flex items-center gap-2 pt-1">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${getCategoryColor(value)}20`,
              color: getCategoryColor(value),
            }}
          >
            {value}
          </span>
        </div>
      )}
    </div>
  );
}
