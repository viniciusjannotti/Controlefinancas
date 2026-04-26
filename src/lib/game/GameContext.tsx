"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  GameData,
  XPEvent,
  Achievement,
  Mission,
  ACHIEVEMENTS_CATALOG,
  DAILY_MISSIONS_TEMPLATE,
  XP_CATALOG,
  calculateLevel,
  defaultGameData,
} from "@/lib/game/types";
import { getGameData, saveGameData, subscribeToGameData } from "@/lib/game/db";
import { useAuth } from "@/lib/auth/AuthContext";

// ─── XP Rules (derived from catalog) ─────────────────────────────────────────
const XP_RULES: Record<string, number> = Object.fromEntries(
  Object.entries(XP_CATALOG).map(([key, val]) => [key, val.xp])
);

// ─── Context shape ────────────────────────────────────────────────────────────
interface GameContextValue {
  gameData: GameData;
  loading: boolean;
  /** Award XP directly */
  addXP: (amount: number, source?: string) => Promise<void>;
  /** Call on every financial or navigational action */
  onFinancialAction: (type: string, payload?: any) => void;
  /** Manually complete a mission by id */
  completeMission: (missionId: string) => void;
  /** Track how many missions were completed total (for achievement) */
  totalMissionsCompleted: number;
  /** Update society specific game data */
  updateSocietyData: (updates: Partial<GameData['society']>) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ─── Streak helpers ───────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(prev: GameData): number {
  const today = todayKey();
  const lastDay = prev.lastUpdate?.slice(0, 10) ?? "";
  if (lastDay === today) return prev.streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  return lastDay === yesterdayKey ? prev.streak + 1 : 1;
}

// ─── Achievement checker ──────────────────────────────────────────────────────
function checkAchievements(
  prev: GameData,
  action: string,
  meta: {
    totalExpenses: number;
    totalIncomes: number;
    totalRecords: number;
    totalMissionsDone: number;
  }
): Achievement[] {
  const unlocked = new Set(prev.achievements.map((a) => a.id));
  const toUnlock: Achievement[] = [];

  function tryUnlock(id: string) {
    if (unlocked.has(id)) return;
    const found = ACHIEVEMENTS_CATALOG.find((a) => a.id === id);
    if (found) {
      toUnlock.push({ ...found, unlockedAt: new Date().toISOString() });
    }
  }

  // First record (any action)
  if (meta.totalRecords >= 1) tryUnlock("first_record");
  if (meta.totalRecords >= 10) tryUnlock("ten_records");

  // Expenses
  if (meta.totalExpenses >= 5) tryUnlock("five_expenses");

  // Incomes
  if (meta.totalIncomes >= 1) tryUnlock("first_income");
  if (meta.totalIncomes >= 5) tryUnlock("five_incomes");

  // Investments
  if (action === "investment_added") tryUnlock("first_investment");
  if (action === "dividend_added") tryUnlock("first_dividend");

  // Streaks
  const streak = computeStreak(prev);
  if (streak >= 3) tryUnlock("streak_3");
  if (streak >= 7) tryUnlock("streak_7");
  if (streak >= 30) tryUnlock("streak_30");

  // Missions
  if (meta.totalMissionsDone >= 10) tryUnlock("ten_missions");

  // Levels
  if (prev.level >= 5) tryUnlock("level_5");
  if (prev.level >= 10) tryUnlock("level_10");

  return toUnlock;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GameProvider({ children }: { children: React.ReactNode }) {
  const { accountId } = useAuth();
  const [gameData, setGameData] = useState<GameData>(defaultGameData);
  const [loading, setLoading] = useState(true);
  const [totalMissionsCompleted, setTotalMissionsCompleted] = useState(0);
  const xpLog = useRef<XPEvent[]>([]);

  // Counters tracked in metadata to drive achievements
  const getCounters = useCallback((data: GameData) => ({
    totalExpenses: data.metadata.totalExpenses ?? 0,
    totalIncomes: data.metadata.totalIncomes ?? 0,
    totalRecords: data.metadata.totalRecords ?? 0,
    totalMissionsDone: data.metadata.totalMissionsDone ?? 0,
  }), []);

  useEffect(() => {
    if (!accountId) return;
    const unsubscribe = subscribeToGameData(accountId, (data) => {
      setGameData(data);
      setTotalMissionsCompleted(data.metadata.totalMissionsDone ?? 0);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [accountId]);

  // ── addXP ─────────────────────────────────────────────────────────────────
  const addXP = useCallback(async (amount: number, source?: string) => {
    if (!accountId) return;
    setGameData((prev) => {
      const streak = computeStreak(prev);
      const newXP = prev.xp + amount;
      const updated: GameData = {
        ...prev,
        xp: newXP,
        level: calculateLevel(newXP),
        streak,
        lastUpdate: new Date().toISOString(),
      };

      xpLog.current.push({ amount, source, timestamp: new Date().toISOString() });

      saveGameData(accountId, {
        xp: updated.xp,
        level: updated.level,
        streak: updated.streak,
        lastUpdate: updated.lastUpdate,
      }).catch((err) => console.error("[GameContext] Failed to save XP:", err));

      return updated;
    });
  }, [accountId]);

  const updateSocietyData = useCallback(async (updates: Partial<GameData['society']>) => {
    if (!accountId) return;
    setGameData((prev) => {
      const updatedSociety = { ...prev.society, ...updates };
      const updated: GameData = { ...prev, society: updatedSociety };
      
      saveGameData(accountId, { society: updatedSociety })
        .catch(err => console.error("[GameContext] Failed to save society data:", err));
        
      return updated;
    });
  }, [accountId]);

  // ── Complete a mission by id ───────────────────────────────────────────────
  const completeMission = useCallback((missionId: string) => {
    if (!accountId) return;
    setGameData((prev) => {
      const mission = prev.missions.find((m) => m.id === missionId);
      if (!mission || mission.isCompleted) return prev;

      const updatedMissions = prev.missions.map((m) =>
        m.id === missionId
          ? { ...m, isCompleted: true, completedAt: new Date().toISOString() }
          : m
      );

      const newTotalMissions = (prev.metadata.totalMissionsDone ?? 0) + 1;
      const newMetadata = { ...prev.metadata, totalMissionsDone: newTotalMissions };

      // Check achievements with updated missions count
      const counters = { ...getCounters(prev), totalMissionsDone: newTotalMissions };
      const newAchievements = checkAchievements(prev, "", counters);
      const allAchievements = [...prev.achievements, ...newAchievements];

      const updated: GameData = {
        ...prev,
        missions: updatedMissions,
        achievements: allAchievements,
        metadata: newMetadata,
      };

      setTotalMissionsCompleted(newTotalMissions);

      // Award mission XP (+save)
      const xpReward = mission.rewardXP;
      const streak = computeStreak(prev);
      const newXP = prev.xp + xpReward;
      const finalUpdated: GameData = {
        ...updated,
        xp: newXP,
        level: calculateLevel(newXP),
        streak,
        lastUpdate: new Date().toISOString(),
      };

      saveGameData(accountId, {
        xp: finalUpdated.xp,
        level: finalUpdated.level,
        streak: finalUpdated.streak,
        lastUpdate: finalUpdated.lastUpdate,
        missions: finalUpdated.missions,
        achievements: finalUpdated.achievements,
        metadata: finalUpdated.metadata,
      }).catch((err) => console.error("[GameContext] Failed to save mission:", err));

      return finalUpdated;
    });
  }, [getCounters, accountId]);

  // ── onFinancialAction — dispatches XP + missions + achievements ───────────
  const onFinancialAction = useCallback((type: string, payload?: any) => {
    if (!accountId) return;
    const xpAmount = XP_RULES[type] ?? 0;

    setGameData((prev) => {
      // Update counters in metadata
      const meta = { ...prev.metadata };
      if (type === "expense_created") meta.totalExpenses = (meta.totalExpenses ?? 0) + 1;
      if (type === "income_added") meta.totalIncomes = (meta.totalIncomes ?? 0) + 1;
      if (["expense_created", "income_added", "investment_added", "dividend_added"].includes(type)) {
        meta.totalRecords = (meta.totalRecords ?? 0) + 1;
      }

      // Auto-complete matching missions
      const today = todayKey();
      const updatedMissions = prev.missions.map((m) => {
        if (!m.isCompleted && m.triggerAction === type) {
          return { ...m, isCompleted: true, completedAt: new Date().toISOString() };
        }
        // income_added also completes "record" mission
        if (!m.isCompleted && m.triggerAction === "expense_created" && type === "income_added") {
          return { ...m, isCompleted: true, completedAt: new Date().toISOString() };
        }
        return m;
      });

      const newlyCompleted = updatedMissions.filter(
        (m, i) => m.isCompleted && !prev.missions[i].isCompleted
      );
      const missionXP = newlyCompleted.reduce((sum, m) => sum + m.rewardXP, 0);
      if (newlyCompleted.length) {
        meta.totalMissionsDone = (meta.totalMissionsDone ?? 0) + newlyCompleted.length;
        setTotalMissionsCompleted(meta.totalMissionsDone);
      }

      const streak = computeStreak(prev);
      const newXP = prev.xp + xpAmount + missionXP;
      const counters = {
        totalExpenses: meta.totalExpenses ?? 0,
        totalIncomes: meta.totalIncomes ?? 0,
        totalRecords: meta.totalRecords ?? 0,
        totalMissionsDone: meta.totalMissionsDone ?? 0,
      };

      const newAchievements = checkAchievements({ ...prev, level: calculateLevel(newXP), streak }, type, counters);
      const allAchievements = [...prev.achievements, ...newAchievements];

      const addedEnergy = (["expense_created", "income_added", "investment_added", "dividend_added"].includes(type)) ? 2 : 0;
      const updatedSociety = { 
        ...prev.society, 
        energy: (prev.society?.energy ?? 0) + addedEnergy,
        lastPassiveDrainUpdate: addedEnergy > 0 ? new Date().toISOString() : prev.society?.lastPassiveDrainUpdate
      };

      const updated: GameData = {
        ...prev,
        xp: newXP,
        level: calculateLevel(newXP),
        streak: streak,
        lastUpdate: new Date().toISOString(),
        missions: updatedMissions,
        achievements: allAchievements,
        metadata: meta,
        society: updatedSociety,
      };

      xpLog.current.push({ amount: xpAmount + missionXP, source: type, timestamp: new Date().toISOString() });

      saveGameData(accountId, {
        xp: updated.xp,
        level: updated.level,
        streak: updated.streak,
        lastUpdate: updated.lastUpdate,
        missions: updated.missions,
        achievements: updated.achievements,
        metadata: updated.metadata,
        society: updated.society,
      }).catch((err) => console.error("[GameContext] Failed to save action:", err));

      console.debug(
        `[GameContext] → ${type} | +${xpAmount} XP (ação) + ${missionXP} XP (missão) | Nível ${updated.level}`
      );

      return updated;
    });
  }, [accountId]);

  return (
    <GameContext.Provider
      value={{ gameData, loading, addXP, onFinancialAction, completeMission, totalMissionsCompleted, updateSocietyData }}
    >
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
