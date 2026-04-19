// ─── Game System Types ─────────────────────────────────────────────────────────

export type GameMode = "plant" | "avatar" | string;

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string; // ISO date string
}

export interface GameData {
  xp: number;
  level: number;
  streak: number;
  lastUpdate: string; // ISO date string
  gameMode: GameMode;
  achievements: Achievement[];
  metadata: Record<string, any>;
}

export interface XPEvent {
  amount: number;
  source?: string; // e.g. "expense_created", "income_added"
  timestamp: string;
}

// Default initial state
export const defaultGameData: GameData = {
  xp: 0,
  level: 1,
  streak: 0,
  lastUpdate: new Date().toISOString(),
  gameMode: "plant",
  achievements: [],
  metadata: {},
};

// XP required to reach each level (simple formula: level * 1000)
export function xpForNextLevel(level: number): number {
  return level * 1000;
}

// Calculate new level based on total XP
export function calculateLevel(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  return level;
}
