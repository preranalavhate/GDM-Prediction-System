import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDHB__7StBVVBKJiy1xNm4NJ3xGRThJ8zs",
  authDomain: "gestational-diab.firebaseapp.com",
  projectId: "gestational-diab",
  storageBucket: "gestational-diab.firebasestorage.app",
  messagingSenderId: "335399779212",
  appId: "1:335399779212:web:f7931c57607c13bbeeb4a9",
  measurementId: "G-E6KMLQRBPR"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
