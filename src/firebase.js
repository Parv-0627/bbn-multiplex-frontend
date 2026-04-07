// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — firebase.js
//  Google Login + Firestore data save/load
// ═══════════════════════════════════════════════════════════════
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzo-LfbX4cIre-4ZB6X_PXZA62gMzydtY",
  authDomain: "bbn-multiplex.firebaseapp.com",
  projectId: "bbn-multiplex",
  storageBucket: "bbn-multiplex.firebasestorage.app",
  messagingSenderId: "292040645891",
  appId: "1:292040645891:web:6e4ff06b8b6d716012dd36",
};

const app     = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
const provider    = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try { const r = await signInWithPopup(auth, provider); return r.user; }
  catch(e) { console.error("Login failed:", e.message); return null; }
}

export async function signOutUser() {
  try { await signOut(auth); } catch(e) { console.error(e); }
}

export async function saveUserData(uid, data) {
  try { await setDoc(doc(db, "users", uid), data, { merge: true }); }
  catch(e) { console.error("Save failed:", e.message); }
}

export async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch(e) { console.error("Load failed:", e.message); return null; }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
