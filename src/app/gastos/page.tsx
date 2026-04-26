"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Wallet,
  Calendar as CalendarIcon,
  Tag,
  Users,
  CreditCard,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X
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
  const { accountId } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    startDate: "",
    endDate: ""
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

    return matchesSearch && matchesCategory && matchesSubcategory && matchesDate;
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gastos</h2>
          <p className="text-slate-500 text-lg">Controle os gastos compartilhados da casa.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
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
        <StatsCard title="Pago por Maria" value={paidByMaria} color="blue" />
        <StatsCard title="Pago por Vinícius" value={paidByVinicius} color="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ExpensesTable 
            data={filteredExpenses} 
            loading={loading} 
            onDelete={handleDelete}
            onEdit={handleEdit}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        <div className="space-y-6">
          <div id="form-card">
            <AddExpenseForm 
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
  loading, 
  onDelete, 
  onEdit,
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange
}: { 
  data: any[], 
  loading: boolean,
  onDelete: (id: string) => void,
  onEdit: (expense: any) => void,
  searchTerm: string,
  onSearchChange: (val: string) => void,
  filters: any,
  onFilterChange: (val: any) => void
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get available subcategories for the selected category filter
  const availableSubcategories = React.useMemo(() => {
    if (!filters.category) return [];
    const parent = categoryTree.find(c => c.label === filters.category);
    return parent?.sub || [];
  }, [filters.category]);

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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Histórico de Gastos</CardTitle>
          <CardDescription>Lista completa de gastos compartilhados.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              className={cn("h-9 px-3", (filters.category || filters.subcategory || filters.startDate || filters.endDate) && "border-primary text-primary")}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
              {(filters.category || filters.subcategory || filters.startDate || filters.endDate) && (
                <span className="ml-2 w-2 h-2 rounded-full bg-primary"></span>
              )}
            </Button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in duration-200">
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
                      className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2"
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
                        className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2"
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
                      onClick={() => onFilterChange({ category: "", subcategory: "", startDate: "", endDate: "" })}
                    >
                      Limpar
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
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar..." 
              className="h-9 w-[200px] pl-9" 
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
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
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                  Nenhum gasto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {(() => {
                      const d = expense.date?.seconds 
                        ? new Date(expense.date.seconds * 1000) 
                        : (typeof expense.date === 'string' 
                            ? new Date(expense.date + 'T00:00:00') // Force local midnight
                            : new Date(expense.date));
                      return formatDate(d);
                    })()}
                  </TableCell>
                  <TableCell className="font-semibold">{expense.description || expense.category.split(" > ").pop()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${getCategoryColor(expense.category || "")}15`, color: getCategoryColor(expense.category || "") }}>
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">{expense.method || "-"}</TableCell>
                  <TableCell className="capitalize">{expense.userId}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="relative">
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    
                    {openMenuId === expense.id && (
                      <div className="absolute right-full top-0 mr-2 z-50 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          onClick={() => {
                            onEdit(expense);
                            setOpenMenuId(null);
                          }}
                        >
                          Editar
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => {
                            onDelete(expense.id);
                            setOpenMenuId(null);
                          }}
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

function AddExpenseForm({ 
  onSave, 
  editingExpense, 
  onCancel 
}: { 
  onSave: () => void, 
  editingExpense?: any | null,
  onCancel?: () => void
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    category: "PA > Aluguel",
    userId: "maria",
    amount: "",
    method: "Cartão"
  });
  const [installments, setInstallments] = useState(1);
  const { onFinancialAction } = useGame();
  const { accountId } = useAuth();

  React.useEffect(() => {
    if (editingExpense) {
      let dateStr = "";
      if (editingExpense.date?.seconds) {
        dateStr = new Date(editingExpense.date.seconds * 1000).toISOString().split('T')[0];
      } else if (editingExpense.date) {
        dateStr = new Date(editingExpense.date).toISOString().split('T')[0];
      }

      setFormData({
        date: dateStr,
        description: editingExpense.description || "",
        category: editingExpense.category || "PA > Aluguel",
        userId: editingExpense.userId || "maria",
        amount: editingExpense.amount?.toString() || "",
        method: editingExpense.method || "Cartão"
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: "",
        category: "PA > Aluguel",
        userId: "maria",
        amount: "",
        method: "Cartão"
      });
      setInstallments(1);
    }
  }, [editingExpense]);

  const handleSubmit = async () => {
    if (!formData.amount) {
      alert("Por favor, preencha o valor.");
      return;
    }

    setLoading(true);
    try {
      if (editingExpense) {
        const data = {
          date: formData.date,
          description: formData.description,
          category: formData.category,
          amount: Number(formData.amount),
          method: formData.method
        };
        await updateExpense(editingExpense.id, {
          ...data,
          userId: formData.userId // Allow changing user on edit too
        });
      } else {
        if (formData.method === "Cartão" && installments > 1) {
          const totalAmount = Number(formData.amount);
          const dividedAmount = totalAmount / installments;
          
          const [year, month, day] = formData.date.split("-").map(Number);
          
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
              method: formData.method
            };
            await addExpense(formData.userId, accountId!, data);
          }
        } else {
          const data = {
            date: formData.date,
            description: formData.description,
            category: formData.category,
            amount: Number(formData.amount),
            method: formData.method
          };
          await addExpense(formData.userId, accountId!, data);
        }
        onFinancialAction("expense_created");
      }

      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: "",
        category: "PA > Aluguel",
        userId: "maria",
        amount: "",
        method: "Cartão"
      });
      onSave();
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      alert("Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

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
          <Label htmlFor="desc">Descrição <span className="text-slate-400 font-normal">(Opcional)</span></Label>
          <Input 
            id="desc" 
            placeholder="Ex: Supermercado Mensal" 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
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
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          >
            <option value="maria">Maria Cecília</option>
            <option value="vinicius">Vinícius</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input 
              id="amount" 
              type="number" 
              placeholder="0,00" 
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Pagamento</Label>
            <select 
              id="method" 
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            >
              <option value="Cartão">Cartão</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>
        </div>

        {formData.method === "Cartão" && !editingExpense && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="installments">Parcelamento (Sem Juros)</Label>
            <select
              id="installments"
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            >
              {[...Array(12)].map((_, i) => {
                const isValido = Number(formData.amount) > 0;
                const vlParcela = isValido ? formatCurrency(Number(formData.amount) / (i + 1)) : "";
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

function StatsCard({ title, value, color }: { title: string, value: number, color: "red" | "blue" }) {
  return (
    <Card className="card-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
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
    "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm " +
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
