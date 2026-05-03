import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  // Bypass initial loading screen if we have a hint that the user was logged in previously.
  // This drastically improves perceived cold start time after the app sleeps.
  const [loading, setLoading] = useState(() => !localStorage.getItem('toeic_app_cached_auth'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        localStorage.setItem('toeic_app_cached_auth', 'true');
        // Run Firestore sync in the background so it doesn't block the UI
        (async () => {
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
              await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL || '',
                totalScore: 0,
                examsTaken: 0,
                createdAt: new Date().toISOString()
              });
            }
          } catch (error: any) {
            if (error?.message?.includes('offline') || error?.code === 'unavailable') {
              console.warn('Firestore is offline, skipped user doc sync.');
              return;
            }
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          }
        })();
      } else {
        localStorage.removeItem('toeic_app_cached_auth');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
