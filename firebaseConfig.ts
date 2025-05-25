import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REMOVED_FIREBASE_API_KEY",
  authDomain: "REMOVED_FIREBASE_AUTH_DOMAIN",
  projectId: "REMOVED_PROJECT_ID",
  storageBucket: "REMOVED_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "REMOVED_SENDER_ID",
  appId: "1:REMOVED_SENDER_ID:web:8f81b6933b1a62c62a2f9c"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

