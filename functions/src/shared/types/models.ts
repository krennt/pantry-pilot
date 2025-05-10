/**
 * Type definitions for the PantryPilot application data models
 */

/**
 * User model
 */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Grocery item model
 */
export interface GroceryItem {
  id?: string;
  name: string;
  category: string;
  defaultUnit: string;
  imageUrl?: string;
  needToBuy: boolean;
  inCart: boolean;
  quantity?: number;
  unit?: string;
  lastUpdated?: FirebaseFirestore.Timestamp | Date;
  updatedBy?: string;
}

/**
 * Meal model
 */
export interface Meal {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Meal ingredient model
 */
export interface MealIngredient {
  id?: string;
  mealId: string;
  itemId: string;
  quantity: number;
  unit: string;
}

/**
 * API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
