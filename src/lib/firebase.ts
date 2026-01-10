
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
  apiKey: "AIzaSyAUdpkhWz2NjWXsn5KamJyYzArVp7szA5Q",
  authDomain: "torquetrack-ts3ph.firebaseapp.com",
  projectId: "torquetrack-ts3ph",
  storageBucket: "torquetrack-ts3ph.firebasestorage.app",
  messagingSenderId: "572902936608",
  appId: "1:572902936608:web:fd25063f0707df5e68ec45"
};
// A check to see if all required Firebase config values are present and not placeholders.
const isFirebaseConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("AIzaSyAUdpkhWz2NjWXsn5KamJyYzArVp7szA5Q") && // A more direct check for placeholder keys
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
