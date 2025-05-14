
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"; // Added setDoc and serverTimestamp
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { auth, db, ADMIN_EMAIL } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void; // Allow updating user context externally
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        let userDocSnap = await getDoc(userDocRef);

        // If user document doesn't exist in Firestore (e.g., first login via social provider or old account)
        // create it. This should ideally happen at registration, but this is a fallback.
        if (!userDocSnap.exists()) {
          const userIsAdmin = firebaseUser.email === ADMIN_EMAIL;
          const initialProfileData = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || null,
            isAdmin: userIsAdmin,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            bio: "",
            favoriteGames: "",
            streamingChannelUrl: "",
          };
          await setDoc(userDocRef, initialProfileData);
          userDocSnap = await getDoc(userDocRef); // Re-fetch after creation
        }
        
        let userProfileData: Partial<UserProfile> = {};
        if (userDocSnap.exists()) {
          userProfileData = userDocSnap.data() as Partial<UserProfile>;
        }

        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || userProfileData.displayName || firebaseUser.email?.split('@')[0] || "User",
          photoURL: firebaseUser.photoURL || userProfileData.photoURL,
          isAdmin: userProfileData.isAdmin || (firebaseUser.email === ADMIN_EMAIL),
          bio: userProfileData.bio || "",
          favoriteGames: userProfileData.favoriteGames || "",
          streamingChannelUrl: userProfileData.streamingChannelUrl || "",
          // Firebase User properties
          emailVerified: firebaseUser.emailVerified,
          isAnonymous: firebaseUser.isAnonymous,
          metadata: firebaseUser.metadata,
          providerData: firebaseUser.providerData,
          refreshToken: firebaseUser.refreshToken,
          tenantId: firebaseUser.tenantId,
          delete: firebaseUser.delete,
          getIdToken: firebaseUser.getIdToken,
          getIdTokenResult: firebaseUser.getIdTokenResult,
          reload: firebaseUser.reload,
          toJSON: firebaseUser.toJSON,
          phoneNumber: firebaseUser.phoneNumber, 
          providerId: firebaseUser.providerId,
          createdAt: userProfileData.createdAt, 
        };
        setUser(profile);
        setIsAdmin(profile.isAdmin || false);

      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    router.push("/auth/login");
  };
  
  // Allow external updates to the user object in context
  const setContextUser = (updatedUser: UserProfile | null) => {
    setUser(updatedUser);
    if (updatedUser) {
        setIsAdmin(updatedUser.isAdmin || false);
    } else {
        setIsAdmin(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout, setUser: setContextUser }}>
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
