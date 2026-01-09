
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// #############################################################################
// ##                                                                         ##
// ##  🔥🔥🔥 CRITICAL FIREBASE CONFIGURATION REQUIRED! 🔥🔥🔥             ##
// ##                                                                         ##
// ##  You MUST set the NEXT_PUBLIC_FIREBASE_* environment variables in your  ##
// ##  hosting setup. Otherwise, your app will use invalid placeholder values.##
// ##                                                                         ##
// ##  Go to your Firebase project settings, find your web app config, and    ##
// ##  copy the values into your hosting environment.                         ##
// ##                                                                         ##
// #############################################################################

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A check to see if all required Firebase config values are present and not placeholders.
const isFirebaseConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("AIzaSyA") && // A more direct check for placeholder keys
  !firebaseConfig.projectId.includes("torquetrack-ts3ph");

let app: FirebaseApp;
let auth: Auth;

// Initialize Firebase only on the client-side and if the config is valid.
if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    if (isFirebaseConfigValid) {
      app = initializeApp(firebaseConfig);
    } else {
      console.error(
        "⛔️ FATAL FIREBASE CONFIG ERROR: Your application is using placeholder Firebase credentials. " +
        "Please update your Firebase App Hosting environment variables with your actual project's Firebase SDK config. " +
        "Firebase services (like Authentication) WILL NOT WORK correctly until this is resolved. " +
        "Refer to the comments in src/lib/firebase.ts for instructions."
      );
      // Create a dummy app to prevent downstream crashes, but services will not function.
      app = initializeApp({ apiKey: "INVALID_CONFIG", authDomain: "invalid.com", projectId: "invalid-project" });
    }
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
} else {
    // On the server, we might need a placeholder or a different initialization (e.g., Admin SDK)
    // For this client-focused setup, we can create a non-functional placeholder.
    if (getApps().length === 0) {
        app = initializeApp({ apiKey: "SERVER_PLACEHOLDER", authDomain: "server.invalid.com", projectId: "server-invalid-project" });
    } else {
        app = getApps()[0];
    }
    auth = getAuth(app);
}

export { app, auth };
