import { Request, Response, NextFunction } from 'express';
import { auth } from '../utils/firebase';
import { sendError } from '../utils/response';

/**
 * Middleware to verify Firebase authentication token
 */
export const verifyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Unauthorized: No token provided', 401);
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
      };
      return next();
    } catch (error) {
      return sendError(res, 'Unauthorized: Invalid token', 401);
    }
  } catch (error) {
    return sendError(res, 'Internal server error', 500);
  }
};

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
      };
    }
  }
}
