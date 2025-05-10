# PantryPilot Firestore Scripts

This directory contains scripts to populate and verify Firestore collections for the PantryPilot application.

## Scripts

- `populate-firestore.js` - Populates the Firestore database with example data
- `verify-firestore.js` - Verifies that the collections were created correctly

## Setup

1. Create a `serviceAccountKey.json` file in this directory with your Firebase service account credentials
   - You can use `serviceAccountKey.example.json` as a template
   - Get your service account key from the Firebase Console > Project Settings > Service Accounts

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Populate the database:
```bash
npm run populate
```

### Verify the database:
```bash
npm run verify
```

## Data Structure

The scripts will create the following collections:

- `users` - User accounts and profiles
- `grocery_items` - Grocery items that can be added to meals or shopping lists
- `meals` - User-created meals
  - Each meal document has a subcollection called `ingredients`

For more detailed information, see the [FIRESTORE_SETUP.md](../FIRESTORE_SETUP.md) file in the root directory.
