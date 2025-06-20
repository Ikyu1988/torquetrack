
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
// ##  Firebase project's configuration. This can be done by setting        ##
// ##  the NEXT_PUBLIC_FIREBASE_* environment variables in your hosting setup.##
// ##                                                                         ##
// ##  FAILURE TO DO SO WILL RESULT IN AUTHENTICATION AND OTHER ERRORS.       ##
// ##                                                                         ##
// ##  HOW TO GET YOUR CONFIG:                                                ##
// ##  1. Go to your Firebase project console: https://console.firebase.google.com/ ##
// ##  2. Select your project.                                                ##
// ##  3. Click on "Project settings" (the gear icon).                        ##
// ##  4. Under "General" tab, scroll to "Your apps".                         ##
// ##  5. If no web app, click "Add app" (</> icon) and follow instructions.  ##
// ##  6. Find your web app, select "Config" under "SDK setup".               ##
// ##  7. Copy these values into your Firebase App Hosting environment vars.  ##
// ##                                                                         ##
// #############################################################################
// #############################################################################

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAUdpkhWz2NjWXsn5KamJyYzArVp7szA5Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "torquetrack-ts3ph.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "torquetrack-ts3ph",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "torquetrack-ts3ph.appspot.com", // Corrected placeholder
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "572902936608",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:572902936608:web:fd25063f0707df5e68ec45",
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

// Define default placeholder values for a more robust check
const DEFAULT_PLACEHOLDER_API_KEY = "AIzaSyAUdpkhWz2NjWXsn5KamJyYzArVp7szA5Q";
const DEFAULT_PLACEHOLDER_AUTH_DOMAIN = "torquetrack-ts3ph.firebaseapp.com";
const DEFAULT_PLACEHOLDER_PROJECT_ID = "torquetrack-ts3ph";
const DEFAULT_PLACEHOLDER_STORAGE_BUCKET = "torquetrack-ts3ph.appspot.com"; // Ensure this matches the corrected one above
const DEFAULT_PLACEHOLDER_MESSAGING_SENDER_ID = "572902936608";
const DEFAULT_PLACEHOLDER_APP_ID = "1:572902936608:web:fd25063f0707df5e68ec45";

const IS_PLACEHOLDER_CONFIG =
  !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("AIzaSyAUdpkhWz2NjWXsn5KamJyYzArVp7szA5Q") || firebaseConfig.apiKey === DEFAULT_PLACEHOLDER_API_KEY ||
  !firebaseConfig.authDomain || firebaseConfig.authDomain.startsWith("torquetrack-ts3ph.firebaseapp.com") || firebaseConfig.authDomain === DEFAULT_PLACEHOLDER_AUTH_DOMAIN ||
  !firebaseConfig.projectId || firebaseConfig.projectId.startsWith("torquetrack-ts3ph") || firebaseConfig.projectId === DEFAULT_PLACEHOLDER_PROJECT_ID ||
  !firebaseConfig.storageBucket || firebaseConfig.storageBucket.startsWith("torquetrack-ts3ph.appspot.com") || firebaseConfig.storageBucket === DEFAULT_PLACEHOLDER_STORAGE_BUCKET ||
  !firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId.startsWith("572902936608") || firebaseConfig.messagingSenderId === DEFAULT_PLACEHOLDER_MESSAGING_SENDER_ID ||
  !firebaseConfig.appId || firebaseConfig.appId.startsWith("1:572902936608:web:fd25063f0707df5e68ec45") || firebaseConfig.appId === DEFAULT_PLACEHOLDER_APP_ID;


let app: FirebaseApp;
let auth: Auth;
// let db: Firestore;
// let storage: FirebaseStorage;

if (IS_PLACEHOLDER_CONFIG && typeof window !== 'undefined') { // Log error prominently in browser console too
  console.error(
    "⛔️ FATAL FIREBASE CONFIG ERROR: Your application is using placeholder Firebase credentials. " +
    "Please update your Firebase App Hosting environment variables with your actual project's Firebase SDK config. " +
    "Firebase services (like Authentication) WILL NOT WORK correctly until this is resolved. " +
    "Refer to the comments in src/lib/firebase.ts for instructions."
  );
}


// Initialize Firebase
if (typeof window !== 'undefined') { // Ensure Firebase is initialized only on the client-side for Next.js App Router
    if (getApps().length === 0) {
        if (!IS_PLACEHOLDER_CONFIG) {
            app = initializeApp(firebaseConfig);
        } else {
            // Initialize with a dummy config to prevent app crashing further down the line,
            // but Firebase services will not function. The error above is the primary indicator.
            console.error("Firebase initialized with DUMMY (invalid) configuration due to placeholder values being detected. Authentication and other Firebase services will fail.");
            app = initializeApp({ apiKey: "INVALID_CONFIG_SEE_ERROR_ABOVE", authDomain: "invalid.com", projectId: "invalid-project" });
        }
    } else {
        app = getApps()[0];
    }
    auth = getAuth(app);
    // db = getFirestore(app);
    // storage = getStorage(app);
} else {
  // Handle server-side case if needed, though auth is primarily client-side
  // This part might need adjustment based on server-side Firebase usage patterns
  if (getApps().length === 0) {
    // On the server, if config is placeholder, we should also avoid initializing or use dummy
    if (IS_PLACEHOLDER_CONFIG) {
        console.error("SERVER-SIDE: Firebase configuration appears to be using placeholders. Firebase Admin SDK or server-side client SDK usage might fail.");
        app = initializeApp({ apiKey: "SERVER_INVALID_CONFIG", authDomain: "server.invalid.com", projectId: "server-invalid-project" });
    } else {
        app = initializeApp(firebaseConfig);
    }
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app); // This will likely not be functional server-side without specific setup for client SDK.
}


export { app, auth /*, db, storage */ };

