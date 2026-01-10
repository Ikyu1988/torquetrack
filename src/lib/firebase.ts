// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUdpkhWz2NjWXsn5KamJyYzArVp7szA5Q",
  authDomain: "torquetrack-ts3ph.firebaseapp.com",
  projectId: "torquetrack-ts3ph",
  storageBucket: "torquetrack-ts3ph.appspot.com",
  messagingSenderId: "572902936608",
  appId: "1:572902936608:web:fd25063f0707df5e68ec45",
  measurementId: "G-1XNZD5ZF4Q"
};


let app: FirebaseApp;
let auth: Auth;

// Initialize Firebase only on the client-side.
if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
} else {
    // On the server, create a placeholder.
    if (getApps().length === 0) {
        app = initializeApp({ apiKey: "SERVER_PLACEHOLDER", authDomain: "server.invalid.com", projectId: "server-invalid-project" });
    } else {
        app = getApps()[0];
    }
    auth = getAuth(app);
}

export { app, auth };
