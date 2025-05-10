#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 Welcome to PantryPilot Setup! 🚀\n');
console.log('This script will help you set up your PantryPilot project.\n');

// Function to execute commands
function executeCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Function to check if Firebase CLI is installed
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to create .env file
function createEnvFile(config) {
  const envContent = `# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=${config.apiKey || 'your-api-key'}
REACT_APP_FIREBASE_AUTH_DOMAIN=${config.authDomain || 'your-project-id.firebaseapp.com'}
REACT_APP_FIREBASE_PROJECT_ID=${config.projectId || 'your-project-id'}
REACT_APP_FIREBASE_STORAGE_BUCKET=${config.storageBucket || 'your-project-id.appspot.com'}
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId || 'your-messaging-sender-id'}
REACT_APP_FIREBASE_APP_ID=${config.appId || 'your-app-id'}
REACT_APP_FIREBASE_MEASUREMENT_ID=${config.measurementId || 'your-measurement-id'}
`;

  fs.writeFileSync(path.join(__dirname, 'web', '.env'), envContent);
  console.log('Created .env file in web directory');
}

// Main setup function
async function setup() {
  // Check if Firebase CLI is installed
  if (!checkFirebaseCLI()) {
    console.log('Firebase CLI is not installed. Installing...');
    if (!executeCommand('npm install -g firebase-tools')) {
      console.error('Failed to install Firebase CLI. Please install it manually with: npm install -g firebase-tools');
      process.exit(1);
    }
  }

  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  executeCommand('npm run install:all');

  // Firebase login and setup
  console.log('\n🔥 Setting up Firebase...');
  console.log('You will need to log in to your Firebase account.');
  
  // Ask if the user wants to login to Firebase
  rl.question('Do you want to log in to Firebase now? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      executeCommand('firebase login');
      
      // Initialize Firebase
      console.log('\n🔧 Initializing Firebase project...');
      console.log('This will set up Firebase in your project.');
      console.log('When prompted, select:');
      console.log('- Firestore');
      console.log('- Functions');
      console.log('- Hosting');
      console.log('- Storage');
      
      executeCommand('firebase init');
      
      // Ask for Firebase config
      console.log('\n⚙️ Setting up Firebase configuration...');
      console.log('You can find your Firebase configuration in the Firebase console:');
      console.log('1. Go to your Firebase project');
      console.log('2. Click on the web app icon (</>) or add a new web app');
      console.log('3. Register your app if needed');
      console.log('4. Copy the configuration values from the firebaseConfig object');
      
      const config = {};
      
      rl.question('\nDo you want to enter your Firebase configuration now? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          rl.question('API Key: ', (apiKey) => {
            config.apiKey = apiKey;
            
            rl.question('Auth Domain: ', (authDomain) => {
              config.authDomain = authDomain;
              
              rl.question('Project ID: ', (projectId) => {
                config.projectId = projectId;
                
                rl.question('Storage Bucket: ', (storageBucket) => {
                  config.storageBucket = storageBucket;
                  
                  rl.question('Messaging Sender ID: ', (messagingSenderId) => {
                    config.messagingSenderId = messagingSenderId;
                    
                    rl.question('App ID: ', (appId) => {
                      config.appId = appId;
                      
                      rl.question('Measurement ID (optional): ', (measurementId) => {
                        config.measurementId = measurementId;
                        
                        // Create .env file
                        createEnvFile(config);
                        
                        console.log('\n✅ Setup complete!');
                        console.log('\nYou can now start the application with:');
                        console.log('npm start');
                        
                        rl.close();
                      });
                    });
                  });
                });
              });
            });
          });
        } else {
          console.log('\nSkipping Firebase configuration. You will need to manually create a .env file in the web directory.');
          console.log('You can copy the .env.example file and fill in your Firebase configuration values.');
          
          console.log('\n✅ Setup complete!');
          console.log('\nYou can now start the application with:');
          console.log('npm start');
          
          rl.close();
        }
      });
    } else {
      console.log('\nSkipping Firebase login. You will need to manually log in with:');
      console.log('firebase login');
      
      console.log('\n✅ Setup complete!');
      console.log('\nYou can now start the application with:');
      console.log('npm start');
      
      rl.close();
    }
  });
}

// Run setup
setup();
