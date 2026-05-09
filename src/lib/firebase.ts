import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import firebaseConfig from '../../firebase-applet-config.json';

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

import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInAnonymously,
  signOut,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import firebaseConfig from '../../firebase-applet-config.json';

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

export const signInWithGoogle = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error("No idToken returned from native sign-in");
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } else {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    alert(`Google 로그인 오류: ${error?.message || error?.code}`);
  }
};

export const signInWithApple = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithApple();
      const idToken = result.credential?.idToken;
      const nonce = result.credential?.nonce;
      if (!idToken) throw new Error("No idToken returned from Apple sign-in");
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce: nonce });
      await signInWithCredential(auth, credential);
    } else {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
    }
  } catch (error: any) {
    console.error("Apple sign-in error:", error);
    const code = error?.code || '';
    if (code.includes('operation-not-allowed') || code.includes('admin-restricted')) {
      alert('Apple 로그인이 비활성화되어 있습니다. Firebase 콘솔에서 Apple 제공업체를 활성화해주세요.');
    } else {
      alert(`Apple 로그인 오류: ${error?.message || code}`);
    }
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

export const logOut = async () => {
  try {
    localStorage.removeItem('toeic_app_cached_auth');
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }
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
