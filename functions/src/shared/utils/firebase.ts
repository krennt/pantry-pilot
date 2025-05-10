import * as admin from 'firebase-admin';

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export Firestore database instance
export const db = admin.firestore();

// Export Firebase Storage instance
export const storage = admin.storage();

// Export Firebase Auth instance
export const auth = admin.auth();

// Export Firestore FieldValue for use in updates
export const FieldValue = admin.firestore.FieldValue;

// Export Firestore Timestamp for use in date operations
export const Timestamp = admin.firestore.Timestamp;

// Export Firestore FieldPath for use in queries
export const FieldPath = admin.firestore.FieldPath;

export default admin;
