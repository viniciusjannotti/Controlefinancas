"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { GameData, XPEvent, calculateLevel, defaultGameData } from "@/lib/game/types";
import { getGameData, saveGameData } from "@/lib/game/db";

// ─── Shared user ID (replace with real auth uid when ready) ──────────────────
const FAMILY_USER_ID = "family";

// ─── XP rule table ────────────────────────────────────────────────────────────
const XP_RULES: Record<string, number> = {
  expense_created:    10,
  income_added:       15,
  investment_added:   20,
  dividend_added:      5,
};

// ─── Context shape ────────────────────────────────────────────────────────────
interface GameContextValue {
  gameData: GameData;
  loading: boolean;
  addXP: (amount: number, source?: string) => Promise<void>;
  /** Call this on every financial action — XP and streak are handled automatically */
  onFinancialAction: (type: string, payload?: any) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ─── Streak helpers ───────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function computeStreak(prev: GameData): number {
  const today = todayKey();
  const lastDay = prev.lastUpdate?.slice(0, 10) ?? "";
  if (lastDay === today) return prev.streak; // already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  return lastDay === yesterdayKey ? prev.streak + 1 : 1;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameData, setGameData] = useState<GameData>(defaultGameData);
  const [loading, setLoading] = useState(true);
  const xpLog = useRef<XPEvent[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getGameData(FAMILY_USER_ID);
        setGameData(data);
      } catch (err) {
        console.error("[GameContext] Failed to load game data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── addXP (also handles streak) ───────────────────────────────────────────
  const addXP = useCallback(async (amount: number, source?: string) => {
    setGameData((prev) => {
      const streak  = computeStreak(prev);
      const newXP   = prev.xp + amount;
      const updated: GameData = {
        ...prev,
        xp: newXP,
        level: calculateLevel(newXP),
        streak,
        lastUpdate: new Date().toISOString(),
      };

      xpLog.current.push({ amount, source, timestamp: new Date().toISOString() });

      saveGameData(FAMILY_USER_ID, {
        xp: updated.xp,
        level: updated.level,
        streak: updated.streak,
        lastUpdate: updated.lastUpdate,
      }).catch((err) => console.error("[GameContext] Failed to save XP:", err));

      return updated;
    });
  }, []);

  // ── onFinancialAction — dispatches XP from rule table ─────────────────────
  const onFinancialAction = useCallback((type: string, payload?: any) => {
    const xpAmount = XP_RULES[type];
    if (xpAmount) addXP(xpAmount, type);
    console.debug("[GameContext] onFinancialAction →", type, payload, `(+${xpAmount ?? 0} XP)`);
  }, [addXP]);

  return (
    <GameContext.Provider value={{ gameData, loading, addXP, onFinancialAction }}>
      {children}
    </GameContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
