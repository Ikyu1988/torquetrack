
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore";
// import { getStorage, type FirebaseStorage } from "firebase/storage";

// #############################################################################
// IMPORTANT: FIREBASE CONFIGURATION REQUIRED!
// #############################################################################
// You MUST replace the placeholder values below (e.g., "YOUR_API_KEY")
// with the actual configuration values from your Firebase project.
//
// HOW TO GET YOUR CONFIG:
// 1. Go to your Firebase project console.
// 2. Click on "Project settings" (the gear icon near "Project Overview").
// 3. Under the "General" tab, scroll down to "Your apps".
// 4. If you haven't registered a web app yet, do so.
// 5. Find your web app and look for the "SDK setup and configuration" section.
// 6. Select the "Config" option. This will show you an object with apiKey, authDomain, etc.
//
// It's highly recommended to use environment variables for your Firebase config
// for security and flexibility. Create a `.env.local` file in your project root
// and add your keys like this:
//
// NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain_here
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id_here
// ...and so on for all the keys.
//
// If you use environment variables, make sure to restart your Next.js
// development server after creating or modifying the .env.local file.
// #############################################################################

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

let app: FirebaseApp;
let auth: Auth;
// let db: Firestore;
// let storage: FirebaseStorage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// db = getFirestore(app);
// storage = getStorage(app);

export { app, auth /*, db, storage */ };
