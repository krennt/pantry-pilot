import { Request, Response } from 'express';
import { db, Timestamp } from '../shared/utils/firebase';
import { sendSuccess, sendError } from '../shared/utils/response';
import { GroceryItem } from '../shared/types/models';

/**
 * Get all grocery items
 */
export const getAllItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const itemsSnapshot = await db.collection('grocery_items').get();
    
    const items: GroceryItem[] = itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Omit<GroceryItem, 'id'>,
    }));
    
    sendSuccess(res, { items });
  } catch (error) {
    console.error('Error getting items:', error);
    sendError(res, 'Failed to get grocery items');
  }
};

/**
 * Get shopping list (items with needToBuy flag or inCart flag)
 */
export const getShoppingList = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Getting shopping list items...');
    
    // Get all grocery items
    const allItemsSnapshot = await db.collection('grocery_items').get();
    console.log(`Found ${allItemsSnapshot.size} total grocery items`);
    
    // Filter items manually
    const items: GroceryItem[] = [];
    const needToBuyItems: GroceryItem[] = [];
    const inCartItems: GroceryItem[] = [];
    const falseNeedToBuyTrueInCartItems: GroceryItem[] = []; // Special case tracking
    
    // Log raw data for debugging
    console.log('Raw data from Firestore:');
    allItemsSnapshot.docs.forEach((doc, index) => {
      const rawData = doc.data();
      console.log(`Item ${index} (${doc.id}):`, JSON.stringify(rawData));
    });
    
    allItemsSnapshot.docs.forEach(doc => {
      const data = doc.data() as Omit<GroceryItem, 'id'>;
      const item = {
        id: doc.id,
        ...data,
      };
      
      // Log each item with type information for debugging
      console.log(`Item ID: ${doc.id}, Name: ${data.name}`);
      console.log(`  inCart: ${data.inCart} (type: ${typeof data.inCart})`);
      console.log(`  needToBuy: ${data.needToBuy} (type: ${typeof data.needToBuy})`);
      
      // Check for our special case: needToBuy=false and inCart=true
      if (data.needToBuy === false && data.inCart === true) {
        console.log(`FOUND SPECIAL CASE: Item ${doc.id} (${data.name}) has needToBuy=false and inCart=true`);
        falseNeedToBuyTrueInCartItems.push(item);
      }
      
      // Check if the item should be included in the shopping list
      if (data.needToBuy === true) {
        needToBuyItems.push(item);
      }
      
      if (data.inCart === true) {
        inCartItems.push(item);
        console.log(`Found item with inCart=true: ${doc.id}, Name: ${data.name}`);
      }
      
      // Modified condition to be more explicit and handle potential edge cases
      // This should include items where either needToBuy is true OR inCart is true
      const shouldInclude = Boolean(data.needToBuy) || Boolean(data.inCart);
      if (shouldInclude) {
        items.push(item);
        console.log(`Added item to results: ${doc.id}, Name: ${data.name}, Reason: needToBuy=${data.needToBuy}, inCart=${data.inCart}`);
      } else {
        console.log(`Excluded item from results: ${doc.id}, Name: ${data.name}, Reason: needToBuy=${data.needToBuy}, inCart=${data.inCart}`);
      }
    });
    
    console.log(`Found ${needToBuyItems.length} items with needToBuy=true`);
    console.log(`Found ${inCartItems.length} items with inCart=true`);
    console.log(`Found ${falseNeedToBuyTrueInCartItems.length} items with needToBuy=false and inCart=true`);
    
    // Log the inCart items for debugging
    if (inCartItems.length > 0) {
      console.log('Items with inCart=true:');
      inCartItems.forEach(item => {
        console.log(`- Item ID: ${item.id}, Name: ${item.name}, inCart: ${item.inCart}, needToBuy: ${item.needToBuy}`);
      });
    } else {
      console.log('No items found with inCart=true');
    }
    
    // Log the special case items
    if (falseNeedToBuyTrueInCartItems.length > 0) {
      console.log('Items with needToBuy=false and inCart=true:');
      falseNeedToBuyTrueInCartItems.forEach(item => {
        console.log(`- Item ID: ${item.id}, Name: ${item.name}, inCart: ${item.inCart}, needToBuy: ${item.needToBuy}`);
      });
    }
    
    console.log(`Returning ${items.length} total items`);
    console.log('Items breakdown:');
    console.log(`- Items with needToBuy=true: ${items.filter(item => item.needToBuy).length}`);
    console.log(`- Items with inCart=true: ${items.filter(item => item.inCart).length}`);
    
    // Double-check if our special case items are included in the final results
    if (falseNeedToBuyTrueInCartItems.length > 0) {
      const includedSpecialCaseItems = items.filter(item => 
        falseNeedToBuyTrueInCartItems.some(specialItem => specialItem.id === item.id)
      );
      
      console.log(`Of the ${falseNeedToBuyTrueInCartItems.length} special case items, ${includedSpecialCaseItems.length} are included in the final results`);
      
      if (includedSpecialCaseItems.length < falseNeedToBuyTrueInCartItems.length) {
        console.log('WARNING: Some special case items are not included in the final results!');
      }
    }
    
    sendSuccess(res, { items });
  } catch (error) {
    console.error('Error getting shopping list:', error);
    sendError(res, 'Failed to get shopping list');
  }
};

