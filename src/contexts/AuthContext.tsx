
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth, db, ADMIN_EMAIL } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { generateApnaId } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAndSetUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      if (!firebaseUser.emailVerified) {
        // This handles users who have registered but not verified their email.
        // We treat them as logged out from the app's perspective.
        setUserState(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfileData = userDocSnap.data() as UserProfile;
        setUserState(userProfileData);
        setIsAdmin(userProfileData.isAdmin || false);
      } else {
        // This case is rare but handles when a user is in Auth but not Firestore.
        // It creates a Firestore profile for them.
        console.warn("User exists in Auth but not Firestore. Creating profile now.");
        const userIsAdmin = firebaseUser.email === ADMIN_EMAIL;
        const newApnaId = await generateApnaId();
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || "New User",
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || null,
          isAdmin: userIsAdmin,
          emailVerified: firebaseUser.emailVerified,
          createdAt: serverTimestamp() as Timestamp,
          bio: "",
          favoriteGameIds: [],
          streamingChannelUrl: "",
          communityId: null,
          points: 10, // Initial signup bonus
          apnaId: newApnaId,
          lastLogin: serverTimestamp() as Timestamp,
        };
        await setDoc(userDocRef, newProfile);
        setUserState(newProfile);
        setIsAdmin(newProfile.isAdmin || false);
      }
    } else {
      // No Firebase user, so clear local state
      setUserState(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      fetchAndSetUser(fbUser);
    });
    return () => unsubscribe();
  }, [fetchAndSetUser]);

  const logout = useCallback(async () => {
    setLoading(true);
    await auth.signOut();
    setUserState(null);
    setIsAdmin(false);
    setLoading(false);
    router.push("/auth/login");
  }, [router]);
  
  const setContextUser = useCallback((updatedUser: UserProfile | null) => {
    setUserState(updatedUser);
    if (updatedUser) {
      setIsAdmin(updatedUser.isAdmin || false);
    } else {
      setIsAdmin(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setLoading(true); // Indicate loading state
      await currentUser.reload(); // Reload Firebase Auth user data
      await fetchAndSetUser(auth.currentUser); 
    }
  }, [fetchAndSetUser]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout, setUser: setContextUser, refreshUser }}>
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
