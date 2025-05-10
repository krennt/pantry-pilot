import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import './Home.css';

const Home: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="home-page">
      <div className="welcome-container">
        <h1>Welcome to PantryPilot</h1>
        
        {currentUser ? (
          <div className="welcome-message">
            <p>Hello, {currentUser.displayName || currentUser.email}!</p>
            <p>Your personal assistant for grocery shopping and meal planning.</p>
            <p>Use the navigation below to manage your shopping list, grocery items, and meals.</p>
            
            <div className="profile-section">
              <h3>Profile</h3>
              <button onClick={handleLogout} className="btn btn-secondary logout-btn">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="welcome-message">
            <p>Your personal assistant for grocery shopping and meal planning.</p>
            <div className="cta-buttons">
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
