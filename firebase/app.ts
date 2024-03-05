import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { env } from "process";

const serviceAccount = {
  projectId: env.FIREBASE_PROJECT_ID,
  privateKey: env.FIREBASE_PRIVATE_KEY,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
}

const db = getFirestore();
export const columbaCol = db.collection(env.FIREBASE_COLLECTION_NAME!);
