import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { GameData, defaultGameData } from "./types";

const COLLECTION = "userGameData";

// Load game data for a specific user (or return defaults)
export async function getGameData(userId: string): Promise<GameData> {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const raw = snap.data() as any;
    return {
      xp: raw.xp ?? 0,
      level: raw.level ?? 1,
      streak: raw.streak ?? 0,
      lastUpdate: raw.lastUpdate ?? new Date().toISOString(),
      gameMode: raw.gameMode ?? "plant",
      achievements: raw.achievements ?? [],
      metadata: raw.metadata ?? {},
    };
  }
  // First access — seed with defaults
  await setDoc(ref, { ...defaultGameData, createdAt: Timestamp.now() });
  return { ...defaultGameData };
}

// Persist game data (merge so partial updates don't wipe fields)
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
