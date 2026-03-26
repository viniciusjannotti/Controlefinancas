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

// Earnings
export const addEarning = async (userId: string, data: any) => {
  return await addDoc(collection(db, "earnings"), {
    ...data,
    userId,
    createdAt: Timestamp.now(),
  });
};

export const getEarnings = async (userId: string) => {
  const q = query(
    collection(db, "earnings"), 
    where("userId", "==", userId),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Expenses
export const addExpense = async (userId: string, data: any) => {
  return await addDoc(collection(db, "expenses"), {
    ...data,
    userId,
    createdAt: Timestamp.now(),
  });
};

export const getExpenses = async () => {
  const q = query(
    collection(db, "expenses"), 
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Investments
export const addInvestment = async (userId: string, data: any) => {
  return await addDoc(collection(db, "investments"), {
    ...data,
    userId,
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

export const getInvestments = async (userId: string) => {
  const q = query(
    collection(db, "investments"), 
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Clients (Vinicius)
export const addViniciusClient = async (name: string) => {
  return await addDoc(collection(db, "vinicius_clients"), {
    name,
    createdAt: Timestamp.now(),
  });
};

export const getViniciusClients = async () => {
  const q = query(collection(db, "vinicius_clients"), orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Clients (Maria Cecilia)
export const addCeciliaClient = async (name: string) => {
  return await addDoc(collection(db, "cecilia_clients"), {
    name,
    createdAt: Timestamp.now(),
  });
};

export const getCeciliaClients = async () => {
  const q = query(collection(db, "cecilia_clients"), orderBy("name", "asc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Settings
export const getSettings = async () => {
  const docRef = doc(db, "settings", "global");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const updateSettings = async (data: any) => {
  const docRef = doc(db, "settings", "global");
  await setDoc(docRef, data, { merge: true });
};
