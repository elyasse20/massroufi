import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore, initializeFirestore } from "firebase/firestore";
// @ts-ignore
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhn1b64mc2d4gvIrQt3EWapSARNB6_Cvk",
  authDomain: "masroufi-3daa9.firebaseapp.com",
  projectId: "masroufi-3daa9",
  storageBucket: "masroufi-3daa9.firebasestorage.app",
  messagingSenderId: "600431022486",
  appId: "1:600431022486:web:94cb838766332ddeaacdb7",
  measurementId: "G-Y2YQVRCTWE"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };

