import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInAnonymously,
  signOut,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import firebaseConfig from '../../firebase-applet-config.json';
import { supabase } from './supabase';
import { Browser } from '@capacitor/browser';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  // @ts-ignore
  databaseId: firebaseConfig.firestoreDatabaseId
});

// Google sign-in via Supabase OAuth (bypasses Android Credential Manager).
// After Supabase auth completes, a deep link handler bridges to Firebase
// by creating/keeping an anonymous Firebase user and storing the Google
// profile (email, name, avatar) in Firestore.
export const signInWithGoogle = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.example.toeicapp://login-callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL from Supabase');
      await Browser.open({ url: data.url, presentationStyle: 'popover' });
      // Flow resumes in handleSupabaseDeepLink (see App entry).
    } else {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    alert(`Google 로그인 오류: ${error?.message || error?.code}`);
  }
};

// Called by the app's appUrlOpen deep-link handler when Supabase returns
// the OAuth callback with access/refresh tokens. Sets the Supabase session,
// closes the in-app browser, ensures a Firebase user exists, and writes the
// Google profile into Firestore.
export const handleSupabaseDeepLink = async (url: string) => {
  try {
    const hashOrQuery = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || '';
    const params = new URLSearchParams(hashOrQuery);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) {
      console.warn('Deep link missing tokens — ignoring', url);
      return;
    }
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (sessionError) throw sessionError;
    const supabaseUser = sessionData.session?.user;
    if (!supabaseUser) throw new Error('No Supabase user after setSession');

    try { await Browser.close(); } catch { /* ignore */ }

    // Ensure a Firebase user exists (anonymous). If user is already signed in
    // (e.g., as Guest), keep their UID so Firestore data is preserved.
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        supabase_user_id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        name: (supabaseUser.user_metadata as any)?.full_name ?? null,
        avatar_url: (supabaseUser.user_metadata as any)?.avatar_url ?? null,
        provider: 'google',
        linked_at: serverTimestamp(),
      }, { merge: true });
    }

    alert('Google 로그인 완료.');
  } catch (error: any) {
    console.error('Supabase deep link handler error:', error);
    alert(`Google 로그인 처리 오류: ${error?.message || error?.code}`);
  }
};

export const signInWithGuest = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error: any) {
    console.error("Guest sign-in error:", error);
    const code = error?.code || '';
    if (code === 'auth/admin-restricted-operation' || code === 'auth/operation-not-allowed') {
      alert('Guest 로그인이 비활성화되어 있습니다. Firebase 콘솔에서 Anonymous 제공업체를 활성화해주세요.');
    } else {
      alert(`Guest 로그인 오류: ${error?.message || code}`);
    }
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("Email sign-in error:", error);
    const code = error?.code || '';
    if (code === 'auth/user-not-found') alert('해당 이메일 계정이 없습니다. 회원가입을 먼저 해주세요.');
    else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') alert('이메일 또는 비밀번호가 올바르지 않습니다.');
    else if (code === 'auth/invalid-email') alert('이메일 형식이 올바르지 않습니다.');
    else if (code === 'auth/too-many-requests') alert('너무 많은 시도. 잠시 후 다시 시도해주세요.');
    else alert(`로그인 오류: ${error?.message || code}`);
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("Email sign-up error:", error);
    const code = error?.code || '';
    if (code === 'auth/email-already-in-use') alert('이미 사용 중인 이메일입니다. 로그인을 시도해보세요.');
    else if (code === 'auth/weak-password') alert('비밀번호는 6자 이상이어야 합니다.');
    else if (code === 'auth/invalid-email') alert('이메일 형식이 올바르지 않습니다.');
    else alert(`회원가입 오류: ${error?.message || code}`);
  }
};

// Link the currently anonymous (Guest) account to a Google account.
// Preserves the user's UID and existing Firestore data.
// Link the currently anonymous (Guest) Firebase user to a Google account
// via Supabase OAuth. Since Method A keeps Firebase user anonymous, "linking"
// here means writing Google profile data to the existing Firebase UID's
// Firestore document — the UID stays the same so Firestore data is preserved.
// (The actual implementation routes through signInWithGoogle which checks
//  auth.currentUser before signing in a new anonymous user.)
export const linkAnonymousToGoogle = async () => {
  if (!auth.currentUser || !auth.currentUser.isAnonymous) {
    alert('Guest 사용자만 Google 계정 연결이 가능합니다.');
    return;
  }
  try {
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.example.toeicapp://login-callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL from Supabase');
      await Browser.open({ url: data.url, presentationStyle: 'popover' });
      // Resumes in handleSupabaseDeepLink — existing anonymous UID is kept,
      // Google profile is merged into the Firestore user document.
    } else {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      alert('Google 계정 연결 완료.');
    }
  } catch (error: any) {
    console.error('Link to Google error:', error);
    alert(`Google 계정 연결 오류: ${error?.message || error?.code}`);
  }
};

// Link the currently anonymous (Guest) account to an email/password account.
// Preserves the user's UID and existing Firestore data.
// Useful as a fallback when native Google linking hits "No credentials available".
export const linkAnonymousToEmail = async (email: string, password: string) => {
  if (!auth.currentUser || !auth.currentUser.isAnonymous) {
    alert('Guest 사용자만 계정 연결이 가능합니다.');
    return;
  }
  try {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(auth.currentUser, credential);
    alert('이메일 계정 연결 완료. 다음번부터 이 이메일과 비밀번호로 로그인할 수 있습니다.');
  } catch (error: any) {
    console.error('Link to email error:', error);
    const code = error?.code || '';
    if (code === 'auth/email-already-in-use') {
      alert('이 이메일은 이미 다른 계정에서 사용 중입니다.');
    } else if (code === 'auth/weak-password') {
      alert('비밀번호는 6자 이상이어야 합니다.');
    } else if (code === 'auth/invalid-email') {
      alert('이메일 형식이 올바르지 않습니다.');
    } else if (code === 'auth/credential-already-in-use') {
      alert('이 이메일 자격증명은 이미 사용 중입니다.');
    } else {
      alert(`이메일 계정 연결 오류: ${error?.message || code}`);
    }
  }
};

export const logOut = async () => {
  try {
    localStorage.removeItem('toeic_app_cached_auth');
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

