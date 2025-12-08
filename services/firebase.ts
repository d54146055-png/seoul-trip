import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
// Note: In a real production build, use environment variables. 
// For this single-file demo structure, we initialize conditionally to prevent crashes if config is missing.
let app;
let db;

try {
    // Check if config is placeholder
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        console.warn("Firebase Config is missing. Please update services/firebase.ts");
    } else {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { db };