/**
 * Script to update existing grocery items with store locations
 * based on the Bellingham Market Basket #54 shopper's guide.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check if service account key exists
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found.');
  console.error('Please create a service account key file in the firestore-scripts directory.');
  console.error('See README.md for instructions.');
  process.exit(1);
}

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Store location map based on the Bellingham Market Basket #54 shopper's guide
const storeLocationMap = {
  // Aisle 1
  "Bread Crumbs": "1",
  "Cottage Cheese": "1",
  "Shake & Bake": "1",
  "Soy Sauce": "1",
  
  // Aisle 2
  "Barbecue Sauce": "2",
  "Beans: Baked": "2",
  "Canning Supplies": "2",
  "Cherries: Jar": "2",
  "Chili Sauce": "2",
  "Clams: Canned/Minced/Juice": "2",
  "Croutons": "2",
  "Escargot": "2",
  "Fish: Canned": "2",
  "Ham Glaze": "2",
  "Ketchup": "2",
  "Meat: Canned": "2",
  "Mexican Food": "2",
  "Mustard": "2",
  "Olives": "2",
  "Salad Dressing": "2",
  "Sardines: Canned": "2",
  "Sauce: BBQ/Chili/Steak": "2",
  "Sauce: Tabasco/Tartar": "2",
  "Spam": "2",
  "Taco: Sauce/Shells": "2",
  "Tuna: Canned": "2",
  
  // Aisle 3
  "Cereal": "3",
  "Granola Bars": "3",
  "Grits": "3",
  "Pop Tarts": "3",
  "Rice Cakes": "3",
  
  // Aisle 4
  "Cheese: Grated Parmesan": "4",
  "Hamburger Helper": "4",
  "Mac & Cheese: Packaged": "4",
  "Pasta": "4",
  "Rice: Packaged": "4",
  "Spaghetti Sauce": "4",
  "Tomato: Canned": "4",
  "Tomato: Paste": "4",
  "Tomato: Sauce": "4",
  
  // Aisle 5
  "Baking Needs": "5",
  "Cake Mix": "5",
  "Flour": "5",
  "Food Coloring": "5",
  "Jello": "5",
  "Milk: Evaporated/Powdered": "5",
  "Nuts: Baking": "5",
  "Pie Filling": "5",
  "Pudding Mix": "5",
  "Salt": "5",
  "Spices": "5",
  "Sugar": "5",
  "Tea Bags": "5",
  
  // Aisle 6
  "Beans: Dry": "6",
  "Bouillon Cubes": "6",
  "Butter Buds": "6",
  "Juice": "6",
  "Mushrooms: Canned": "6",
  "Potato: Canned/Instant": "6",
  "Vegetables: Canned": "6",
  
  // Aisle 7
  "Iced Tea Mix": "7",
  "Kool Aid": "7",
  
  // Aisle 8
  "Nuts: Snack Nuts": "8",
  "Popping Corn": "8",
  "Potato Chips": "8",
  
  // Aisle 9
  "Applesauce": "9",
  "Bisquick": "9",
  "Candy": "9",
  "Chinese Food: Canned": "9",
  "Chowder: Clam/Corn/Potato": "9",
  "Cranberry Sauce": "9",
  "Fruit: Canned": "9",
  "Honey": "9",
  "Jam & Jelly": "9",
  "Kosher Foods": "9",
  "Molasses": "9",
  "Pancake Mix": "9",
  "Peanut Butter": "9",
  "Soup": "9",
  
  // Aisle 10
  "Baby Food": "10",
  "Baby Powder": "10",
  "Batteries": "10",
  "Cold Remedies": "10",
  "Deodorant": "10",
  "Diapers": "10",
  "Electrical Supplies": "10",
  "Eye Care": "10",
  "Feminine Needs": "10",
  "Laxative": "10",
  "Lightbulbs": "10",
  "Mouthwash": "10",
  "Rubbing Alcohol": "10",
  "Sanitary Napkins": "10",
  "Shaving Needs": "10",
  "Shoe Care": "10",
  "Soap: Bar/Body/Hand/Liquid": "10",
  "Toothbrushes/Toothpaste": "10",
  
  // Aisle 11
  "Facial Tissue": "11",
  "Kitchen Gadgets": "11",
  "Napkins": "11",
  "Paper: Cups/Plates": "11",
  "Paper: Towels": "11",
  "Plasticware": "11",
  "Stationery": "11",
  "Straws": "11",
  "Tissue: Bath": "11",
  "Tissue: Facial": "11",
  "Toothpicks": "11",
  
  // Aisle 12
  "Air Freshener": "12",
  "Ammonia": "12",
  "Bleach": "12",
  "Detergent: Dish/Dishwasher": "12",
  "Detergent: Laundry": "12",
  "Disinfectant Spray": "12",
  "Drain Cleaner": "12",
  "Dye: Fabric": "12",
  "Dye: Household": "12",
  "Fabric Softener": "12",
  "Gloves-Work": "12",
  "Household Cleaners": "12",
  "Laundry Detergent": "12",
  "Mops": "12",
  "Sponges": "12",
  "Steel Wool": "12",
  
  // Aisle 13
  "Aluminum Foil": "13",
  "Automotive": "13",
  "Bags: Lunch/Sandwich": "13",
  "Bags: Garbage/Trash": "13",
  "Bakeware": "13",
  "Bug Spray": "13",
  "Charcoal": "13",
  "Cat Food/Cat Litter/Cat Needs": "13",
  "Dog Food/Dog Needs": "13",
  "Freezer Wrap": "13",
  "Oil: Motor": "13",
  "Rubbermaid": "13",
  "Vinegar": "13",
  "Vitamins": "13",
  "Water: Distilled/Spring": "13",
  "Wax Paper": "13",
  "Wheat Germ": "13",
  "Windshield Washer Fluid": "13",
  
  // Aisle 14
  "Soda": "14",
  
  // Aisle 15
  "Bags: Packaged": "15",
  "Bread": "15",
  "Cookies": "15",
  "Crackers": "15",
  
  // Aisle 16
  "Dried Fruit: Currants/Dates": "16",
  "Dried Fruit: Prunes/Raisins": "16",
  "Frozen Foods": "16",
  "Raisins": "16",
  
  // Aisle 17
  "Ice Cream Cones": "17",
  
  // Special Departments
  "Bakery: Fresh": "Bakery (Front Corner)",
  "Bakery: Specialty": "Cheese Case",
  "Butter": "1",
  "Candles: Birthday": "Bakery Case",
  "Cheese: Fresh": "Deli/Fish Dept",
  "Eggs": "1",
  "Figs: Dry": "Produce Dept",
  "Ice Cream": "Freezer Wall",
  "Ice Cubes": "End of Aisle 15",
  "Magazines": "Registers",
  "Meat: Fresh": "Meat Dept",
  "Milk: Fluid": "1",
  "Peanuts in shell": "Produce Dept",
  "Potatoes: Fresh": "Produce Dept",
  "Produce: Fresh": "Produce Dept",
  "Razor Blades": "Checkout",
  "Vegetables: Fresh": "Produce Dept"
};

/**
 * Get the store location for a grocery item based on its name or category
 * @param {string} itemName The name of the grocery item
 * @param {string} category The category of the grocery item
 * @returns {string|undefined} The store location (aisle number or department) or undefined if not found
 */
