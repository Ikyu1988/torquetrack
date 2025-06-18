
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getFirestore, type Firestore } from "firebase/firestore";
// import { getStorage, type FirebaseStorage } from "firebase/storage";

// #############################################################################
// #############################################################################
// ##                                                                         ##
// ##  🔥🔥🔥 CRITICAL FIREBASE CONFIGURATION REQUIRED! 🔥🔥🔥             ##
// ##                                                                         ##
// ##  You MUST replace the placeholder values below with your ACTUAL         ##
// ##  Firebase project's configuration.                                      ##
// ##                                                                         ##
// ##  FAILURE TO DO SO WILL RESULT IN 'auth/api-key-not-valid' ERRORS.       ##
// ##                                                                         ##
// ##  HOW TO GET YOUR CONFIG:                                                ##
// ##  1. Go to your Firebase project console: https://console.firebase.google.com/ ##
// ##  2. Select your project.                                                ##
// ##  3. Click on "Project settings" (the gear icon).                        ##
// ##  4. Under "General" tab, scroll to "Your apps".                         ##
// ##  5. If no web app, click "Add app" (</> icon).                          ##
// ##  6. Find your web app, select "Config" under "SDK setup".               ##
// ##                                                                         ##
// ##  RECOMMENDED: Use a `.env.local` file in your project root:             ##
// ##                                                                         ##
// ##  NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here                  ##
// ##  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain_here          ##
// ##  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id_here            ##
// ##  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket_here    ##
// ##  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id_here ##
// ##  NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id_here                    ##
// ##                                                                         ##
// ##  IMPORTANT: AFTER MODIFYING .env.local, RESTART your Next.js server.    ##
// ##                                                                         ##
// #############################################################################
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

const IS_PLACEHOLDER_CONFIG = 
  !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("YOUR_") ||
  !firebaseConfig.authDomain || firebaseConfig.authDomain.startsWith("YOUR_") ||
  !firebaseConfig.projectId || firebaseConfig.projectId.startsWith("YOUR_");

if (IS_PLACEHOLDER_CONFIG) {
  console.error(
    "🚨🚨🚨 FATAL FIREBASE CONFIG ERROR 🚨🚨🚨\n" +
    "Firebase configuration is MISSING or uses PLACEHOLDER values.\n" +
    "You MUST provide your actual Firebase project credentials in `src/lib/firebase.ts` " +
    "or (recommended) in a `.env.local` file.\n" +
    "Please refer to the comments in `src/lib/firebase.ts` for detailed instructions.\n" +
    "Authentication and other Firebase services WILL NOT WORK until this is fixed."
  );
}

if (getApps().length === 0) {
  if (!IS_PLACEHOLDER_CONFIG) {
    app = initializeApp(firebaseConfig);
  } else {
    // Initialize with a dummy config to prevent app crashing further down the line,
    // but Firebase services will not function. The error above is the primary indicator.
    app = initializeApp({ apiKey: "INVALID_CONFIG_SEE_ERROR_ABOVE", authDomain: "", projectId: "" });
  }
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// db = getFirestore(app);
// storage = getStorage(app);

export { app, auth /*, db, storage */ };
