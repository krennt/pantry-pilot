import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
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
  userId: string;
}

const Meals: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // Fetch user's meals
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);
        
        if (!currentUser) {
          setMeals([]);
          return;
        }
        
        const q = query(
          collection(db, 'meals'),
          where('userId', '==', currentUser.uid),
          orderBy('name')
        );
        
        const querySnapshot = await getDocs(q);
        const userMeals: Meal[] = [];
        
        querySnapshot.forEach((doc) => {
          userMeals.push({
            id: doc.id,
            ...doc.data() as Omit<Meal, 'id'>
          });
        });
        
        setMeals(userMeals);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError('Failed to load meals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeals();
  }, [currentUser]);

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
      
      {error && <div className="error-message">{error}</div>}
      
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
