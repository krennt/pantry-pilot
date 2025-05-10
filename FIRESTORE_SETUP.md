# Firestore Database Setup for PantryPilot

This document provides instructions on how to populate your Firestore database with example data for the PantryPilot application.

## Collections Structure

The PantryPilot app uses the following Firestore collections:

1. **users** - User accounts and profiles
2. **grocery_items** - Grocery items that can be added to meals or shopping lists
3. **meals** - User-created meals
   - Each meal document has a subcollection called **ingredients**

## Setup Instructions

### 1. Generate a Firebase Service Account Key

To run the populate script, you'll need a service account key:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file as `serviceAccountKey.json` in the `firestore-scripts` directory

### 2. Install Dependencies

Make sure you have Node.js installed, then navigate to the scripts directory and install dependencies:

```bash
cd firestore-scripts
npm install
```

### 3. Run the Population Script

Execute the script to populate your Firestore database:

```bash
npm run populate
```

### 4. Verify the Data

After populating the database, you can verify that the collections were created correctly:

```bash
npm run verify
```

This will check all collections and display the number of documents in each collection.

## Example Data

The script will create:

### Users
- 3 example users with different emails and display names

### Grocery Items
- 20 grocery items across 8 categories:
  - Produce (Apples, Bananas, Carrots, Spinach)
  - Dairy (Milk, Eggs, Cheddar Cheese)
  - Meat (Chicken Breast, Ground Beef)
  - Bakery (Bread)
  - Pantry (Rice, Pasta, Tomato Sauce, Olive Oil)
  - Frozen (Frozen Pizza, Ice Cream)
  - Beverages (Orange Juice, Coffee)
  - Snacks (Potato Chips, Chocolate)

### Meals
- 7 example meals distributed among the users:
  - Spaghetti Bolognese (4 ingredients)
  - Chicken Stir Fry (4 ingredients)
  - Breakfast Sandwich (3 ingredients)
  - Vegetable Salad (3 ingredients)
  - Fruit Smoothie (2 ingredients)
  - Beef Tacos (3 ingredients)
  - Pizza Night (1 ingredient)

## Data Relationships

- Each meal is associated with a specific user via the `userId` field
- Each meal ingredient references a grocery item via the `itemId` field
- Some grocery items have the `needToBuy` flag set to true to populate the shopping list
- Some grocery items have the `inCart` flag set to true to show items in the cart

## Customization

You can modify the `populate-firestore.js` script to add, remove, or change the example data as needed for your testing or development purposes.
