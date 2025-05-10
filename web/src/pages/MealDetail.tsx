import { 
  collection, 
  deleteDoc,
  doc, 
  getDoc, 
  getDocs, 
  query, 
  updateDoc, 
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

import './MealDetail.css';

interface Meal {
  id: string;
  name: string;
  description?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  userId: string;
}

interface Ingredient {
  id: string;
  mealId: string;
  itemId: string;
  quantity: number;
  unit: string;
  item?: {
    id: string;
    name: string;
    category: string;
    defaultUnit: string;
    needToBuy: boolean;
  };
}

const MealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch meal and ingredients
  useEffect(() => {
    const fetchMealData = async () => {
      try {
        setLoading(true);
        
        if (!id || !currentUser) {
          navigate('/meals');
          return;
        }
        
        // Get meal document
        const mealDoc = await getDoc(doc(db, 'meals', id));
        
        if (!mealDoc.exists()) {
          setError('Meal not found');
          setLoading(false);
          return;
        }
        
        const mealData = {
          id: mealDoc.id,
          ...mealDoc.data()
        } as Meal;
        
        // Check if the meal belongs to the current user
        if (mealData.userId !== currentUser.uid) {
          setError('You do not have permission to view this meal');
          setLoading(false);
          return;
        }
        
        setMeal(mealData);
        
        // Get ingredients
        const ingredientsQuery = query(
          collection(db, 'meals', id, 'ingredients')
        );
        
        const ingredientsSnapshot = await getDocs(ingredientsQuery);
        const ingredientsList: Ingredient[] = [];
        
        // Get all item IDs from ingredients
        const itemIds = ingredientsSnapshot.docs.map(doc => {
          const data = doc.data();
          return data.itemId;
        });
        
        // Get grocery items data
        const groceryItems: Record<string, any> = {};
        
        if (itemIds.length > 0) {
          const itemsQuery = query(
            collection(db, 'grocery_items'),
            where('__name__', 'in', itemIds)
          );
          
          const itemsSnapshot = await getDocs(itemsQuery);
          
          itemsSnapshot.forEach(doc => {
            groceryItems[doc.id] = {
              id: doc.id,
              ...doc.data()
            };
          });
        }
        
        // Combine ingredients with grocery items data
        ingredientsSnapshot.forEach(doc => {
          const data = doc.data();
          const itemId = data.itemId;
          
          ingredientsList.push({
            id: doc.id,
            mealId: id,
            itemId,
            quantity: data.quantity || 1,
            unit: data.unit || '',
            item: groceryItems[itemId]
          });
        });
        
        setIngredients(ingredientsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching meal:', err);
        setError('Failed to load meal details');
        setLoading(false);
      }
    };
    
    fetchMealData();
  }, [id, currentUser, navigate]);

  // Delete meal
  const handleDeleteMeal = async () => {
    if (!meal || !id) return;
    
    if (!window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }
    
    try {
      // Delete all ingredients
      for (const ingredient of ingredients) {
        await deleteDoc(doc(db, 'meals', id, 'ingredients', ingredient.id));
      }
      
      // Delete the meal
      await deleteDoc(doc(db, 'meals', id));
      
      navigate('/meals');
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal');
    }
  };

  // Add all ingredients to shopping list
  const handleAddToShoppingList = async () => {
    if (!meal || ingredients.length === 0) return;
    
    try {
      setAddingToShoppingList(true);
      
      // Update each grocery item to set needToBuy flag
      const updatePromises = ingredients
        .filter(ingredient => ingredient.item) // Only include ingredients with valid items
        .map(ingredient => {
          const itemRef = doc(db, 'grocery_items', ingredient.itemId);
          return updateDoc(itemRef, {
            needToBuy: true,
            lastUpdated: new Date(),
            updatedBy: currentUser?.uid
          });
        });
      
      await Promise.all(updatePromises);
      
      setAddingToShoppingList(false);
      alert('All ingredients added to shopping list!');
    } catch (err) {
      console.error('Error adding to shopping list:', err);
      setError('Failed to add ingredients to shopping list');
      setAddingToShoppingList(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading meal details...</div>;
  }

  if (error) {
    return (
      <div className="meal-detail-page">
        <div className="error-message">{error}</div>
        <Link to="/meals" className="btn btn-primary">
          Back to Meals
        </Link>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="meal-detail-page">
        <div className="error-message">Meal not found</div>
        <Link to="/meals" className="btn btn-primary">
          Back to Meals
        </Link>
      </div>
    );
  }

  return (
    <div className="meal-detail-page">
      <div className="meal-detail-header">
        <div className="meal-detail-title">
          <h1>{meal.name}</h1>
          {meal.description && <p className="meal-description">{meal.description}</p>}
        </div>
        <div className="meal-actions">
          <Link to={`/meals/${id}/edit`} className="btn btn-secondary">
            Edit Meal
          </Link>
          <button 
            className="btn btn-danger" 
            onClick={handleDeleteMeal}
          >
            Delete Meal
          </button>
        </div>
      </div>
      
      <div className="meal-detail-content">
        <div className="meal-info">
          <div className="meal-image-container">
            {meal.imageUrl ? (
              <img src={meal.imageUrl} alt={meal.name} className="meal-image" />
            ) : (
              <div className="meal-image-placeholder">
                <span>No Image</span>
              </div>
            )}
          </div>
          
          <div className="meal-details">
            <div className="detail-item">
              <span className="detail-label">Servings:</span>
              <span className="detail-value">{meal.servings}</span>
            </div>
            
            {meal.prepTime && (
              <div className="detail-item">
                <span className="detail-label">Prep Time:</span>
                <span className="detail-value">{meal.prepTime} minutes</span>
              </div>
            )}
            
            {meal.cookTime && (
              <div className="detail-item">
                <span className="detail-label">Cook Time:</span>
                <span className="detail-value">{meal.cookTime} minutes</span>
              </div>
            )}
            
            {meal.prepTime && meal.cookTime && (
              <div className="detail-item">
                <span className="detail-label">Total Time:</span>
                <span className="detail-value">{meal.prepTime + meal.cookTime} minutes</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="ingredients-section">
          <div className="section-header">
            <h2>Ingredients</h2>
            <button 
              className="btn btn-primary" 
              onClick={handleAddToShoppingList}
              disabled={ingredients.length === 0 || addingToShoppingList}
            >
              {addingToShoppingList ? 'Adding...' : 'Add All to Shopping List'}
            </button>
          </div>
          
          {ingredients.length === 0 ? (
            <p className="no-ingredients">No ingredients added to this meal yet.</p>
          ) : (
            <ul className="ingredients-list">
              {ingredients.map(ingredient => (
                <li key={ingredient.id} className="ingredient-item">
                  <span className="ingredient-quantity">
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                  <span className="ingredient-name">
                    {ingredient.item ? ingredient.item.name : 'Unknown Item'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="back-link">
        <Link to="/meals" className="btn btn-secondary">
          Back to Meals
        </Link>
      </div>
    </div>
  );
};

export default MealDetail;
