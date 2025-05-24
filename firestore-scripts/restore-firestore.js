const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to parse the backup data and convert special types back to Firestore types
function parseData(data) {
  if (!data) return null;
  
  const result = {};
  
  Object.keys(data).forEach(key => {
    // Skip the _subcollections key as it's handled separately
    if (key === '_subcollections') return;
    
    const value = data[key];
    
    // Handle timestamp objects
    if (value && typeof value === 'object' && value._type === 'timestamp') {
      result[key] = admin.firestore.Timestamp.fromDate(new Date(value.value));
    } 
    // Handle nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = parseData(value);
    } 
    // Handle arrays
    else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item && typeof item === 'object') {
          return parseData(item);
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

// Function to restore a collection and its subcollections
async function restoreCollection(collectionName, collectionData, batch, batchCount) {
  console.log(`Restoring ${collectionName} collection...`);
  
  for (const docId in collectionData) {
    const docData = collectionData[docId];
    const docRef = db.collection(collectionName).doc(docId);
    
    // Extract subcollections before parsing
    const subcollections = docData._subcollections;
    
    // Parse the document data
    const parsedData = parseData(docData);
    
    // Add document to batch
    batch.set(docRef, parsedData);
    batchCount++;
    
    // If batch size reaches limit, commit and create a new batch
    if (batchCount >= 500) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} operations`);
      batch = db.batch();
      batchCount = 0;
    }
    
    // Restore subcollections if they exist
    if (subcollections) {
      for (const subcollectionName in subcollections) {
        const subcollectionData = subcollections[subcollectionName];
        
        for (const subdocId in subcollectionData) {
          const subdocData = subcollectionData[subdocId];
          const subdocRef = docRef.collection(subcollectionName).doc(subdocId);
          
          // Parse the subdocument data
          const parsedSubdocData = parseData(subdocData);
          
          // Add subdocument to batch
          batch.set(subdocRef, parsedSubdocData);
          batchCount++;
          
          // If batch size reaches limit, commit and create a new batch
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`Committed batch of ${batchCount} operations`);
            batch = db.batch();
            batchCount = 0;
          }
        }
      }
    }
  }
  
  return { batch, batchCount };
}

// Function to prompt user for confirmation
function promptForConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${message} (y/n): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function to restore the database
async function restoreDatabase(backupFilePath) {
  try {
    // Resolve the backup file path
    const resolvedPath = path.resolve(backupFilePath);
    
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Backup file not found: ${resolvedPath}`);
      process.exit(1);
    }
    
    console.log(`Reading backup file: ${resolvedPath}`);
    const backupData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    
    // Confirm before proceeding
    const confirmed = await promptForConfirmation(
      'WARNING: This will overwrite existing data in your Firestore database. Are you sure you want to proceed?'
    );
    
    if (!confirmed) {
      console.log('Restore cancelled.');
      process.exit(0);
    }
    
    console.log('Starting Firestore restore...');
    
    let batch = db.batch();
    let batchCount = 0;
    
    // Restore each collection
    for (const collectionName in backupData) {
      const result = await restoreCollection(
        collectionName, 
        backupData[collectionName], 
        batch, 
        batchCount
      );
      
      batch = result.batch;
      batchCount = result.batchCount;
    }
    
    // Commit any remaining operations
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} operations`);
    }
    
    console.log('\nRestore completed successfully!');
  } catch (error) {
    console.error('Error restoring database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Check if a backup file path was provided
const backupFilePath = process.argv[2];

if (!backupFilePath) {
  console.error('Please provide a path to the backup file:');
  console.error('  node restore-firestore.js <path-to-backup-file>');
  process.exit(1);
}

// Run the restore
restoreDatabase(backupFilePath);
