const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const timestamp = admin.firestore.Timestamp;

// Function to clear existing collections
async function clearCollections() {
  console.log('Clearing existing collections...');
  
  // Clear users collection
  const usersSnapshot = await db.collection('users').get();
  const userDeletions = usersSnapshot.docs.map(doc => doc.ref.delete());
  
  // Clear grocery_items collection
  const itemsSnapshot = await db.collection('grocery_items').get();
  const itemDeletions = itemsSnapshot.docs.map(doc => doc.ref.delete());
  
  // Clear meals collection (including subcollections)
  const mealsSnapshot = await db.collection('meals').get();
  const mealDeletions = [];
  
  for (const mealDoc of mealsSnapshot.docs) {
    const ingredientsSnapshot = await mealDoc.ref.collection('ingredients').get();
    const ingredientDeletions = ingredientsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(ingredientDeletions);
    mealDeletions.push(mealDoc.ref.delete());
  }
  
  await Promise.all([...userDeletions, ...itemDeletions, ...mealDeletions]);
  console.log('Collections cleared successfully');
}

// Create example users
async function createUsers() {
  console.log('Creating users...');
  
  const users = [
    {
      uid: 'user1',
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      createdAt: timestamp.now()
    },
    {
      uid: 'user2',
      email: 'jane.smith@example.com',
      displayName: 'Jane Smith',
      createdAt: timestamp.now()
    },
    {
      uid: 'user3',
      email: 'alex.wilson@example.com',
      displayName: 'Alex Wilson',
      createdAt: timestamp.now()
    }
  ];
  
  const userPromises = users.map(user => 
    db.collection('users').doc(user.uid).set(user)
  );
  
  await Promise.all(userPromises);
  console.log(`Created ${users.length} users`);
  
  return users;
}

// Create example grocery items
async function createGroceryItems() {
  console.log('Creating grocery items...');
  
  const categories = [
    'Produce',
    'Dairy',
    'Meat',
    'Bakery',
    'Pantry',
    'Frozen',
    'Beverages',
    'Snacks'
  ];
  
  const groceryItems = [
    {
      name: 'Apples',
      category: 'Produce',
      defaultUnit: 'lb',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fapples.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Bananas',
      category: 'Produce',
      defaultUnit: 'bunch',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fbananas.jpg',
      needToBuy: true,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Carrots',
      category: 'Produce',
      defaultUnit: 'lb',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fcarrots.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Spinach',
      category: 'Produce',
      defaultUnit: 'oz',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fspinach.jpg',
      needToBuy: true,
      inCart: true,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Milk',
      category: 'Dairy',
      defaultUnit: 'gallon',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fmilk.jpg',
      needToBuy: true,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Eggs',
      category: 'Dairy',
      defaultUnit: 'dozen',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Feggs.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Cheddar Cheese',
      category: 'Dairy',
      defaultUnit: 'oz',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fcheddar.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Chicken Breast',
      category: 'Meat',
      defaultUnit: 'lb',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fchicken_breast.jpg',
      needToBuy: true,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Ground Beef',
      category: 'Meat',
      defaultUnit: 'lb',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fground_beef.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Bread',
      category: 'Bakery',
      defaultUnit: 'loaf',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fbread.jpg',
      needToBuy: true,
      inCart: true,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Rice',
      category: 'Pantry',
      defaultUnit: 'lb',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Frice.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Pasta',
      category: 'Pantry',
      defaultUnit: 'box',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fpasta.jpg',
      needToBuy: true,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Tomato Sauce',
      category: 'Pantry',
      defaultUnit: 'can',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Ftomato_sauce.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Olive Oil',
      category: 'Pantry',
      defaultUnit: 'bottle',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Folive_oil.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Frozen Pizza',
      category: 'Frozen',
      defaultUnit: 'box',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Ffrozen_pizza.jpg',
      needToBuy: true,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Ice Cream',
      category: 'Frozen',
      defaultUnit: 'pint',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fice_cream.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Orange Juice',
      category: 'Beverages',
      defaultUnit: 'bottle',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Forange_juice.jpg',
      needToBuy: true,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Coffee',
      category: 'Beverages',
      defaultUnit: 'bag',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fcoffee.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Potato Chips',
      category: 'Snacks',
      defaultUnit: 'bag',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fpotato_chips.jpg',
      needToBuy: false,
      inCart: false,
      lastUpdated: timestamp.now()
    },
    {
      name: 'Chocolate',
      category: 'Snacks',
      defaultUnit: 'bar',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/items%2Fchocolate.jpg',
      needToBuy: true,
      inCart: true,
      lastUpdated: timestamp.now()
    }
  ];
  
  const itemPromises = [];
  const itemIds = {};
  
  for (const item of groceryItems) {
    const docRef = db.collection('grocery_items').doc();
    itemPromises.push(docRef.set(item));
    itemIds[item.name] = docRef.id;
  }
  
  await Promise.all(itemPromises);
  console.log(`Created ${groceryItems.length} grocery items`);
  
  return itemIds;
}

