
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDip3znMEequ0qrcVXeVoMIZ5oThzC1zoA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "battlezone-faa03.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "battlezone-faa03",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "battlezone-faa03.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "247105947270",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:247105947270:web:7296c19468bae0ebedf307",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5D2EL265T2",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// This function will be called once by the AuthContext to set persistence.
export const setAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error("Error setting auth persistence:", error);
  }
};


export { app, auth, db };

export const ADMIN_EMAIL = "xyzapplywork@gmail.com";

// NOTE: For production, API keys should be stored in environment variables, not in source code.
// This is added here for prototype functionality.
export const BGMI_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI0YjAyOGY2MC01OTkwLTAxM2UtNWY5Zi03NmNhZDljYTc2ODYiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNzU0OTkyNDgyLCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImFwbmEtZXNwb3J0In0._mCGDyWmDNmJqH7wNrMO_dZB_zjSyC5iCd-zsylK-gI";
