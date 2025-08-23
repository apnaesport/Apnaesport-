
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      // Only proceed if email is verified. This is crucial.
      if (!firebaseUser.emailVerified) {
        await auth.signOut(); // Ensure user is logged out if email is not verified
        setUser(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setUser(userDocSnap.data() as UserProfile);
      } else {
        // This is a fallback and shouldn't normally happen with the new register flow.
        const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            isAdmin: false,
            emailVerified: firebaseUser.emailVerified,
            points: 10,
            createdAt: serverTimestamp() as Timestamp,
        };
        await setDoc(userDocRef, newUserProfile);
        setUser(newUserProfile);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    router.push("/auth/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        await firebaseUser.reload();
        await handleUser(firebaseUser);
    }
  }, [handleUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);
  
  const isAdmin = user?.isAdmin || false;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
