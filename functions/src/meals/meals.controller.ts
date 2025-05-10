import { Request, Response } from 'express';
import { db, Timestamp, FieldPath } from '../shared/utils/firebase';
import { sendSuccess, sendError } from '../shared/utils/response';
import { Meal, MealIngredient } from '../shared/types/models';

/**
 * Get all meals for the authenticated user
 */
export const getAllMeals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const mealsSnapshot = await db
      .collection('meals')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();
    
    const meals: Meal[] = mealsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Omit<Meal, 'id'>,
    }));
    
    sendSuccess(res, { meals });
  } catch (error) {
    console.error('Error getting meals:', error);
    sendError(res, 'Failed to get meals');
  }
};

/**
 * Get a specific meal by ID with ingredients
 */
export const getMealById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    
    // Get meal document
    const mealDoc = await db.collection('meals').doc(id).get();
    
    if (!mealDoc.exists) {
      sendError(res, 'Meal not found', 404);
      return;
    }
    
    const mealData = mealDoc.data() as Omit<Meal, 'id'>;
    
    // Check if the meal belongs to the user
    if (mealData.userId !== req.user.uid) {
      sendError(res, 'Unauthorized: This meal does not belong to you', 403);
      return;
    }
    
    // Get meal ingredients
    const ingredientsSnapshot = await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .get();
    
    const ingredients: MealIngredient[] = ingredientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Omit<MealIngredient, 'id'>,
    }));
    
    // Get grocery item details for each ingredient
    const itemIds = ingredients.map((ingredient) => ingredient.itemId);
    
    let groceryItems: Record<string, any> = {};
    
    if (itemIds.length > 0) {
      // Firestore doesn't support 'in' queries with more than 10 values
      // So we need to chunk the itemIds array
      const chunkSize = 10;
      const chunks = [];
      
      for (let i = 0; i < itemIds.length; i += chunkSize) {
        chunks.push(itemIds.slice(i, i + chunkSize));
      }
      
      // Get grocery items for each chunk
      const itemPromises = chunks.map((chunk) => 
        db.collection('grocery_items')
          .where(FieldPath.documentId(), 'in', chunk)
          .get()
      );
      
      const itemSnapshots = await Promise.all(itemPromises);
      
      // Combine results
      itemSnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          groceryItems[doc.id] = {
            id: doc.id,
            ...doc.data(),
          };
        });
      });
    }
    
    // Combine meal data with ingredients and grocery items
    const meal: Meal & { ingredients: Array<MealIngredient & { item?: any }> } = {
      id: mealDoc.id,
      ...mealData,
      ingredients: ingredients.map((ingredient) => ({
        ...ingredient,
        item: groceryItems[ingredient.itemId] || null,
      })),
    };
    
    sendSuccess(res, { meal });
  } catch (error) {
    console.error('Error getting meal:', error);
    sendError(res, 'Failed to get meal');
  }
};

/**
 * Create a new meal
 */
export const createMeal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const mealData: Omit<Meal, 'id'> = {
      userId: req.user.uid,
      name: req.body.name,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      servings: req.body.servings || 1,
      prepTime: req.body.prepTime,
      cookTime: req.body.cookTime,
      createdAt: Timestamp.now(),
    };
    
    // Validate required fields
    if (!mealData.name) {
      sendError(res, 'Name is a required field', 400);
      return;
    }
    
    const docRef = await db.collection('meals').add(mealData);
    
    const newMeal: Meal = {
      id: docRef.id,
      ...mealData,
    };
    
    sendSuccess(res, { meal: newMeal }, 'Meal created successfully', 201);
  } catch (error) {
    console.error('Error creating meal:', error);
    sendError(res, 'Failed to create meal');
  }
};

/**
 * Update a meal
 */
export const updateMeal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    
    // Check if meal exists and belongs to the user
    const mealDoc = await db.collection('meals').doc(id).get();
    
    if (!mealDoc.exists) {
      sendError(res, 'Meal not found', 404);
      return;
    }
    
    const mealData = mealDoc.data() as Omit<Meal, 'id'>;
    
    if (mealData.userId !== req.user.uid) {
      sendError(res, 'Unauthorized: This meal does not belong to you', 403);
      return;
    }
    
    // Update fields that are provided
    const updates: Partial<Meal> = {};
    
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.imageUrl !== undefined) updates.imageUrl = req.body.imageUrl;
    if (req.body.servings !== undefined) updates.servings = req.body.servings;
    if (req.body.prepTime !== undefined) updates.prepTime = req.body.prepTime;
    if (req.body.cookTime !== undefined) updates.cookTime = req.body.cookTime;
    
    await db.collection('meals').doc(id).update(updates);
    
    sendSuccess(res, { id }, 'Meal updated successfully');
  } catch (error) {
    console.error('Error updating meal:', error);
    sendError(res, 'Failed to update meal');
  }
};

/**
 * Delete a meal
 */
export const deleteMeal = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    
    // Check if meal exists and belongs to the user
    const mealDoc = await db.collection('meals').doc(id).get();
    
    if (!mealDoc.exists) {
      sendError(res, 'Meal not found', 404);
      return;
    }
    
    const mealData = mealDoc.data() as Omit<Meal, 'id'>;
    
    if (mealData.userId !== req.user.uid) {
      sendError(res, 'Unauthorized: This meal does not belong to you', 403);
      return;
    }
    
    // Delete all ingredients
    const ingredientsSnapshot = await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .get();
    
    const batch = db.batch();
    
    ingredientsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the meal document
    batch.delete(db.collection('meals').doc(id));
    
    // Commit the batch
    await batch.commit();
    
    sendSuccess(res, { id }, 'Meal deleted successfully');
  } catch (error) {
    console.error('Error deleting meal:', error);
    sendError(res, 'Failed to delete meal');
  }
};

