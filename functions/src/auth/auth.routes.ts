import { Router } from 'express';
import * as authController from './auth.controller';

const router = Router();

// Register a new user
router.post('/register', authController.register);

// Login a user
router.post('/login', authController.login);

export const authRoutes = router;
