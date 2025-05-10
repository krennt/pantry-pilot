import { Router } from 'express';
import * as mealsController from './meals.controller';

const router = Router();

// Get all meals for the authenticated user
router.get('/', mealsController.getAllMeals);

// Get a specific meal with ingredients
router.get('/:id', mealsController.getMealById);

// Create a new meal
router.post('/', mealsController.createMeal);

// Update a meal
router.put('/:id', mealsController.updateMeal);

// Delete a meal
router.delete('/:id', mealsController.deleteMeal);

// Add ingredient to meal
router.post('/:id/ingredients', mealsController.addIngredient);

// Update ingredient in meal
router.put('/:id/ingredients/:ingredientId', mealsController.updateIngredient);

// Remove ingredient from meal
router.delete('/:id/ingredients/:ingredientId', mealsController.removeIngredient);

// Add all meal ingredients to shopping list
router.post('/:id/shopping', mealsController.addToShoppingList);

export const mealsRoutes = router;