// Create example meals and their ingredients
async function createMeals(users, itemIds) {
  console.log('Creating meals and ingredients...');
  
  const meals = [
    {
      userId: users[0].uid,
      name: 'Spaghetti Bolognese',
      description: 'Classic Italian pasta dish with a rich meat sauce',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/meals%2Fspaghetti_bolognese.jpg',
      servings: 4,
      prepTime: 15,
      cookTime: 30,
      createdAt: timestamp.now(),
      ingredients: [
        { itemId: itemIds['Pasta'], quantity: 1, unit: 'box' },
        { itemId: itemIds['Ground Beef'], quantity: 1, unit: 'lb' },
        { itemId: itemIds['Tomato Sauce'], quantity: 2, unit: 'can' },
        { itemId: itemIds['Olive Oil'], quantity: 2, unit: 'tbsp' }
      ]
    },
    {
      userId: users[0].uid,
      name: 'Chicken Stir Fry',
      description: 'Quick and healthy stir fry with fresh vegetables',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/meals%2Fchicken_stir_fry.jpg',
      servings: 2,
      prepTime: 20,
      cookTime: 15,
      createdAt: timestamp.now(),
      ingredients: [
        { itemId: itemIds['Chicken Breast'], quantity: 1, unit: 'lb' },
        { itemId: itemIds['Rice'], quantity: 1, unit: 'cup' },
        { itemId: itemIds['Carrots'], quantity: 2, unit: 'cup' },
        { itemId: itemIds['Olive Oil'], quantity: 1, unit: 'tbsp' }
      ]
    },
    {
      userId: users[0].uid,
      name: 'Breakfast Sandwich',
      description: 'Quick and easy breakfast sandwich',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/meals%2Fbreakfast_sandwich.jpg',
      servings: 1,
      prepTime: 5,
      cookTime: 10,
      createdAt: timestamp.now(),
      ingredients: [
        { itemId: itemIds['Bread'], quantity: 2, unit: 'slice' },
        { itemId: itemIds['Eggs'], quantity: 1, unit: 'unit' },
        { itemId: itemIds['Cheddar Cheese'], quantity: 1, unit: 'slice' }
      ]
    },
    {
      userId: users[1].uid,
      name: 'Vegetable Salad',
      description: 'Fresh and healthy vegetable salad',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/meals%2Fvegetable_salad.jpg',
      servings: 2,
      prepTime: 15,
      cookTime: 0,
      createdAt: timestamp.now(),
      ingredients: [
        { itemId: itemIds['Spinach'], quantity: 4, unit: 'cup' },
        { itemId: itemIds['Carrots'], quantity: 1, unit: 'cup' },
        { itemId: itemIds['Olive Oil'], quantity: 2, unit: 'tbsp' }
      ]
    },
    {
      userId: users[1].uid,
      name: 'Fruit Smoothie',
      description: 'Refreshing fruit smoothie for breakfast',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/meals%2Ffruit_smoothie.jpg',
      servings: 1,
      prepTime: 5,
      cookTime: 0,
      createdAt: timestamp.now(),
      ingredients: [
        { itemId: itemIds['Bananas'], quantity: 1, unit: 'unit' },
        { itemId: itemIds['Milk'], quantity: 1, unit: 'cup' }
      ]
    },
    {
      userId: users[2].uid,
      name: 'Beef Tacos',
      description: 'Delicious beef tacos with fresh toppings',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/meals%2Fbeef_tacos.jpg',
      servings: 4,
      prepTime: 20,
      cookTime: 15,
      createdAt: timestamp.now(),
      ingredients: [
        { itemId: itemIds['Ground Beef'], quantity: 1, unit: 'lb' },
        { itemId: itemIds['Cheddar Cheese'], quantity: 8, unit: 'oz' },
        { itemId: itemIds['Tomato Sauce'], quantity: 1, unit: 'can' }
      ]
    },
    {
      userId: users[2].uid,
      name: 'Pizza Night',
      description: 'Easy frozen pizza for a quick dinner',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pantrypilot-demo.appspot.com/o/meals%2Fpizza_night.jpg',
      servings: 3,
      prepTime: 0,
      cookTime: 20,
      createdAt: timestamp.now(),
      ingredients: [
        { itemId: itemIds['Frozen Pizza'], quantity: 1, unit: 'box' }
      ]
    }
  ];
  
  for (const meal of meals) {
    const ingredients = meal.ingredients;
    delete meal.ingredients;
    
    // Create meal document
    const mealRef = db.collection('meals').doc();
    await mealRef.set(meal);
    
    // Create ingredients subcollection
    const ingredientPromises = ingredients.map(ingredient => {
      ingredient.mealId = mealRef.id;
      return mealRef.collection('ingredients').doc().set(ingredient);
    });
    
    await Promise.all(ingredientPromises);
  }
  
  console.log(`Created ${meals.length} meals with ingredients`);
}

// Main function to populate the database
async function populateDatabase() {
  try {
    await clearCollections();
    const users = await createUsers();
    const itemIds = await createGroceryItems();
    await createMeals(users, itemIds);
    
    console.log('Database populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
}

// Run the script
populateDatabase();
