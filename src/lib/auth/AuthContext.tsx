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
  getAccountMembers,
} from "@/lib/auth/db";
import { getSettings } from "@/lib/firebase/db";

// ─── Nomes de exibição para os dois "slots" (maria/vinicius) de uma conta ─────
export interface MemberLabels {
  maria: string;
  vinicius: string;
}

const DEFAULT_LABELS: MemberLabels = { maria: "Usuário 1", vinicius: "Usuário 2" };

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  accountId: string | null;
  userName: string | null;
  loading: boolean;
  accountLoading: boolean; // true enquanto resolve o accountId após login/signup
  memberLabels: MemberLabels; // nomes exibidos para os slots "maria"/"vinicius"
  isLegacyProfile: boolean; // true apenas para a conta original do casal M&V
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
  const [accountLoading, setAccountLoading] = useState(false);
  const [memberLabels, setMemberLabels] = useState<MemberLabels>(DEFAULT_LABELS);
  const [isLegacyProfile, setIsLegacyProfile] = useState(false);
  // Flag para evitar que o onAuthStateChanged sobrescreva o estado durante o signUp
  const signUpInProgressRef = React.useRef(false);

  // Resolve os nomes de exibição e o tipo de perfil da conta
  const loadAccountMeta = useCallback(async (accId: string) => {
    try {
      const [account, settings, members] = await Promise.all([
        getAccountById(accId),
        getSettings(accId),
        getAccountMembers(accId),
      ]);
      const legacy = !!account?.legacyProfile;
      setIsLegacyProfile(legacy);

      const fallbackMaria = legacy ? "Maria Cecília" : (members[0]?.name || DEFAULT_LABELS.maria);
      const fallbackVinicius = legacy ? "Vinícius" : (members[1]?.name || DEFAULT_LABELS.vinicius);
      const saved = (settings as { user1?: string; user2?: string } | null) || {};

      setMemberLabels({
        maria: saved.user1 || fallbackMaria,
        vinicius: saved.user2 || fallbackVinicius,
      });
    } catch (err) {
      console.error("[AuthContext] Falha ao carregar dados da conta:", err);
      setIsLegacyProfile(false);
      setMemberLabels(DEFAULT_LABELS);
    }
  }, []);

  // Resolve o accountId a partir do UID do Firebase Auth
  const resolveAccount = useCallback(async (firebaseUser: User) => {
    // Se o signUp está em andamento, o próprio signUp vai definir o accountId
    if (signUpInProgressRef.current) return;
    setAccountLoading(true);
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        setAccountId(profile.accountId);
        setUserName(profile.name);
        await loadAccountMeta(profile.accountId);
      } else {
        // Perfil ainda não existe (pode ser um usuário criado fora do app)
        setAccountId(null);
        setUserName(null);
        setMemberLabels(DEFAULT_LABELS);
        setIsLegacyProfile(false);
      }
    } catch (err) {
      console.error("[AuthContext] Falha ao resolver conta:", err);
      setAccountId(null);
    } finally {
      setAccountLoading(false);
    }
  }, [loadAccountMeta]);

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
      // Limpa estado anterior para evitar que dados de outra sessão apareçam
      setAccountId(null);
      setUserName(null);
      setAccountLoading(true);
      // Impede que o onAuthStateChanged sobrescreva o estado durante o cadastro
      signUpInProgressRef.current = true;

      try {
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
        await loadAccountMeta(resolvedAccountId);
      } finally {
        signUpInProgressRef.current = false;
        setAccountLoading(false);
      }
    },
    [loadAccountMeta]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setAccountId(null);
    setUserName(null);
    setMemberLabels(DEFAULT_LABELS);
    setIsLegacyProfile(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accountId, userName, loading, accountLoading, memberLabels, isLegacyProfile, signIn, signUp, signOut }}
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
