const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();
const timestamp = admin.firestore.Timestamp;

// Test user details
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  displayName: 'Test User'
};

// Create a test user in Firebase Authentication and Firestore
async function createTestUser() {
  try {
    console.log(`Creating test user with email: ${testUser.email}`);
    
    // Check if user already exists
    try {
      const userRecord = await auth.getUserByEmail(testUser.email);
      console.log(`User already exists with UID: ${userRecord.uid}`);
      
      // Update user if needed
      await auth.updateUser(userRecord.uid, {
        displayName: testUser.displayName
      });
      
      return userRecord;
    } catch (error) {
      // User doesn't exist, create a new one
      if (error.code === 'auth/user-not-found') {
        const userRecord = await auth.createUser({
          email: testUser.email,
          password: testUser.password,
          displayName: testUser.displayName
        });
        
        console.log(`Created new user with UID: ${userRecord.uid}`);
        
        // Create user document in Firestore
        const userData = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          createdAt: timestamp.now()
        };
        
        await db.collection('users').doc(userRecord.uid).set(userData);
        console.log(`Created Firestore document for user: ${userRecord.uid}`);
        
        return userRecord;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

// Run the script
createTestUser()
  .then(userRecord => {
    console.log(`Test user created successfully. Email: ${testUser.email}, Password: ${testUser.password}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
