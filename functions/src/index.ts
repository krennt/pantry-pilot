import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { verifyAuth } from './shared/middleware/auth';

// Import route handlers
import { authRoutes } from './auth/auth.routes';
import { itemsRoutes } from './items/items.routes';
import { mealsRoutes } from './meals/meals.routes';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/items', verifyAuth, itemsRoutes);
app.use('/meals', verifyAuth, mealsRoutes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Not found handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).send({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
  });
});

// Export the API as a Firebase Cloud Function
export const api = functions.https.onRequest(app);
