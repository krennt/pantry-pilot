import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Import components
import BottomNavigation from './components/BottomNavigation';
import ErrorBoundary from './components/ErrorBoundary';
// Import context providers
import { AuthProvider, useAuth } from './context/AuthContext';
// Import pages
import EditMeal from './pages/EditMeal';
import GroceryItems from './pages/GroceryItems';
import Home from './pages/Home';
import Login from './pages/Login';
import MealDetail from './pages/MealDetail';
import Meals from './pages/Meals';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import ShoppingList from './pages/ShoppingList';

import './App.css';

// Wrapper component to conditionally render BottomNavigation
const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items" element={<GroceryItems />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/meals" element={
            <ErrorBoundary>
              <Meals />
            </ErrorBoundary>
          } />
          <Route path="/meals/new" element={
            <ErrorBoundary>
              <EditMeal />
            </ErrorBoundary>
          } />
          <Route path="/meals/:id" element={
            <ErrorBoundary>
              <MealDetail />
            </ErrorBoundary>
          } />
          <Route path="/meals/:id/edit" element={
            <ErrorBoundary>
              <EditMeal />
            </ErrorBoundary>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {currentUser && <BottomNavigation />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
