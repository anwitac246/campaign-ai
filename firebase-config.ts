// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyDaPhDZ2A61AL28fPIF40meJrYtnXG2E-I",
  authDomain: "studyblog-9ff94.firebaseapp.com",
  databaseURL: "https://studyblog-9ff94-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "studyblog-9ff94",
  storageBucket: "studyblog-9ff94.firebasestorage.app",
  messagingSenderId: "483816626283",
  appId: "1:483816626283:web:eed77780e8a5f4f428f92e",
  measurementId: "G-59ML8L4VRW"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;