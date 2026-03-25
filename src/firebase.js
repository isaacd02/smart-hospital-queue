import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDfqa4iGQqRaOYYrf22QXbOpQufkDp2NpI",
  authDomain: "smart-hospital-queue-fa70b.firebaseapp.com",
  databaseURL: "https://smart-hospital-queue-fa70b-default-rtdb.firebaseio.com",
  projectId: "smart-hospital-queue-fa70b",
  storageBucket: "smart-hospital-queue-fa70b.firebasestorage.app",
  messagingSenderId: "188015976523",
  appId: "1:188015976523:web:bbdf17cf166354d30badce"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);