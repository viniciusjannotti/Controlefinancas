"use client";

import React, { useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase/config";
import { createAccount, createUserProfile, linkUserToAccount, getUserProfile } from "@/lib/auth/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/index";
import { CheckCircle, AlertTriangle, Database, RefreshCw, Users } from "lucide-react";

const COLLECTIONS = ["expenses", "earnings", "investments", "dividends", "reminders"];

// ─── One-time setup: creates both accounts and migrates data ─────────────────
export default function MigratePage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [resolvedAccountId, setResolvedAccountId] = useState<string | null>(null);

  const appendLog = (msg: string) => setLog(prev => [...prev, msg]);

  const runSetup = async () => {
    setRunning(true);
    setDone(false);
    setLog([]);

    try {
      // ── Step 1: Create/login Maria (primary account owner) ───────────────
      appendLog("👤 Criando conta de Maria Cecília...");
      let mariaUid: string;
      let accountId: string;

      try {
        const mariaCred = await createUserWithEmailAndPassword(
          auth,
          "mariac.a.faria@gmail.com",
          "121122"
        );
        mariaUid = mariaCred.user.uid;
        appendLog(`   ✅ Maria criada no Firebase Auth (uid: ${mariaUid.slice(0, 8)}...)`);
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          appendLog("   ℹ️  Maria já existe no Auth — fazendo login...");
          const cred = await signInWithEmailAndPassword(auth, "mariac.a.faria@gmail.com", "121122");
          mariaUid = cred.user.uid;
          appendLog(`   ✅ Login de Maria ok (uid: ${mariaUid.slice(0, 8)}...)`);
        } else throw err;
      }

      // Check if profile already exists
      const mariaProfile = await getUserProfile(mariaUid);
      if (mariaProfile) {
        accountId = mariaProfile.accountId;
        appendLog(`   ℹ️  Perfil de Maria já existe. AccountId: ${accountId}`);
      } else {
        // Create the shared account
        appendLog("🏠 Criando conta compartilhada do casal...");
        accountId = await createAccount("M & V Finanças", mariaUid);
        appendLog(`   ✅ Conta criada: ${accountId}`);

        await createUserProfile(mariaUid, "mariac.a.faria@gmail.com", "Maria Cecília", accountId);
        appendLog("   ✅ Perfil de Maria salvo no Firestore");
      }

      setResolvedAccountId(accountId);

      // ── Step 2: Create/login Vinícius and link to same account ────────────
      appendLog("\n👤 Criando conta de Vinícius...");
      let viniciusUid: string;

      try {
        const vinCred = await createUserWithEmailAndPassword(
          auth,
          "viniciusjannotti95@gmail.com",
          "121122"
        );
        viniciusUid = vinCred.user.uid;
        appendLog(`   ✅ Vinícius criado no Firebase Auth (uid: ${viniciusUid.slice(0, 8)}...)`);
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          appendLog("   ℹ️  Vinícius já existe no Auth — fazendo login...");
          const cred = await signInWithEmailAndPassword(auth, "viniciusjannotti95@gmail.com", "121122");
          viniciusUid = cred.user.uid;
          appendLog(`   ✅ Login de Vinícius ok (uid: ${viniciusUid.slice(0, 8)}...)`);
        } else throw err;
      }

      const vinProfile = await getUserProfile(viniciusUid);
      if (vinProfile) {
        appendLog(`   ℹ️  Perfil de Vinícius já existe na conta ${vinProfile.accountId}`);
      } else {
        await linkUserToAccount(viniciusUid, accountId);
        await createUserProfile(viniciusUid, "viniciusjannotti95@gmail.com", "Vinícius", accountId);
        appendLog(`   ✅ Vinícius vinculado à conta ${accountId}`);
      }

      // ── Step 3: Migrate all existing Firestore docs to accountId ──────────
      appendLog(`\n📦 Migrando dados para accountId: ${accountId}`);
      let totalUpdated = 0;

      for (const col of COLLECTIONS) {
        try {
          const snapshot = await getDocs(collection(db, col));
          let colCount = 0;
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            if (!data.accountId) {
              await updateDoc(doc(db, col, docSnap.id), { accountId });
              colCount++;
              totalUpdated++;
            }
          }
          appendLog(`   ✅ ${col}: ${colCount} docs atualizados`);
        } catch (err: any) {
          appendLog(`   ❌ Erro em ${col}: ${err.message}`);
        }
      }

      // Migrate settings "global"
      try {
        const globalSnap = await getDocs(collection(db, "settings"));
        let count = 0;
        for (const docSnap of globalSnap.docs) {
          if (!docSnap.data().accountId) {
            await updateDoc(doc(db, "settings", docSnap.id), { accountId });
            count++;
          }
        }
        appendLog(`   ✅ settings: ${count} docs atualizados`);
      } catch (err: any) {
        appendLog(`   ❌ Erro em settings: ${err.message}`);
      }

      // Migrate game data
      try {
        const gameSnap = await getDocs(collection(db, "userGameData"));
        let count = 0;
        for (const docSnap of gameSnap.docs) {
          if (!docSnap.data().accountId) {
            await updateDoc(doc(db, "userGameData", docSnap.id), { accountId });
            count++;
          }
        }
        appendLog(`   ✅ userGameData: ${count} docs atualizados`);
        if (count > 0) {
          appendLog(`   ⚠️  Os dados do jogo estão em doc "${gameSnap.docs[0]?.id}". Copie-os para "${accountId}" no console do Firebase para preservar o progresso.`);
        }
      } catch (err: any) {
        appendLog(`   ❌ Erro em userGameData: ${err.message}`);
      }

      appendLog(`\n✨ Setup concluído! ${totalUpdated} documentos migrados.`);
      appendLog(`\n➡️  Acesse /login e entre com seu email e senha.`);
    } catch (err: any) {
      appendLog(`\n❌ Erro fatal: ${err.message}`);
    }
    setRunning(false);
    setDone(true);
  };

  const fixGameData = async () => {
    if (!resolvedAccountId) return alert("Execute o setup primeiro para obter o Id da conta.");
    setRunning(true);
    appendLog(`\n🎮 Copiando progresso de jogo (family → ${resolvedAccountId})...`);
    try {
      const { getDoc, setDoc } = await import("firebase/firestore");
      const familyDoc = await getDoc(doc(db, "userGameData", "family"));
      if (familyDoc.exists()) {
        const gameData = familyDoc.data();
        await setDoc(doc(db, "userGameData", resolvedAccountId), {
          ...gameData,
          accountId: resolvedAccountId
        });
        appendLog("   ✅ Progresso copiado com sucesso para o novo ID!");
      } else {
        appendLog("   ℹ️  Documento 'family' não encontrado ou já migrado.");
      }
    } catch (err: any) {
      appendLog(`   ❌ Erro ao copiar jogo: ${err.message}`);
    }
    setRunning(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Setup Inicial</h2>
        <p className="text-slate-500 mt-1">Cria as contas e migra todos os dados históricos.</p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Execute apenas uma vez</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Este script cria os usuários no Firebase Auth, cria a conta compartilhada do casal e adiciona <code className="bg-amber-100 px-1 rounded">accountId</code> a todos os documentos existentes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Contas que serão criadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">M</div>
            <div>
              <p className="font-semibold">Maria Cecília</p>
              <p className="text-slate-500 text-xs">mariac.a.faria@gmail.com — dona da conta compartilhada</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">V</div>
            <div>
              <p className="font-semibold">Vinícius</p>
              <p className="text-slate-500 text-xs">viniciusjannotti95@gmail.com — vinculado à mesma conta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {resolvedAccountId && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-semibold text-emerald-900">AccountId da conta do casal:</p>
          <code className="block mt-1 text-xs text-emerald-700 break-all">{resolvedAccountId}</code>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          className="w-full"
          onClick={runSetup}
          disabled={running}
        >
          {running ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Executando...</>
          ) : done ? (
            <><CheckCircle className="w-4 h-4 mr-2" />Setup Concluído</>
          ) : (
            <><Database className="w-4 h-4 mr-2" />Executar Setup</>
          )}
        </Button>

        <Button
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary/5"
          onClick={fixGameData}
          disabled={running || !resolvedAccountId}
        >
          <Users className="w-4 h-4 mr-2" />
          Migrar Dados de Jogo
        </Button>
      </div>

      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {done ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
              Log de Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-900 text-emerald-400 rounded-xl p-4 max-h-96 overflow-y-auto">
              {log.join("\n")}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
