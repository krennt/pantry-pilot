/**
 * Script to update existing grocery items with correct categories and store locations
 * based on the defined high-level categories and Bellingham Market Basket #54 shopper's guide.
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

// Define the high-level categories
const categories = {
  'fresh': 'Fresh Foods',
  'pantry': 'Pantry Staples',
  'breakfast-snacks': 'Breakfast & Snacks',
  'beverages': 'Beverages',
  'household': 'Household & Personal Care'
};

// Map aisles to high-level categories
const aisleCategoryMap = {
  // Fresh Foods
  'Produce Dept': 'fresh',
  'Meat Dept': 'fresh',
  'Deli/Fish Dept': 'fresh',
  'Bakery (Front Corner)': 'fresh',
  'Bakery Case': 'fresh',
  'Cheese Case': 'fresh',
  '1': 'fresh', // Dairy items are in aisle 1

  // Pantry Staples
  '2': 'pantry', // Canned goods, condiments
  '4': 'pantry', // Pasta, rice, sauces
  '5': 'pantry', // Baking needs, spices
  '6': 'pantry', // Canned vegetables, beans
  '9': 'pantry', // Soups, peanut butter, honey

  // Breakfast & Snacks
  '3': 'breakfast-snacks', // Cereal, granola bars
  '8': 'breakfast-snacks', // Chips, snack nuts
  '15': 'breakfast-snacks', // Bread, cookies, crackers
  '16': 'breakfast-snacks', // Dried fruits
  '17': 'breakfast-snacks', // Ice cream cones

  // Beverages
  '7': 'beverages', // Iced tea, kool aid
  '14': 'beverages', // Soda
  'Freezer Wall': 'fresh', // Ice cream

  // Household & Personal Care
  '10': 'household', // Personal care, baby items
  '11': 'household', // Paper products
  '12': 'household', // Cleaning supplies
  '13': 'household', // Foil, bags, pet food
};

// Map specific item categories to high-level categories
const itemCategoryMap = {
  // Fresh Foods
  'Produce': 'fresh',
  'Meat': 'fresh',
  'Seafood': 'fresh',
  'Bakery': 'fresh',
  'Dairy': 'fresh',
  'Deli': 'fresh',
  'Cheese': 'fresh',
  'Eggs': 'fresh',
  'Milk': 'fresh',
  'Yogurt': 'fresh',
  'Butter': 'fresh',

  // Pantry Staples
  'Canned Goods': 'pantry',
  'Pasta': 'pantry',
  'Rice': 'pantry',
  'Beans': 'pantry',
  'Baking': 'pantry',
  'Spices': 'pantry',
  'Condiments': 'pantry',
  'Sauces': 'pantry',
  'Oil': 'pantry',
  'Vinegar': 'pantry',
  'Soup': 'pantry',
  'Canned Vegetables': 'pantry',
  'Canned Fruit': 'pantry',
  'Canned Fish': 'pantry',
  'Canned Meat': 'pantry',

  // Breakfast & Snacks
  'Cereal': 'breakfast-snacks',
  'Breakfast': 'breakfast-snacks',
  'Snacks': 'breakfast-snacks',
  'Chips': 'breakfast-snacks',
  'Crackers': 'breakfast-snacks',
  'Cookies': 'breakfast-snacks',
  'Bread': 'breakfast-snacks',
  'Granola': 'breakfast-snacks',
  'Nuts': 'breakfast-snacks',
  'Dried Fruit': 'breakfast-snacks',
  'Candy': 'breakfast-snacks',
  'Popcorn': 'breakfast-snacks',

  // Beverages
  'Beverages': 'beverages',
  'Soda': 'beverages',
  'Juice': 'beverages',
  'Tea': 'beverages',
  'Coffee': 'beverages',
  'Water': 'beverages',
  'Drink Mix': 'beverages',

  // Household & Personal Care
  'Household': 'household',
  'Cleaning': 'household',
  'Paper Products': 'household',
  'Personal Care': 'household',
  'Health': 'household',
  'Baby': 'household',
  'Pet': 'household',
  'Laundry': 'household',
  'Bathroom': 'household',
  'Kitchen Supplies': 'household',
};

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
 * Get the high-level category for a grocery item based on its store location or category
 * @param {string} storeLocation The store location (aisle) of the grocery item
 * @param {string} itemCategory The category of the grocery item
 * @param {string} itemName The name of the grocery item (for additional context)
 * @returns {string} The high-level category key or 'pantry' as default
 */
