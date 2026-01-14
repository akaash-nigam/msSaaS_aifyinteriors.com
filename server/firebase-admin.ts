import admin from "firebase-admin";

// Initialize Firebase Admin SDK
let app: admin.app.App;

try {
  // Check if we have a service account key in environment
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Parse service account JSON from environment variable
    const serviceAccount = JSON.parse(serviceAccountKey);

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin SDK initialized with service account");
  } else {
    // Fallback: Use default credentials (for local development)
    app = admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "microsaas-projects-2024",
    });

    console.log("⚠️  Firebase Admin SDK initialized with default credentials");
    console.log("💡 For production, set FIREBASE_SERVICE_ACCOUNT_KEY environment variable");
  }
} catch (error: any) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
  throw error;
}

// Export Firebase Admin services
export const auth = admin.auth;
export const firestore = admin.firestore;
export const storage = admin.storage;

export default app;
