import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore, initializeFirestore } from "firebase/firestore";
// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDlPEUzpsjmklxDPSnNmhT8FCqmom6qveM",
  authDomain: "massroufi-e55a3.firebaseapp.com",
  projectId: "massroufi-e55a3",
  storageBucket: "massroufi-e55a3.firebasestorage.app",
  messagingSenderId: "808263713888",
  appId: "1:808263713888:web:1917170321bebc7ed2ef05",
  measurementId: "G-E1VNT4DPZS"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with AsyncStorage Persistence
    // This fixes the warning and ensures user stays logged in
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

    // Initialize Firestore with default settings for better compatibility
    db = initializeFirestore(app, {});
  } else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  throw error;
}

export { auth, db };

