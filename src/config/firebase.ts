// Firebase Web SDK 設定（Firebase CLI で自動取得済み）
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCh3aSSJ68LhI1AU0AMAwIIKppK7qENkWQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fordays-guests-nhftc.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fordays-guests-nhftc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fordays-guests-nhftc.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "323114923596",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:323114923596:web:a9a7dfc0fc7e44782d66e9",
};

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
