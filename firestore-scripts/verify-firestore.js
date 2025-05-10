const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to verify collections
async function verifyCollections() {
  console.log('Verifying Firestore collections...\n');
  
  try {
    // Verify users collection
    const usersSnapshot = await db.collection('users').get();
    console.log(`Users collection: ${usersSnapshot.empty ? 'Empty' : usersSnapshot.size + ' documents'}`);
    
    // Verify grocery_items collection
    const itemsSnapshot = await db.collection('grocery_items').get();
    console.log(`Grocery items collection: ${itemsSnapshot.empty ? 'Empty' : itemsSnapshot.size + ' documents'}`);
    
    // Verify meals collection
    const mealsSnapshot = await db.collection('meals').get();
    console.log(`Meals collection: ${mealsSnapshot.empty ? 'Empty' : mealsSnapshot.size + ' documents'}`);
    
    // Verify meal ingredients subcollections
    if (!mealsSnapshot.empty) {
      let totalIngredients = 0;
      
      for (const mealDoc of mealsSnapshot.docs) {
        const ingredientsSnapshot = await mealDoc.ref.collection('ingredients').get();
        totalIngredients += ingredientsSnapshot.size;
      }
      
      console.log(`Meal ingredients: ${totalIngredients} documents across all meals`);
    }
    
    // Verify shopping list items
    const shoppingListSnapshot = await db
      .collection('grocery_items')
      .where('needToBuy', '==', true)
      .get();
    
    console.log(`Shopping list items: ${shoppingListSnapshot.empty ? 'Empty' : shoppingListSnapshot.size + ' documents'}`);
    
    // Verify cart items
    const cartSnapshot = await db
      .collection('grocery_items')
      .where('inCart', '==', true)
      .get();
    
    console.log(`Cart items: ${cartSnapshot.empty ? 'Empty' : cartSnapshot.size + ' documents'}`);
    
    console.log('\nVerification complete!');
    
    if (usersSnapshot.size > 0 && itemsSnapshot.size > 0 && mealsSnapshot.size > 0) {
      console.log('\n✅ Firestore collections have been successfully populated!');
    } else {
      console.log('\n⚠️ Some collections appear to be empty. You may need to run the populate-firestore.js script.');
    }
  } catch (error) {
    console.error('Error verifying collections:', error);
  } finally {
    process.exit(0);
  }
}

// Run the verification
verifyCollections();
