const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to format Firestore timestamps to ISO strings
function formatData(data) {
  if (!data) return null;
  
  const result = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Handle Firestore Timestamps
    if (value && typeof value === 'object' && value.constructor.name === 'Timestamp') {
      result[key] = {
        _type: 'timestamp',
        value: value.toDate().toISOString()
      };
    } 
    // Handle nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = formatData(value);
    } 
    // Handle arrays
    else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item && typeof item === 'object') {
          return formatData(item);
        }
        return item;
      });
    } 
    // Handle primitive values
    else {
      result[key] = value;
    }
  });
  
  return result;
}

// Function to backup a collection and its subcollections
async function backupCollection(collectionName, backupData = {}) {
  console.log(`Backing up ${collectionName} collection...`);
  
  const snapshot = await db.collection(collectionName).get();
  
  if (snapshot.empty) {
    console.log(`No documents found in ${collectionName}`);
    return backupData;
  }
  
  backupData[collectionName] = {};
  
  for (const doc of snapshot.docs) {
    const docData = doc.data();
    const docId = doc.id;
    
    // Format the document data
    backupData[collectionName][docId] = formatData(docData);
    
    // Get subcollections for this document
    const subcollections = await doc.ref.listCollections();
    
    if (subcollections.length > 0) {
      backupData[collectionName][docId]._subcollections = {};
      
      for (const subcollection of subcollections) {
        const subcollectionName = subcollection.id;
        const subcollectionPath = `${collectionName}/${docId}/${subcollectionName}`;
        
        console.log(`Backing up subcollection: ${subcollectionPath}`);
        
        const subcollectionSnapshot = await subcollection.get();
        
        if (!subcollectionSnapshot.empty) {
          backupData[collectionName][docId]._subcollections[subcollectionName] = {};
          
          subcollectionSnapshot.forEach(subdoc => {
            const subdocId = subdoc.id;
            const subdocData = subdoc.data();
            
            backupData[collectionName][docId]._subcollections[subcollectionName][subdocId] = formatData(subdocData);
          });
        }
      }
    }
  }
  
  console.log(`Backed up ${Object.keys(backupData[collectionName]).length} documents from ${collectionName}`);
  return backupData;
}

// Main function to backup the database
async function backupDatabase() {
  try {
    console.log('Starting Firestore backup...');
    
    let backupData = {};
    
    // Backup users collection
    backupData = await backupCollection('users', backupData);
    
    // Backup grocery_items collection
    backupData = await backupCollection('grocery_items', backupData);
    
    // Backup meals collection (including ingredients subcollection)
    backupData = await backupCollection('meals', backupData);
    
    // Generate timestamp for filename
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    const filename = `firestore-backup-${timestamp}.json`;
    const filepath = path.join(__dirname, '..', filename);
    
    // Write backup data to file
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    console.log(`\nBackup completed successfully!`);
    console.log(`Backup saved to: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('Error backing up database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the backup
backupDatabase();
