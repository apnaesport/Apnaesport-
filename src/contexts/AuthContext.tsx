
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp, updateDoc, increment } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth, db, ADMIN_EMAIL } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { generateApnaId } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { Coins } from "lucide-react";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void; // Renamed to setUser for external use
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check if a day has passed
const isNewDay = (lastLogin: Timestamp | Date | undefined): boolean => {
    if (!lastLogin) return true;
    const lastLoginDate = lastLogin instanceof Date ? lastLogin : lastLogin.toDate();
    const today = new Date();
    
    // Check if the last login was before the start of today
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return lastLoginDate.getTime() < startOfToday.getTime();
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAndSetUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      let userDocSnap = await getDoc(userDocRef);

      // This handles the case where a user exists in Auth but not Firestore (e.g., deleted manually)
      // or the critical case where they haven't verified their email yet.
      if (!userDocSnap.exists() && !firebaseUser.emailVerified) {
        // If the user isn't in Firestore and isn't verified, they are stuck.
        // We sign them out to allow them to retry or verify.
        await auth.signOut();
        setUserState(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      // This is the normal flow for a verified, logged-in user.
      if (firebaseUser.emailVerified) {
        if (!userDocSnap.exists()) {
           console.warn("User exists in Auth but not Firestore. This should not happen after registration. Creating profile now.");
           const userIsAdmin = firebaseUser.email === ADMIN_EMAIL;
           const newApnaId = await generateApnaId();
           const initialProfileData = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || "New User",
              email: firebaseUser.email,
              photoURL: null,
              isAdmin: userIsAdmin,
              emailVerified: firebaseUser.emailVerified,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              bio: "",
              favoriteGameIds: [],
              streamingChannelUrl: "",
              communityId: null,
              points: 10,
              apnaId: newApnaId,
              lastLogin: serverTimestamp(),
           };
           await setDoc(userDocRef, initialProfileData);
           userDocSnap = await getDoc(userDocRef);
        }

        let userProfileData = userDocSnap.data() as Partial<UserProfile>;
        
        // Award daily login bonus if it's a new day
        if (isNewDay(userProfileData.lastLogin)) {
            await updateDoc(userDocRef, {
                points: increment(5),
                lastLogin: serverTimestamp()
            });
            userProfileData.points = (userProfileData.points || 0) + 5;
            toast({
                title: ( <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-500" /><span>+5 AE Points!</span></div>),
                description: "Your daily login bonus has been added.",
            });
        }

        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || userProfileData.displayName || "User",
          photoURL: firebaseUser.photoURL || userProfileData.photoURL,
          isAdmin: userProfileData.isAdmin || false,
          bio: userProfileData.bio || "",
          favoriteGameIds: userProfileData.favoriteGameIds || [],
          streamingChannelUrl: userProfileData.streamingChannelUrl || "",
          communityId: userProfileData.communityId || null,
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
          apnaId: userProfileData.apnaId,
          lastLogin: userProfileData.lastLogin
        };
        setUserState(profile);
        setIsAdmin(profile.isAdmin || false);
      } else {
        // If user is not verified, keep them logged out from app's perspective
        setUserState(null);
        setIsAdmin(false);
      }

    } else {
      setUserState(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, [toast]);


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