const getStoreLocation = (itemName, category) => {
  // First try to match by exact item name
  if (storeLocationMap[itemName]) {
    return storeLocationMap[itemName];
  }
  
  // Then try to match by category
  if (storeLocationMap[category]) {
    return storeLocationMap[category];
  }
  
  // Try to match by partial item name (checking if the item name contains any of the keys)
  for (const [key, location] of Object.entries(storeLocationMap)) {
    if (
      itemName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(itemName.toLowerCase())
    ) {
      return location;
    }
  }
  
  // Try to match by partial category (checking if the category contains any of the keys)
  for (const [key, location] of Object.entries(storeLocationMap)) {
    if (
      category.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(category.toLowerCase())
    ) {
      return location;
    }
  }
  
  // If no match is found, return undefined
  return undefined;
};

/**
 * Update all grocery items with store locations
 */
const updateGroceryItems = async () => {
  try {
    console.log('Fetching grocery items...');
    
    // Get all grocery items
    const snapshot = await db.collection('grocery_items').get();
    
    if (snapshot.empty) {
      console.log('No grocery items found.');
      return;
    }
    
    console.log(`Found ${snapshot.size} grocery items.`);
    
    // Create a batch to update all items
    let batch = db.batch();
    let batchCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    
    // Process each item
    for (const doc of snapshot.docs) {
      const item = doc.data();
      
      // Skip items that already have a store location
      if (item.storeLocation) {
        unchangedCount++;
        continue;
      }
      
      // Get the store location for the item
      const storeLocation = getStoreLocation(item.name, item.category);
      
      if (storeLocation) {
        // Update the item with the store location
        batch.update(doc.ref, { storeLocation });
        updatedCount++;
        batchCount++;
        
        // Commit the batch every 500 updates (Firestore limit)
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates.`);
          batch = db.batch();
          batchCount = 0;
        }
      } else {
        unchangedCount++;
      }
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} updates.`);
    }
    
    console.log(`Updated ${updatedCount} grocery items with store locations.`);
    console.log(`${unchangedCount} grocery items were unchanged.`);
    
  } catch (error) {
    console.error('Error updating grocery items:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
};

// Run the update function
updateGroceryItems();
