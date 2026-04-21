// ─── Game System Types ─────────────────────────────────────────────────────────

export type GameMode = "plant" | "avatar" | string;

// ─── Achievement ───────────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;            // emoji icon
  category: "habito" | "financas" | "investimento" | "consistencia" | "especial";
  unlockedAt?: string;     // ISO date string — undefined = locked
}

// ─── Mission ──────────────────────────────────────────────────────────────────
export type MissionType = "daily" | "weekly";

export interface Mission {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  type: MissionType;
  isCompleted: boolean;
  completedAt?: string;    // ISO date string
  /** The financial action key that autocompletes this mission */
  triggerAction?: string;
}

// ─── Reward ───────────────────────────────────────────────────────────────────
export type RewardType = "xp_boost" | "resource" | "cosmetic";

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  /** Multiplier for xp_boost (e.g. 1.5 = +50% XP) or amount for resources */
  value: number;
  isClaimed: boolean;
  claimedAt?: string;
  expiresAt?: string;     // For temporary XP boosts
}

// ─── GameData ─────────────────────────────────────────────────────────────────
export interface GameData {
  xp: number;
  level: number;
  streak: number;
  lastUpdate: string;      // ISO date string
  gameMode: GameMode;
  achievements: Achievement[];
  missions: Mission[];
  rewards: Reward[];
  metadata: Record<string, any>;
  society: {
    satiety: number;
    energy: number;
    hiddenExp: number;
    hasTransitioned: boolean;
    lastPassiveDrainUpdate: string;
  };
}

// ─── XP Events ────────────────────────────────────────────────────────────────
export interface XPEvent {
  amount: number;
  source?: string;
  timestamp: string;
}

// ─── XP Rule with metadata (used by Legend) ───────────────────────────────────
export interface XPRuleEntry {
  label: string;           // Human-readable Portuguese name
  description: string;
  xp: number;
  icon: string;            // emoji
  category: "tarefa" | "quest";
}

// ─── Legend / XP Rule Catalog ─────────────────────────────────────────────────
export const XP_CATALOG: Record<string, XPRuleEntry> = {
  expense_created: {
    label: "Registrar um gasto",
    description: "Toda vez que você registrar uma nova despesa.",
    xp: 10,
    icon: "💸",
    category: "tarefa",
  },
  income_added: {
    label: "Registrar um ganho",
    description: "Adicione uma nova fonte de renda ao sistema.",
    xp: 15,
    icon: "💰",
    category: "tarefa",
  },
  investment_added: {
    label: "Registrar um investimento",
    description: "Declare uma nova posição na carteira de investimentos.",
    xp: 20,
    icon: "📈",
    category: "tarefa",
  },
  dividend_added: {
    label: "Registrar um dividendo",
    description: "Receba dividendos? Registre e ganhe XP também!",
    xp: 5,
    icon: "🏦",
    category: "tarefa",
  },
  daily_login: {
    label: "Visita diária",
    description: "Abra o app pelo menos uma vez por dia.",
    xp: 5,
    icon: "🌅",
    category: "quest",
  },
  view_dashboard: {
    label: "Checar o painel",
    description: "Visualize o dashboard principal para um panorama financeiro.",
    xp: 5,
    icon: "📊",
    category: "quest",
  },
  view_investments: {
    label: "Consultar investimentos",
    description: "Acesse a seção de investimentos para monitorar sua carteira.",
    xp: 15,
    icon: "🔭",
    category: "quest",
  },
};

