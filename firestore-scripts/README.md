# PantryPilot Firestore Scripts

This directory contains scripts to manage Firestore collections for the PantryPilot application.

## Scripts

- `populate-firestore.js` - Populates the Firestore database with example data
- `verify-firestore.js` - Verifies that the collections were created correctly
- `backup-firestore.js` - Creates a backup of all Firestore data to a local JSON file
- `restore-firestore.js` - Restores Firestore data from a backup file
- `update-store-locations.js` - Updates grocery items with store locations based on the Bellingham Market Basket #54 shopper's guide
- `update-categories-and-locations.js` - Updates grocery items with correct categories and store locations based on the defined high-level categories

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

### Backup the database:
```bash
npm run backup
```
This will create a timestamped backup file in the project root directory (e.g., `firestore-backup-2025-05-10_15-30-00.json`).

### Restore the database:
```bash
npm run restore <path-to-backup-file>
```
For example:
```bash
npm run restore ../firestore-backup-2025-05-10_15-30-00.json
```

### Update store locations:
```bash
npm run update-locations
```
This will update all grocery items with store locations based on the Bellingham Market Basket #54 shopper's guide.

### Update categories and store locations:
```bash
npm run update-categories
```
This will update all grocery items with the correct high-level categories (Fresh Foods, Pantry Staples, Breakfast & Snacks, Beverages, Household & Personal Care) and store locations based on the item name, category, and existing store location.

## Data Structure

The scripts will create/manage the following collections:

- `users` - User accounts and profiles
- `grocery_items` - Grocery items that can be added to meals or shopping lists
- `meals` - User-created meals
  - Each meal document has a subcollection called `ingredients`

For more detailed information, see the [FIRESTORE_SETUP.md](../FIRESTORE_SETUP.md) file in the root directory.
