
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "market-miner-buqzl",
  appId: "1:846931288326:web:7b566ea24a06192fa0fe87",
  storageBucket: "market-miner-buqzl.firebasestorage.app",
  apiKey: "AIzaSyAoSuDnGWs_0FdqcuDDSYpklCoo6tXWIaY",
  authDomain: "market-miner-buqzl.firebaseapp.com",
  messagingSenderId: "846931288326",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
