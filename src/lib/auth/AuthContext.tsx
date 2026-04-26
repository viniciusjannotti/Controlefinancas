"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  getUserProfile,
  createUserProfile,
  createAccount,
  linkUserToAccount,
  getAccountById,
} from "@/lib/auth/db";

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  accountId: string | null;
  userName: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    existingAccountId?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve o accountId a partir do UID do Firebase Auth
  const resolveAccount = useCallback(async (firebaseUser: User) => {
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        setAccountId(profile.accountId);
        setUserName(profile.name);
      } else {
        // Perfil ainda não existe — será criado no signUp
        setAccountId(null);
        setUserName(null);
      }
    } catch (err) {
      console.error("[AuthContext] Falha ao resolver conta:", err);
      setAccountId(null);
    }
  }, []);

  // Listener de sessão Firebase (persistente por padrão)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await resolveAccount(firebaseUser);
      } else {
        setAccountId(null);
        setUserName(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [resolveAccount]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await resolveAccount(cred.user);
  }, [resolveAccount]);

  // ── Cadastro ───────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      existingAccountId?: string
    ) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      let resolvedAccountId: string;

      if (existingAccountId) {
        // Vincular a uma conta existente
        const account = await getAccountById(existingAccountId);
        if (!account) throw new Error("Código de conta não encontrado.");
        await linkUserToAccount(uid, existingAccountId);
        resolvedAccountId = existingAccountId;
      } else {
        // Criar nova conta
        resolvedAccountId = await createAccount(name || email, uid);
      }

      await createUserProfile(uid, email, name, resolvedAccountId);

      setAccountId(resolvedAccountId);
      setUserName(name);
    },
    []
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setAccountId(null);
    setUserName(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accountId, userName, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
