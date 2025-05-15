
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth, db, ADMIN_EMAIL } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void; // Renamed to setUser for external use
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const fetchAndSetUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      let userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const userIsAdmin = firebaseUser.email === ADMIN_EMAIL;
        const initialProfileData: Partial<UserProfile> = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL || null,
          isAdmin: userIsAdmin,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          bio: "",
          favoriteGameIds: [],
          streamingChannelUrl: "",
          friendUids: [],
          sentFriendRequests: [],
          receivedFriendRequests: [],
          teamId: null,
          points: 0,
        };
        await setDoc(userDocRef, initialProfileData);
        userDocSnap = await getDoc(userDocRef);
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
        favoriteGameIds: userProfileData.favoriteGameIds || [],
        streamingChannelUrl: userProfileData.streamingChannelUrl || "",
        friendUids: userProfileData.friendUids || [],
        sentFriendRequests: userProfileData.sentFriendRequests || [],
        receivedFriendRequests: userProfileData.receivedFriendRequests || [],
        teamId: userProfileData.teamId || null,
        points: userProfileData.points || 0,
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
      setUserState(profile);
      setIsAdmin(profile.isAdmin || false);

    } else {
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
    if (auth.currentUser) {
      setLoading(true); // Indicate loading state
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
