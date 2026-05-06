import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmOC75R1lW55uLSdfZ4DstMgyl2pYwtUg",
  authDomain: "ai-avatar-8a814.firebaseapp.com",
  projectId: "ai-avatar-8a814",
  storageBucket: "ai-avatar-8a814.firebasestorage.app",
  messagingSenderId: "655872779224",
  appId: "1:655872779224:web:3d910e203b09b3031fc8ad",
  measurementId: "G-X3PMTCR3K3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
