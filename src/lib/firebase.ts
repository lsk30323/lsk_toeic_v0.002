import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly set persistence to local to prevent logouts across app switches or iframe reloads
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

// Use localCache for instant offline availability and faster resume from sleep
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}),
  // @ts-ignore
  databaseId: firebaseConfig.firestoreDatabaseId
});

export const signInWithGoogle = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Native (Android/iOS): use Capacitor Firebase Auth plugin (no WebView popup)
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) throw new Error("No idToken returned from native sign-in");
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } else {
      // Web: use signInWithPopup as before
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);

    if (error?.code === 'auth/network-request-failed') {
      alert("로그인 네트워크 요청에 실패했습니다.\n- 브라우저의 '팝업 차단'을 해제해주세요.\n- 광고 차단 프로그램(Ad-blocker)을 일시 중지해주세요.\n- '서드파티 쿠키 차단' 옵션이 켜져있다면 해제해주세요.\n- 우측 상단의 '새 탭에서 열기' 버튼을 눌러 새 창에서 시도해보세요.");
    } else if (error?.code === 'auth/popup-closed-by-user') {
      // User closed the popup, normally fine to ignore but we can log
      console.warn("Sign-in popup closed by user.");
    } else if (error?.code === 'auth/popup-blocked') {
      alert("팝업이 차단되었습니다. 주소창 우측에서 팝업 차단을 해제한 뒤 다시 시도해주세요.");
    } else {
      alert(`로그인 중 오류가 발생했습니다: ${error?.message}`);
    }
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
