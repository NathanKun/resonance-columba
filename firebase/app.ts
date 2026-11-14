import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "process";

export const isFirebaseConfigured = Boolean(
  env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL
);

let db: ReturnType<typeof getFirestore> | null = null;

const getDb = () => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured");
  }

  if (!db) {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    db = getFirestore();
    db.settings({ ignoreUndefinedProperties: true });
  }

  return db;
};

export const getColumbaCol = () => {
  const collectionName = env.FIREBASE_COLLECTION_NAME;
  if (!collectionName) {
    throw new Error("Firebase collection is not configured");
  }
  return getDb().collection(collectionName);
};
export const getPlayerConfigsCol = () => getDb().collection("playerConfigs");
