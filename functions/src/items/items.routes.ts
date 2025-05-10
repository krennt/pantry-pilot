import { Router } from 'express';
import * as itemsController from './items.controller';

const router = Router();

// Get all grocery items
router.get('/', itemsController.getAllItems);

// Get shopping list (items with needToBuy flag)
router.get('/shopping', itemsController.getShoppingList);

// Get a specific grocery item
router.get('/:id', itemsController.getItemById);

// Create a new grocery item
router.post('/', itemsController.createItem);

// Update a grocery item
router.put('/:id', itemsController.updateItem);

// Delete a grocery item
router.delete('/:id', itemsController.deleteItem);

// Toggle needToBuy flag
router.put('/:id/buy', itemsController.toggleNeedToBuy);

// Toggle inCart flag
router.put('/:id/cart', itemsController.toggleInCart);

// Reset all inCart flags to false
router.post('/reset-cart', itemsController.resetCart);

export const itemsRoutes = router;