const getHighLevelCategory = (storeLocation, itemCategory, itemName) => {
  // First try to match by store location
  if (storeLocation && aisleCategoryMap[storeLocation]) {
    return aisleCategoryMap[storeLocation];
  }
  
  // Then try to match by item category
  if (itemCategory) {
    // Try exact match
    if (itemCategoryMap[itemCategory]) {
      return itemCategoryMap[itemCategory];
    }
    
    // Try partial match
    for (const [key, category] of Object.entries(itemCategoryMap)) {
      if (
        itemCategory.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(itemCategory.toLowerCase())
      ) {
        return category;
      }
    }
  }
  
  // Try to match by item name
  if (itemName) {
    // Check for keywords in the item name
    const lowerName = itemName.toLowerCase();
    
    // Fresh Foods keywords
    if (
      lowerName.includes('fresh') ||
      lowerName.includes('produce') ||
      lowerName.includes('meat') ||
      lowerName.includes('dairy') ||
      lowerName.includes('milk') ||
      lowerName.includes('cheese') ||
      lowerName.includes('yogurt') ||
      lowerName.includes('eggs') ||
      lowerName.includes('butter') ||
      lowerName.includes('bakery')
    ) {
      return 'fresh';
    }
    
    // Pantry Staples keywords
    if (
      lowerName.includes('canned') ||
      lowerName.includes('pasta') ||
      lowerName.includes('rice') ||
      lowerName.includes('beans') ||
      lowerName.includes('baking') ||
      lowerName.includes('spice') ||
      lowerName.includes('condiment') ||
      lowerName.includes('sauce') ||
      lowerName.includes('oil') ||
      lowerName.includes('vinegar') ||
      lowerName.includes('soup')
    ) {
      return 'pantry';
    }
    
    // Breakfast & Snacks keywords
    if (
      lowerName.includes('cereal') ||
      lowerName.includes('breakfast') ||
      lowerName.includes('snack') ||
      lowerName.includes('chips') ||
      lowerName.includes('crackers') ||
      lowerName.includes('cookies') ||
      lowerName.includes('bread') ||
      lowerName.includes('granola') ||
      lowerName.includes('nuts') ||
      lowerName.includes('dried fruit') ||
      lowerName.includes('candy') ||
      lowerName.includes('popcorn')
    ) {
      return 'breakfast-snacks';
    }
    
    // Beverages keywords
    if (
      lowerName.includes('beverage') ||
      lowerName.includes('soda') ||
      lowerName.includes('juice') ||
      lowerName.includes('tea') ||
      lowerName.includes('coffee') ||
      lowerName.includes('water') ||
      lowerName.includes('drink')
    ) {
      return 'beverages';
    }
    
    // Household & Personal Care keywords
    if (
      lowerName.includes('household') ||
      lowerName.includes('cleaning') ||
      lowerName.includes('paper') ||
      lowerName.includes('personal') ||
      lowerName.includes('health') ||
      lowerName.includes('baby') ||
      lowerName.includes('pet') ||
      lowerName.includes('laundry') ||
      lowerName.includes('bathroom') ||
      lowerName.includes('kitchen supplies')
    ) {
      return 'household';
    }
  }
  
  // Default to pantry if no match found
  return 'pantry';
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
  
  // Make a best guess based on the high-level category
  const highLevelCategory = getHighLevelCategory(undefined, category, itemName);
  
  // Assign a default store location based on the high-level category
  switch (highLevelCategory) {
    case 'fresh':
      return 'Produce Dept'; // Default for Fresh Foods
    case 'pantry':
      return '5'; // Default for Pantry Staples (Baking needs, spices)
    case 'breakfast-snacks':
      return '3'; // Default for Breakfast & Snacks (Cereal)
    case 'beverages':
      return '7'; // Default for Beverages (Iced tea, kool aid)
    case 'household':
      return '12'; // Default for Household & Personal Care (Cleaning supplies)
    default:
      return '5'; // Default to aisle 5 if no match found
  }
};

/**
 * Update all grocery items with correct categories and store locations
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
      let needsUpdate = false;
      const updates = {};
      
      // Get the high-level category for the item
      const highLevelCategoryKey = getHighLevelCategory(item.storeLocation, item.category, item.name);
      const highLevelCategory = categories[highLevelCategoryKey];
      
      // Check if the category needs to be updated
      if (item.category !== highLevelCategory) {
        updates.category = highLevelCategory;
        needsUpdate = true;
      }
      
      // Get the store location for the item
      const storeLocation = getStoreLocation(item.name, item.category);
      
      // Check if the store location needs to be updated
      if (!item.storeLocation || item.storeLocation !== storeLocation) {
        updates.storeLocation = storeLocation;
        needsUpdate = true;
      }
      
      // Update the item if needed
      if (needsUpdate) {
        // Add timestamp for the update
        updates.lastUpdated = admin.firestore.Timestamp.now();
        
        batch.update(doc.ref, updates);
        updatedCount++;
        batchCount++;
        
        console.log(`Updating item "${item.name}":`, updates);
        
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
    
    console.log(`Updated ${updatedCount} grocery items with correct categories and store locations.`);
    console.log(`${unchangedCount} grocery items were already correct.`);
    
  } catch (error) {
    console.error('Error updating grocery items:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
};

// Run the update function
updateGroceryItems();
