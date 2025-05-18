/**
 * Utility functions for mapping grocery items to high-level categories
 * and assigning colors to each category.
 */

// Define the high-level categories and their colors
export interface CategoryInfo {
  name: string;
  color: string;
  lightColor: string;
  borderColor: string;
}

export const categories: Record<string, CategoryInfo> = {
  'fresh': {
    name: 'Fresh Foods',
    color: '#4CAF50',
    lightColor: '#E8F5E9',
    borderColor: '#C8E6C9'
  },
  'pantry': {
    name: 'Pantry Staples',
    color: '#FFC107',
    lightColor: '#FFF8E1',
    borderColor: '#FFECB3'
  },
  'breakfast-snacks': {
    name: 'Breakfast & Snacks',
    color: '#FF9800',
    lightColor: '#FFF3E0',
    borderColor: '#FFE0B2'
  },
  'beverages': {
    name: 'Beverages',
    color: '#2196F3',
    lightColor: '#E3F2FD',
    borderColor: '#BBDEFB'
  },
  'household': {
    name: 'Household & Personal Care',
    color: '#9C27B0',
    lightColor: '#F3E5F5',
    borderColor: '#E1BEE7'
  }
};

// Map aisles to high-level categories
const aisleCategoryMap: Record<string, string> = {
  // Fresh Foods
  'Produce Dept': 'fresh',
  'Meat Dept': 'fresh',
  'Deli/Fish Dept': 'fresh',
  'Bakery (Front Corner)': 'fresh',
  'Bakery Case': 'fresh',
  'Cheese Case': 'fresh',
  '1': 'fresh', // Dairy items are in aisle 1

  // Pantry Staples
  '2': 'pantry', // Canned goods, condiments
  '4': 'pantry', // Pasta, rice, sauces
  '5': 'pantry', // Baking needs, spices
  '6': 'pantry', // Canned vegetables, beans
  '9': 'pantry', // Soups, peanut butter, honey

  // Breakfast & Snacks
  '3': 'breakfast-snacks', // Cereal, granola bars
  '8': 'breakfast-snacks', // Chips, snack nuts
  '15': 'breakfast-snacks', // Bread, cookies, crackers
  '16': 'breakfast-snacks', // Dried fruits
  '17': 'breakfast-snacks', // Ice cream cones

  // Beverages
  '7': 'beverages', // Iced tea, kool aid
  '14': 'beverages', // Soda
  'Freezer Wall': 'fresh', // Ice cream

  // Household & Personal Care
  '10': 'household', // Personal care, baby items
  '11': 'household', // Paper products
  '12': 'household', // Cleaning supplies
  '13': 'household', // Foil, bags, pet food
};

// Map specific item categories to high-level categories
const itemCategoryMap: Record<string, string> = {
  // Fresh Foods
  'Produce': 'fresh',
  'Meat': 'fresh',
  'Seafood': 'fresh',
  'Bakery': 'fresh',
  'Dairy': 'fresh',
  'Deli': 'fresh',
  'Cheese': 'fresh',
  'Eggs': 'fresh',
  'Milk': 'fresh',
  'Yogurt': 'fresh',
  'Butter': 'fresh',

  // Pantry Staples
  'Canned Goods': 'pantry',
  'Pasta': 'pantry',
  'Rice': 'pantry',
  'Beans': 'pantry',
  'Baking': 'pantry',
  'Spices': 'pantry',
  'Condiments': 'pantry',
  'Sauces': 'pantry',
  'Oil': 'pantry',
  'Vinegar': 'pantry',
  'Soup': 'pantry',
  'Canned Vegetables': 'pantry',
  'Canned Fruit': 'pantry',
  'Canned Fish': 'pantry',
  'Canned Meat': 'pantry',

  // Breakfast & Snacks
  'Cereal': 'breakfast-snacks',
  'Breakfast': 'breakfast-snacks',
  'Snacks': 'breakfast-snacks',
  'Chips': 'breakfast-snacks',
  'Crackers': 'breakfast-snacks',
  'Cookies': 'breakfast-snacks',
  'Bread': 'breakfast-snacks',
  'Granola': 'breakfast-snacks',
  'Nuts': 'breakfast-snacks',
  'Dried Fruit': 'breakfast-snacks',
  'Candy': 'breakfast-snacks',
  'Popcorn': 'breakfast-snacks',

  // Beverages
  'Beverages': 'beverages',
  'Soda': 'beverages',
  'Juice': 'beverages',
  'Tea': 'beverages',
  'Coffee': 'beverages',
  'Water': 'beverages',
  'Drink Mix': 'beverages',

  // Household & Personal Care
  'Household': 'household',
  'Cleaning': 'household',
  'Paper Products': 'household',
  'Personal Care': 'household',
  'Health': 'household',
  'Baby': 'household',
  'Pet': 'household',
  'Laundry': 'household',
  'Bathroom': 'household',
  'Kitchen Supplies': 'household',
};

/**
 * Get the high-level category for a grocery item based on its store location or category
 * @param storeLocation The store location (aisle) of the grocery item
 * @param itemCategory The category of the grocery item
 * @returns The high-level category key or 'pantry' as default
 */
export const getHighLevelCategory = (storeLocation?: string, itemCategory?: string): string => {
  // First try to match by store location
  if (storeLocation && aisleCategoryMap[storeLocation]) {
    return aisleCategoryMap[storeLocation];
  }
  
  // Then try to match by item category
  if (itemCategory) {
    // Try exact match
    if (itemCategoryMap[itemCategory]) {
      return itemCategoryMap[itemCategory];
    }
    
    // Try partial match
    for (const [key, category] of Object.entries(itemCategoryMap)) {
      if (
        itemCategory.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(itemCategory.toLowerCase())
      ) {
        return category;
      }
    }
  }
  
  // Default to pantry if no match found
  return 'pantry';
};

/**
 * Get the category info for a grocery item
 * @param storeLocation The store location (aisle) of the grocery item
 * @param itemCategory The category of the grocery item
 * @returns The category info object
 */
export const getCategoryInfo = (storeLocation?: string, itemCategory?: string): CategoryInfo => {
  const categoryKey = getHighLevelCategory(storeLocation, itemCategory);
  return categories[categoryKey];
};

export default {
  categories,
  getHighLevelCategory,
  getCategoryInfo
};
