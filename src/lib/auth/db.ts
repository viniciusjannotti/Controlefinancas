import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface AccountDoc {
  name: string;
  members: string[];
  createdAt: any;
  plan: "free" | "pro";
  // Conta original do casal (M & V), que mantém os formulários especializados
  // (paciente/consulta, cliente/serviço). Contas novas não usam isso.
  legacyProfile?: boolean;
}

export interface AccountMemberInfo {
  uid: string;
  name: string;
}

export interface UserProfileDoc {
  email: string;
  name: string;
  accountId: string;
  createdAt: any;
}

// ── Criar uma nova conta ────────────────────────────────────────────────────
export async function createAccount(name: string, ownerUid: string): Promise<string> {
  const ref = await addDoc(collection(db, "accounts"), {
    name,
    members: [ownerUid],
    createdAt: Timestamp.now(),
    plan: "free",
  } satisfies AccountDoc);
  return ref.id;
}

// ── Buscar conta ─────────────────────────────────────────────────────────────
export async function getAccountById(accountId: string): Promise<AccountDoc | null> {
  const snap = await getDoc(doc(db, "accounts", accountId));
  return snap.exists() ? (snap.data() as AccountDoc) : null;
}

// ── Criar perfil de usuário ──────────────────────────────────────────────────
export async function createUserProfile(
  uid: string,
  email: string,
  name: string,
  accountId: string
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    email,
    name,
    accountId,
    createdAt: Timestamp.now(),
  } satisfies UserProfileDoc);
}

// ── Buscar perfil de usuário ─────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfileDoc) : null;
}

// ── Vincular usuário a uma conta existente ───────────────────────────────────
export async function linkUserToAccount(uid: string, accountId: string): Promise<void> {
  await updateDoc(doc(db, "accounts", accountId), {
    members: arrayUnion(uid),
  });
}

// ── Buscar nomes dos membros de uma conta (na ordem em que entraram) ─────────
export async function getAccountMembers(accountId: string): Promise<AccountMemberInfo[]> {
  const account = await getAccountById(accountId);
  if (!account) return [];
  return Promise.all(
    account.members.map(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid));
      const name = snap.exists() ? (snap.data() as UserProfileDoc).name : "";
      return { uid, name: name || "" };
    })
  );
}
