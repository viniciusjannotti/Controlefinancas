import { doc, getDoc, setDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { GameData, defaultGameData, DAILY_MISSIONS_TEMPLATE, Mission } from "./types";

const COLLECTION = "userGameData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Reset daily missions if they were last generated on a different day */
function ensureFreshDailyMissions(missions: Mission[]): Mission[] {
  const today = todayKey();
  const hasTodayMissions = missions.some(
    (m) => m.type === "daily" && (!m.completedAt || m.completedAt.slice(0, 10) === today)
  );
  // If all daily missions are from today (or none completed), keep as-is
  // Otherwise seed a fresh batch
  if (hasTodayMissions || missions.filter((m) => m.type === "daily").length === 0) {
    // Ensure all daily missions exist (add any missing from the template)
    const existingIds = new Set(missions.map((m) => m.id));
    const freshMissions = [...missions];
    for (const tmpl of DAILY_MISSIONS_TEMPLATE) {
      if (!existingIds.has(tmpl.id)) {
        freshMissions.push({ ...tmpl, isCompleted: false });
      }
    }
    return freshMissions;
  }
  // New day — reset daily missions but keep weekly/special
  const nonDaily = missions.filter((m) => m.type !== "daily");
  const freshDaily = DAILY_MISSIONS_TEMPLATE.map((m) => ({ ...m, isCompleted: false }));
  return [...nonDaily, ...freshDaily];
}

// ─── Load ─────────────────────────────────────────────────────────────────────
export async function getGameData(userId: string): Promise<GameData> {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const raw = snap.data() as any;
    const missions = ensureFreshDailyMissions(raw.missions ?? []);
    return {
      xp: raw.xp ?? 0,
      level: raw.level ?? 1,
      streak: raw.streak ?? 0,
      lastUpdate: raw.lastUpdate ?? new Date().toISOString(),
      gameMode: raw.gameMode ?? "plant",
      achievements: raw.achievements ?? [],
      missions,
      rewards: raw.rewards ?? [],
      metadata: raw.metadata ?? {},
      society: raw.society ?? defaultGameData.society,
    };
  }
  // First access — seed with defaults
  await setDoc(ref, { ...defaultGameData, createdAt: Timestamp.now() });
  return { ...defaultGameData };
}

/** Sincronização em tempo real */
export function subscribeToGameData(userId: string, callback: (data: GameData) => void) {
  const ref = doc(db, COLLECTION, userId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const raw = snap.data() as any;
      const missions = ensureFreshDailyMissions(raw.missions ?? []);
      callback({
        xp: raw.xp ?? 0,
        level: raw.level ?? 1,
        streak: raw.streak ?? 0,
        lastUpdate: raw.lastUpdate ?? new Date().toISOString(),
        gameMode: raw.gameMode ?? "plant",
        achievements: raw.achievements ?? [],
        missions,
        rewards: raw.rewards ?? [],
        metadata: raw.metadata ?? {},
        society: raw.society ?? defaultGameData.society,
      });
    }
  });
}

// ─── Save ─────────────────────────────────────────────────────────────────────
export async function saveGameData(
  userId: string,
  data: Partial<GameData>
): Promise<void> {
  const ref = doc(db, COLLECTION, userId);
  await setDoc(
    ref,
    { ...data, updatedAt: Timestamp.now() },
    { merge: true }
  );
}
