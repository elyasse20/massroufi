import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBhn1b64mc2d4gvIrQt3EWapSARNB6_Cvk",
  authDomain: "masroufi-3daa9.firebaseapp.com",
  projectId: "masroufi-3daa9",
  storageBucket: "masroufi-3daa9.firebasestorage.app",
  messagingSenderId: "600431022486",
  appId: "1:600431022486:web:94cb838766332ddeaacdb7",
  measurementId: "G-Y2YQVRCTWE"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