/**
 * Add ingredient to meal
 */
export const addIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    
    // Check if meal exists and belongs to the user
    const mealDoc = await db.collection('meals').doc(id).get();
    
    if (!mealDoc.exists) {
      sendError(res, 'Meal not found', 404);
      return;
    }
    
    const mealData = mealDoc.data() as Omit<Meal, 'id'>;
    
    if (mealData.userId !== req.user.uid) {
      sendError(res, 'Unauthorized: This meal does not belong to you', 403);
      return;
    }
    
    // Check if the grocery item exists
    const itemId = req.body.itemId;
    const itemDoc = await db.collection('grocery_items').doc(itemId).get();
    
    if (!itemDoc.exists) {
      sendError(res, 'Grocery item not found', 404);
      return;
    }
    
    // Create the ingredient
    const ingredientData: Omit<MealIngredient, 'id'> = {
      mealId: id,
      itemId: req.body.itemId,
      quantity: req.body.quantity || 1,
      unit: req.body.unit || itemDoc.data()?.defaultUnit || 'unit',
    };
    
    const docRef = await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .add(ingredientData);
    
    const newIngredient: MealIngredient = {
      id: docRef.id,
      ...ingredientData,
    };
    
    sendSuccess(
      res,
      { ingredient: newIngredient },
      'Ingredient added successfully',
      201
    );
  } catch (error) {
    console.error('Error adding ingredient:', error);
    sendError(res, 'Failed to add ingredient');
  }
};

/**
 * Update ingredient in meal
 */
export const updateIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id, ingredientId } = req.params;
    
    // Check if meal exists and belongs to the user
    const mealDoc = await db.collection('meals').doc(id).get();
    
    if (!mealDoc.exists) {
      sendError(res, 'Meal not found', 404);
      return;
    }
    
    const mealData = mealDoc.data() as Omit<Meal, 'id'>;
    
    if (mealData.userId !== req.user.uid) {
      sendError(res, 'Unauthorized: This meal does not belong to you', 403);
      return;
    }
    
    // Check if the ingredient exists
    const ingredientDoc = await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .doc(ingredientId)
      .get();
    
    if (!ingredientDoc.exists) {
      sendError(res, 'Ingredient not found', 404);
      return;
    }
    
    // Update fields that are provided
    const updates: Partial<MealIngredient> = {};
    
    if (req.body.quantity !== undefined) updates.quantity = req.body.quantity;
    if (req.body.unit !== undefined) updates.unit = req.body.unit;
    
    await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .doc(ingredientId)
      .update(updates);
    
    sendSuccess(
      res,
      { id: ingredientId },
      'Ingredient updated successfully'
    );
  } catch (error) {
    console.error('Error updating ingredient:', error);
    sendError(res, 'Failed to update ingredient');
  }
};

/**
 * Remove ingredient from meal
 */
export const removeIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id, ingredientId } = req.params;
    
    // Check if meal exists and belongs to the user
    const mealDoc = await db.collection('meals').doc(id).get();
    
    if (!mealDoc.exists) {
      sendError(res, 'Meal not found', 404);
      return;
    }
    
    const mealData = mealDoc.data() as Omit<Meal, 'id'>;
    
    if (mealData.userId !== req.user.uid) {
      sendError(res, 'Unauthorized: This meal does not belong to you', 403);
      return;
    }
    
    // Check if the ingredient exists
    const ingredientDoc = await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .doc(ingredientId)
      .get();
    
    if (!ingredientDoc.exists) {
      sendError(res, 'Ingredient not found', 404);
      return;
    }
    
    // Delete the ingredient
    await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .doc(ingredientId)
      .delete();
    
    sendSuccess(
      res,
      { id: ingredientId },
      'Ingredient removed successfully'
    );
  } catch (error) {
    console.error('Error removing ingredient:', error);
    sendError(res, 'Failed to remove ingredient');
  }
};

/**
 * Add all meal ingredients to shopping list
 */
export const addToShoppingList = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    
    // Check if meal exists and belongs to the user
    const mealDoc = await db.collection('meals').doc(id).get();
    
    if (!mealDoc.exists) {
      sendError(res, 'Meal not found', 404);
      return;
    }
    
    const mealData = mealDoc.data() as Omit<Meal, 'id'>;
    
    if (mealData.userId !== req.user.uid) {
      sendError(res, 'Unauthorized: This meal does not belong to you', 403);
      return;
    }
    
    // Get all ingredients for the meal
    const ingredientsSnapshot = await db
      .collection('meals')
      .doc(id)
      .collection('ingredients')
      .get();
    
    if (ingredientsSnapshot.empty) {
      sendSuccess(res, null, 'No ingredients to add to shopping list');
      return;
    }
    
    // Update grocery items to set needToBuy flag
    const batch = db.batch();
    const updatedItems: string[] = [];
    
    for (const doc of ingredientsSnapshot.docs) {
      const ingredient = doc.data() as MealIngredient;
      const itemRef = db.collection('grocery_items').doc(ingredient.itemId);
      
      // Get the current item data
      const itemDoc = await itemRef.get();
      
      if (itemDoc.exists) {
        batch.update(itemRef, {
          needToBuy: true,
          lastUpdated: Timestamp.now(),
          updatedBy: req.user.uid,
        });
        
        updatedItems.push(ingredient.itemId);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    sendSuccess(
      res,
      { count: updatedItems.length, items: updatedItems },
      `Added ${updatedItems.length} ingredients to shopping list`
    );
  } catch (error) {
    console.error('Error adding to shopping list:', error);
    sendError(res, 'Failed to add ingredients to shopping list');
  }
};
