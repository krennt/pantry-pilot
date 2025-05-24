const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function diagnoseMeals() {
  try {
    console.log('🔍 Diagnosing meals in Firestore...\n');
    
    // Get all meals
    const mealsSnapshot = await db.collection('meals').get();
    
    console.log(`📊 Total meals found: ${mealsSnapshot.size}\n`);
    
    if (mealsSnapshot.empty) {
      console.log('❌ No meals found in the database');
      return;
    }
    
    console.log('📋 Meal details:');
    console.log('================');
    
    mealsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Meal ID: ${doc.id}`);
      console.log(`   Name: ${data.name || 'No name'}`);
      console.log(`   Description: ${data.description || 'No description'}`);
      console.log(`   Servings: ${data.servings || 'Not specified'}`);
      console.log(`   UserId: ${data.userId || 'No userId field'}`);
      console.log(`   PrepTime: ${data.prepTime || 'Not specified'}`);
      console.log(`   CookTime: ${data.cookTime || 'Not specified'}`);
      console.log(`   ImageUrl: ${data.imageUrl || 'No image'}`);
      console.log(`   All fields: ${Object.keys(data).join(', ')}`);
      console.log('   ---');
    });
    
    // Check for Spaghetti Bolognese specifically
    const spaghettiMeals = mealsSnapshot.docs.filter(doc => 
      doc.data().name && doc.data().name.toLowerCase().includes('spaghetti')
    );
    
    if (spaghettiMeals.length > 0) {
      console.log('\n🍝 Found Spaghetti meals:');
      spaghettiMeals.forEach(doc => {
        console.log(`   - ${doc.data().name} (ID: ${doc.id})`);
      });
    } else {
      console.log('\n❌ No Spaghetti meals found');
    }
    
    // Check if any meals have userId fields
    const mealsWithUserId = mealsSnapshot.docs.filter(doc => doc.data().userId);
    const mealsWithoutUserId = mealsSnapshot.docs.filter(doc => !doc.data().userId);
    
    console.log(`\n👤 Meals with userId: ${mealsWithUserId.length}`);
    console.log(`👥 Meals without userId: ${mealsWithoutUserId.length}`);
    
    if (mealsWithUserId.length > 0) {
      console.log('\nUserIds found:');
      const userIds = [...new Set(mealsWithUserId.map(doc => doc.data().userId))];
      userIds.forEach(uid => {
        const count = mealsWithUserId.filter(doc => doc.data().userId === uid).length;
        console.log(`   - ${uid}: ${count} meals`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing meals:', error);
  }
}

// Run the diagnosis
diagnoseMeals().then(() => {
  console.log('\n✅ Diagnosis complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Diagnosis failed:', error);
  process.exit(1);
});
