import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";

// ─── Earnings ─────────────────────────────────────────────────────────────────
export const addEarning = async (userId: string, accountId: string, data: any) => {
  return await addDoc(collection(db, "earnings"), {
    ...data,
    userId,
    accountId,
    createdAt: Timestamp.now(),
  });
};

export const getEarnings = async (accountId: string) => {
  const q = query(
    collection(db, "earnings"),
    where("accountId", "==", accountId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
};

export const updateEarning = async (id: string, data: any) => {
  const docRef = doc(db, "earnings", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteEarning = async (id: string) => {
  const docRef = doc(db, "earnings", id);
  await deleteDoc(docRef);
};

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const addExpense = async (userId: string, accountId: string, data: any) => {
  return await addDoc(collection(db, "expenses"), {
    ...data,
    userId,
    accountId,
    createdAt: Timestamp.now(),
  });
};

export const getExpenses = async (accountId: string) => {
  const q = query(
    collection(db, "expenses"),
    where("accountId", "==", accountId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
};

export const updateExpense = async (id: string, data: any) => {
  const docRef = doc(db, "expenses", id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteExpense = async (id: string) => {
  const docRef = doc(db, "expenses", id);
  await deleteDoc(docRef);
};

// ─── Investments ──────────────────────────────────────────────────────────────
export const addInvestment = async (userId: string, accountId: string, data: any) => {
  return await addDoc(collection(db, "investments"), {
    ...data,
    userId,
    accountId,
    createdAt: Timestamp.now(),
  });
};

export const updateInvestmentValue = async (id: string, newValue: number) => {
  const investmentRef = doc(db, "investments", id);
  await updateDoc(investmentRef, {
    currentValue: newValue,
    updatedAt: Timestamp.now(),
  });
};

export const updateInvestment = async (id: string, data: any) => {
  const investmentRef = doc(db, "investments", id);
  await updateDoc(investmentRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteInvestment = async (id: string) => {
  const docRef = doc(db, "investments", id);
  await deleteDoc(docRef);
};

export const getInvestments = async (accountId: string) => {
  const q = query(
    collection(db, "investments"),
    where("accountId", "==", accountId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ─── Clients (Vinicius) ───────────────────────────────────────────────────────
export const addViniciusClient = async (name: string, accountId: string) => {
  return await addDoc(collection(db, "vinicius_clients"), {
    name,
    accountId,
    createdAt: Timestamp.now(),
  });
};

export const getViniciusClients = async (accountId: string) => {
  const q = query(
    collection(db, "vinicius_clients"),
    where("accountId", "==", accountId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
};

// ─── Clients (Maria Cecilia) ──────────────────────────────────────────────────
export const addCeciliaClient = async (name: string, accountId: string) => {
  return await addDoc(collection(db, "cecilia_clients"), {
    name,
    accountId,
    createdAt: Timestamp.now(),
  });
};

export const getCeciliaClients = async (accountId: string) => {
  const q = query(
    collection(db, "cecilia_clients"),
    where("accountId", "==", accountId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings = async (accountId: string) => {
  const docRef = doc(db, "settings", accountId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const updateSettings = async (accountId: string, data: any) => {
  const docRef = doc(db, "settings", accountId);
  await setDoc(docRef, data, { merge: true });
};

// ─── Reminders ────────────────────────────────────────────────────────────────
export const addReminder = async (accountId: string, data: any) => {
  return await addDoc(collection(db, "reminders"), {
    ...data,
    accountId,
    createdAt: Timestamp.now(),
  });
};

export const getReminders = async (accountId: string) => {
  const q = query(
    collection(db, "reminders"),
    where("accountId", "==", accountId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (a.dueDay || 0) - (b.dueDay || 0));
};

export const deleteReminder = async (id: string) => {
  await deleteDoc(doc(db, "reminders", id));
};

// ─── Dividends / Proventos ────────────────────────────────────────────────────
export const addDividend = async (userId: string, accountId: string, data: any) => {
  return await addDoc(collection(db, "dividends"), {
    ...data,
    userId,
    accountId,
    createdAt: Timestamp.now(),
  });
};

export const getDividends = async (accountId: string) => {
  const q = query(
    collection(db, "dividends"),
    where("accountId", "==", accountId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
};

export const deleteDividend = async (id: string) => {
  const docRef = doc(db, "dividends", id);
  await deleteDoc(docRef);
};