/**
 * Get a specific grocery item by ID
 */
export const getItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const itemDoc = await db.collection('grocery_items').doc(id).get();
    
    if (!itemDoc.exists) {
      sendError(res, 'Grocery item not found', 404);
      return;
    }
    
    const item: GroceryItem = {
      id: itemDoc.id,
      ...itemDoc.data() as Omit<GroceryItem, 'id'>,
    };
    
    sendSuccess(res, { item });
  } catch (error) {
    console.error('Error getting item:', error);
    sendError(res, 'Failed to get grocery item');
  }
};

/**
 * Create a new grocery item
 */
export const createItem = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log the incoming request body for debugging
    console.log('Create item request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID from auth middleware:', req.user?.uid);
    
  // Create base item data
  const itemData: Omit<GroceryItem, 'id'> = {
    name: req.body.name,
    category: req.body.category,
    storeLocation: req.body.storeLocation,
    defaultUnit: req.body.defaultUnit,
    needToBuy: req.body.needToBuy !== undefined ? req.body.needToBuy : false,
    inCart: false, // Always initialize as false
    lastUpdated: Timestamp.now(),
    updatedBy: req.user?.uid,
  };
  
  // Only add quantity and unit if they are explicitly provided
  if (req.body.quantity !== undefined) {
    itemData.quantity = req.body.quantity;
  }
  
  if (req.body.unit !== undefined) {
    itemData.unit = req.body.unit;
  }
    
    // Add imageUrl only if it's defined, otherwise use a placeholder
    if (req.body.imageUrl !== undefined) {
      itemData.imageUrl = req.body.imageUrl;
    } else {
      // Use a placeholder image URL
      itemData.imageUrl = 'https://via.placeholder.com/150';
    }
    
    // Validate required fields
    if (!itemData.name || !itemData.category || !itemData.defaultUnit) {
      console.error('Validation error: Missing required fields');
      sendError(res, 'Name, category, and defaultUnit are required fields', 400);
      return;
    }
    
    console.log('Creating new grocery item with data:', JSON.stringify(itemData, null, 2));
    
    try {
      const docRef = await db.collection('grocery_items').add(itemData);
      console.log('Successfully created grocery item with ID:', docRef.id);
      
      const newItem: GroceryItem = {
        id: docRef.id,
        ...itemData,
      };
      
      // Return just the item without nesting it in another object
      sendSuccess(res, newItem, 'Grocery item created successfully', 201);
    } catch (dbError) {
      // More specific error for database operations
      console.error('Database error creating item:', dbError);
      const errorMessage = dbError instanceof Error 
        ? `Database error: ${dbError.message}` 
        : 'Unknown database error';
      sendError(res, `Failed to create grocery item: ${errorMessage}`, 500);
    }
  } catch (error) {
    // General error handling
    console.error('Error creating item:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error';
    sendError(res, `Failed to create grocery item: ${errorMessage}`, 500);
  }
};

/**
 * Update a grocery item
 */
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Log the incoming request for debugging
    console.log(`Update item request for ID ${id}:`, JSON.stringify(req.body, null, 2));
    console.log('User ID from auth middleware:', req.user?.uid);
    
    // Check if item exists
    const itemDoc = await db.collection('grocery_items').doc(id).get();
    
    if (!itemDoc.exists) {
      console.error(`Item with ID ${id} not found`);
      sendError(res, 'Grocery item not found', 404);
      return;
    }
    
    // Get the current item data
    const currentItemData = itemDoc.data() as Omit<GroceryItem, 'id'>;
    console.log('Current item data:', JSON.stringify(currentItemData, null, 2));
    
    // Update fields that are provided
    const updates: Partial<GroceryItem> = {};
    
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.storeLocation !== undefined) updates.storeLocation = req.body.storeLocation;
    if (req.body.defaultUnit !== undefined) updates.defaultUnit = req.body.defaultUnit;
    if (req.body.imageUrl !== undefined && req.body.imageUrl !== null) {
      updates.imageUrl = req.body.imageUrl;
    } else if (req.body.imageUrl === null) {
      // If explicitly set to null, use a placeholder
      updates.imageUrl = 'https://via.placeholder.com/150';
    }
    if (req.body.needToBuy !== undefined) updates.needToBuy = req.body.needToBuy;
    if (req.body.quantity !== undefined) updates.quantity = req.body.quantity;
    if (req.body.unit !== undefined) updates.unit = req.body.unit;
    
    // Always update these fields
    updates.lastUpdated = Timestamp.now();
    updates.updatedBy = req.user?.uid;
    
    console.log('Applying updates:', JSON.stringify(updates, null, 2));
    
    await db.collection('grocery_items').doc(id).update(updates);
    
    // Get the updated item to return in the response
    const updatedItemDoc = await db.collection('grocery_items').doc(id).get();
    const updatedItem = {
      id,
      ...updatedItemDoc.data() as Omit<GroceryItem, 'id'>
    };
    
    console.log('Item updated successfully:', JSON.stringify(updatedItem, null, 2));
    
    sendSuccess(res, { id, item: updatedItem }, 'Grocery item updated successfully');
  } catch (error) {
    console.error('Error updating item:', error);
    const errorMessage = error instanceof Error 
      ? `Failed to update grocery item: ${error.message}` 
      : 'Failed to update grocery item';
    sendError(res, errorMessage, 500);
  }
};

