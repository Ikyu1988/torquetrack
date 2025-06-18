
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore";
// import { getStorage, type FirebaseStorage } from "firebase/storage";

// #############################################################################
// IMPORTANT: FIREBASE CONFIGURATION REQUIRED!
// #############################################################################
//
// CRITICAL STEP: You MUST replace the placeholder values below 
// (e.g., "YOUR_API_KEY") with the actual configuration values from your 
// Firebase project. Failure to do so will result in authentication errors
// like "auth/api-key-not-valid".
//
// HOW TO GET YOUR CONFIG:
// 1. Go to your Firebase project console: https://console.firebase.google.com/
// 2. Select your project.
// 3. Click on "Project settings" (the gear icon near "Project Overview").
// 4. Under the "General" tab, scroll down to "Your apps".
// 5. If you haven't registered a web app yet, click "Add app" and select the web platform (</>).
// 6. Find your web app in the list and look for the "SDK setup and configuration" section.
// 7. Select the "Config" option. This will show you an object with apiKey, authDomain, etc.
//
// RECOMMENDED METHOD: Use Environment Variables
// For security and flexibility, use a `.env.local` file in your project root.
// Add your Firebase keys like this:
//
// NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain_here
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id_here
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket_here
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id_here
// NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id_here
//
// IMPORTANT: After creating or modifying the .env.local file, you MUST
// restart your Next.js development server for the changes to take effect.
//
// #############################################################################

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_NEEDS_TO_BE_SET",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN_NEEDS_TO_BE_SET",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_NEEDS_TO_BE_SET",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET_NEEDS_TO_BE_SET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID_NEEDS_TO_BE_SET",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID_NEEDS_TO_BE_SET",
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

let app: FirebaseApp;
let auth: Auth;
// let db: Firestore;
// let storage: FirebaseStorage;

if (getApps().length === 0) {
  // Check if all essential config values are more than just placeholders
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_") &&
      firebaseConfig.authDomain && !firebaseConfig.authDomain.startsWith("YOUR_") &&
      firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("YOUR_")) {
    app = initializeApp(firebaseConfig);
  } else {
    console.error(
      "Firebase configuration is missing or incomplete. " +
      "Please check your .env.local file or src/lib/firebase.ts " +
      "and ensure all Firebase config values (apiKey, authDomain, projectId, etc.) are correctly set " +
      "from your Firebase project console. You are likely seeing placeholder values."
    );
    // Fallback to prevent app crash, but auth will not work
    app = initializeApp({ apiKey: "INVALID_CONFIG", authDomain: "", projectId: "" }); 
  }
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// db = getFirestore(app);
// storage = getStorage(app);

export { app, auth /*, db, storage */ };