// ─── Catalog of all Achievements ──────────────────────────────────────────────
export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  // ── Hábito ────────────────────────────────────────────────────────────────
  {
    id: "first_record",
    name: "Semente Plantada",
    description: "Faça o seu primeiro registro financeiro.",
    icon: "🌱",
    category: "habito",
  },
  {
    id: "five_expenses",
    name: "Cronista Financeiro",
    description: "Registre 5 despesas distintas.",
    icon: "📝",
    category: "habito",
  },
  {
    id: "ten_records",
    name: "Hábito Formado",
    description: "Registre 10 movimentos financeiros.",
    icon: "🔥",
    category: "habito",
  },
  // ── Finanças ──────────────────────────────────────────────────────────────
  {
    id: "first_income",
    name: "Mestre dos Ganhos",
    description: "Registre sua primeira fonte de renda.",
    icon: "💰",
    category: "financas",
  },
  {
    id: "five_incomes",
    name: "Múltiplas Fontes",
    description: "Registre 5 ganhos distintos. Diversificação é tudo!",
    icon: "🏆",
    category: "financas",
  },
  {
    id: "budget_positive",
    name: "No Azul",
    description: "Termine um mês com saldo positivo (ganhos > gastos).",
    icon: "✅",
    category: "financas",
  },
  // ── Investimentos ─────────────────────────────────────────────────────────
  {
    id: "first_investment",
    name: "Mente de Investidor",
    description: "Registre o seu primeiro investimento.",
    icon: "📈",
    category: "investimento",
  },
  {
    id: "first_dividend",
    name: "Colhendo Frutos",
    description: "Receba e registre o seu primeiro dividendo.",
    icon: "🍎",
    category: "investimento",
  },
  // ── Consistência ──────────────────────────────────────────────────────────
  {
    id: "streak_3",
    name: "Começando Bem",
    description: "Mantenha um streak de 3 dias consecutivos.",
    icon: "⚡",
    category: "consistencia",
  },
  {
    id: "streak_7",
    name: "Resiliência",
    description: "Mantenha um streak de 7 dias. Uma semana inteira!",
    icon: "🗓️",
    category: "consistencia",
  },
  {
    id: "streak_30",
    name: "Inabalável",
    description: "30 dias seguidos. Você se tornou uma máquina de hábitos.",
    icon: "💎",
    category: "consistencia",
  },
  {
    id: "ten_missions",
    name: "Jardineiro Consciente",
    description: "Complete 10 missões diárias.",
    icon: "🌻",
    category: "consistencia",
  },
  // ── Especial ──────────────────────────────────────────────────────────────
  {
    id: "level_5",
    name: "Árvore Jovem",
    description: "Alcance o nível 5. Sua planta está crescendo!",
    icon: "🌳",
    category: "especial",
  },
  {
    id: "level_10",
    name: "Floresta Pessoal",
    description: "Alcance o nível 10. Você é uma força da natureza!",
    icon: "🌲",
    category: "especial",
  },
];

// ─── Daily Missions Template ───────────────────────────────────────────────────
export const DAILY_MISSIONS_TEMPLATE: Omit<Mission, "isCompleted" | "completedAt">[] = [
  {
    id: "mission_login",
    title: "Visita Matinal",
    description: "Abra o app hoje. O primeiro passo é aparecer.",
    rewardXP: 5,
    type: "daily",
    triggerAction: "daily_login",
  },
  {
    id: "mission_record",
    title: "Cronista do Dia",
    description: "Registre pelo menos um gasto ou ganho hoje.",
    rewardXP: 10,
    type: "daily",
    triggerAction: "expense_created",
  },
  {
    id: "mission_investments",
    title: "Olho no Futuro",
    description: "Acesse a seção de investimentos hoje.",
    rewardXP: 15,
    type: "daily",
    triggerAction: "view_investments",
  },
  {
    id: "mission_dashboard",
    title: "Painel Aberto",
    description: "Visualize o dashboard para checar sua saúde financeira.",
    rewardXP: 5,
    type: "daily",
    triggerAction: "view_dashboard",
  },
];

// ─── Default initial state ─────────────────────────────────────────────────────
export const defaultGameData: GameData = {
  xp: 0,
  level: 1,
  streak: 0,
  lastUpdate: new Date().toISOString(),
  gameMode: "plant",
  achievements: [],
  missions: DAILY_MISSIONS_TEMPLATE.map((m) => ({ ...m, isCompleted: false })),
  rewards: [],
  metadata: {},
  society: {
    satiety: 80,
    energy: 50,
    hiddenExp: 0,
    hasTransitioned: false,
    lastPassiveDrainUpdate: new Date().toISOString(),
  },
};

// ─── XP calculation helpers ───────────────────────────────────────────────────
export function xpForNextLevel(level: number): number {
  return level * 1000;
}

export function calculateLevel(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  return level;
}
