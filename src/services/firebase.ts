import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Cấu hình Firebase từ project oanhcua-9198f
const firebaseConfig = {
  apiKey: "AIzaSyBiPDqIr_cOwdI7Ky0oh9pG6Yaoimsha5c",
  authDomain: "oanhcua-9198f.firebaseapp.com",
  databaseURL: "https://oanhcua-9198f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oanhcua-9198f",
  storageBucket: "oanhcua-9198f.firebasestorage.app",
  messagingSenderId: "880220438273",
  appId: "1:880220438273:web:dec8389141ff806576e500"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const database = getDatabase(app);
export const auth = getAuth(app);

export default app;