/**
 * Delete a grocery item
 */
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if item exists
    const itemDoc = await db.collection('grocery_items').doc(id).get();
    
    if (!itemDoc.exists) {
      sendError(res, 'Grocery item not found', 404);
      return;
    }
    
    await db.collection('grocery_items').doc(id).delete();
    
    sendSuccess(res, { id }, 'Grocery item deleted successfully');
  } catch (error) {
    console.error('Error deleting item:', error);
    sendError(res, 'Failed to delete grocery item');
  }
};

/**
 * Toggle needToBuy flag
 */
export const toggleNeedToBuy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if item exists
    const itemDoc = await db.collection('grocery_items').doc(id).get();
    
    if (!itemDoc.exists) {
      sendError(res, 'Grocery item not found', 404);
      return;
    }
    
    const itemData = itemDoc.data() as Omit<GroceryItem, 'id'>;
    
    // Toggle the needToBuy flag
    const needToBuy = !itemData.needToBuy;
    
    await db.collection('grocery_items').doc(id).update({
      needToBuy,
      lastUpdated: Timestamp.now(),
      updatedBy: req.user?.uid,
    });
    
    sendSuccess(res, { id, needToBuy }, 'Grocery item updated successfully');
  } catch (error) {
    console.error('Error toggling needToBuy:', error);
    sendError(res, 'Failed to update grocery item');
  }
};

/**
 * Toggle inCart flag
 */
export const toggleInCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`toggleInCart - Toggling inCart for item ID: ${id}`);
    
    // Check if item exists
    const itemDoc = await db.collection('grocery_items').doc(id).get();
    
    if (!itemDoc.exists) {
      console.log(`toggleInCart - Item with ID ${id} not found`);
      sendError(res, 'Grocery item not found', 404);
      return;
    }
    
    const itemData = itemDoc.data() as Omit<GroceryItem, 'id'>;
    console.log(`toggleInCart - Current item data:`, JSON.stringify(itemData, null, 2));
    console.log(`toggleInCart - Current inCart value: ${itemData.inCart}`);
    
    // Toggle the inCart flag
    const inCart = !itemData.inCart;
    console.log(`toggleInCart - New inCart value: ${inCart}`);
    
    const updateData = {
      inCart,
      lastUpdated: Timestamp.now(),
      updatedBy: req.user?.uid,
    };
    
    console.log(`toggleInCart - Updating item with data:`, JSON.stringify(updateData, null, 2));
    
    await db.collection('grocery_items').doc(id).update(updateData);
    
    // Verify the update
    const updatedDoc = await db.collection('grocery_items').doc(id).get();
    const updatedData = updatedDoc.data() as Omit<GroceryItem, 'id'>;
    console.log(`toggleInCart - Updated item data:`, JSON.stringify(updatedData, null, 2));
    console.log(`toggleInCart - Verified inCart value after update: ${updatedData.inCart}`);
    
    sendSuccess(res, { id, inCart }, 'Grocery item updated successfully');
  } catch (error) {
    console.error('Error toggling inCart:', error);
    sendError(res, 'Failed to update grocery item');
  }
};

/**
 * Reset all inCart flags to false
 */
export const resetCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = db.batch();
    
    // Get all items that are in the cart
    const itemsSnapshot = await db
      .collection('grocery_items')
      .where('inCart', '==', true)
      .get();
    
    if (itemsSnapshot.empty) {
      sendSuccess(res, null, 'No items in cart to reset');
      return;
    }
    
    // Update each item in a batch
    itemsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        inCart: false,
        lastUpdated: Timestamp.now(),
        updatedBy: req.user?.uid,
      });
    });
    
    // Commit the batch
    await batch.commit();
    
    sendSuccess(
      res,
      { count: itemsSnapshot.size },
      `Reset ${itemsSnapshot.size} items in cart`
    );
  } catch (error) {
    console.error('Error resetting cart:', error);
    sendError(res, 'Failed to reset cart');
  }
};
