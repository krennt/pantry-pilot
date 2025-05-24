import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

import './Meals.css';

interface Meal {
  id: string;
  name: string;
  description?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
}

const Meals: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const { currentUser } = useAuth();

  // Fetch all meals for the family
  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      if (!currentUser) {
        setMeals([]);
        return;
      }
      
      console.log('Fetching all family meals...');
      
      const q = query(
        collection(db, 'meals'),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const allMeals: Meal[] = [];
      
      querySnapshot.forEach((doc) => {
        allMeals.push({
          id: doc.id,
          ...doc.data() as Omit<Meal, 'id'>
        });
      });
      
      console.log('Successfully fetched meals:', allMeals.length);
      setMeals(allMeals);
    } catch (err) {
      console.error('Error fetching meals:', err);
      
      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('permission-denied')) {
          setError('You don\'t have permission to access meals. Please make sure you\'re logged in.');
        } else if (err.message.includes('unavailable')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (err.message.includes('index')) {
          setError('Database is being updated. Please try again in a few moments.');
        } else {
          setError(`Failed to load meals: ${err.message}`);
        }
      } else {
        setError('Failed to load meals. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchMeals();
  };

  useEffect(() => {
    fetchMeals();
  }, [currentUser, retryCount]);

  if (loading) {
    return <div className="loading">Loading meals...</div>;
  }

  return (
    <div className="meals-page">
      <div className="meals-header">
        <Link to="/meals/new" className="btn btn-primary">
          Add New Meal
        </Link>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRetry} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      )}
      
      {meals.length === 0 ? (
        <div className="empty-list">
          <p>You haven&apos;t created any meals yet.</p>
          <p>Create your first meal to get started with meal planning.</p>
        </div>
      ) : (
        <div className="meals-grid">
          {meals.map(meal => (
            <Link to={`/meals/${meal.id}`} key={meal.id} className="meal-card">
              <div className="meal-image">
                {meal.imageUrl ? (
                  <img src={meal.imageUrl} alt={meal.name} />
                ) : (
                  <div className="meal-image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div className="meal-content">
                <h3 className="meal-title">{meal.name}</h3>
                {meal.description && (
                  <p className="meal-description">{meal.description}</p>
                )}
                <div className="meal-details">
                  <span className="meal-servings">
                    <strong>Servings:</strong> {meal.servings}
                  </span>
                  {(meal.prepTime || meal.cookTime) && (
                    <span className="meal-time">
                      <strong>Time:</strong> {meal.prepTime ? `${meal.prepTime} min prep` : ''}
                      {meal.prepTime && meal.cookTime ? ' + ' : ''}
                      {meal.cookTime ? `${meal.cookTime} min cook` : ''}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Meals;
