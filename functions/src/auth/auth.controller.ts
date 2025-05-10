import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { sendSuccess, sendError } from '../shared/utils/response';
import { db, Timestamp } from '../shared/utils/firebase';
import { User } from '../shared/types/models';

/**
 * Register a new user
 * @param req Express request object
 * @param res Express response object
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password) {
      sendError(res, 'Email and password are required', 400);
      return;
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
    });

    // Create user document in Firestore
    const userData: User = {
      uid: userRecord.uid,
      email: userRecord.email || email,
      displayName: userRecord.displayName || undefined,
      createdAt: Timestamp.now(),
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Create custom token for immediate login
    const token = await admin.auth().createCustomToken(userRecord.uid);

    sendSuccess(
      res,
      { user: userData, token },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Error registering user:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An error occurred during registration';
    sendError(res, errorMessage, 400);
  }
};

/**
 * Login a user
 * @param req Express request object
 * @param res Express response object
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Note: Firebase Authentication is handled client-side
    // This endpoint is for additional server-side logic if needed
    
    // For now, we'll just return a success message
    // In a real app, you might fetch user data from Firestore
    sendSuccess(res, null, 'Login is handled client-side with Firebase Auth');
  } catch (error) {
    console.error('Error in login endpoint:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An error occurred during login';
    sendError(res, errorMessage, 400);
  }
};
