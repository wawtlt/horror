import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";

// =================================================================================
// ⚠️ IMPORTANT: REPLACE THE VALUES BELOW WITH YOUR FIREBASE PROJECT CONFIGURATION
// ⚠️ FIREBASEコンソール (https://console.firebase.google.com/) でプロジェクトを作成し、
// ⚠️ ウェブアプリを追加して取得した設定値をここに貼り付けてください。
// =================================================================================
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// Initialize Firebase (Singleton pattern)
let app;
let auth: any;

try {
    if (!getApps().length) {
        // Check if config is still placeholder
        if (firebaseConfig.apiKey === "REPLACE_WITH_YOUR_API_KEY") {
            console.warn("Firebase Config is missing. Please update services/firebase.ts");
        } else {
            app = initializeApp(firebaseConfig);
        }
    } else {
        app = getApp();
    }
    
    if (app) {
        auth = getAuth(app);
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User> => {
    if (!auth) throw new Error("Firebase not initialized. Check configuration.");
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const logout = async (): Promise<void> => {
    if (!auth) return;
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
        throw error;
    }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};

export { auth };