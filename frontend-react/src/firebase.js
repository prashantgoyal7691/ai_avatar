import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDD4kRlgZGPEamlWpBNJ0yPHTbts16B5Sw",
  authDomain: "ai-avatar-ca759.firebaseapp.com",
  projectId: "ai-avatar-ca759",
  storageBucket: "ai-avatar-ca759.firebasestorage.app",
  messagingSenderId: "944598528306",
  appId: "1:944598528306:web:4fa8b0ea851c1d479ca72b",
  measurementId: "G-PYRRLHZBYT",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
