import React, { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { groceryItemsApi } from '../services/api';

import './ShoppingList.css';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  needToBuy: boolean;
  inCart: boolean;
  quantity?: number;
  unit?: string;
}

const ShoppingList: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // Fetch shopping list items using the API
  useEffect(() => {
    const fetchShoppingList = async () => {
      try {
        setLoading(true);
        
        console.log('ShoppingList - Fetching shopping list items...');
        
        // Use the API service to get shopping list items
        const shoppingItems = await groceryItemsApi.getShoppingList();
        
        console.log(`ShoppingList - Received ${shoppingItems.length} items from API`);
        console.log('Items breakdown:');
        console.log(`- Items with needToBuy=true: ${shoppingItems.filter(item => item.needToBuy).length}`);
        console.log(`- Items with inCart=true: ${shoppingItems.filter(item => item.inCart).length}`);
        
        // Log each item with inCart=true for debugging
        const inCartItems = shoppingItems.filter(item => item.inCart);
        if (inCartItems.length > 0) {
          console.log('Items with inCart=true:');
          inCartItems.forEach(item => {
            console.log(`- Item ID: ${item.id}, Name: ${item.name}, inCart: ${item.inCart}, needToBuy: ${item.needToBuy}`);
          });
        } else {
          console.log('No items with inCart=true received');
        }
        
        // Sort by name (no longer grouping by category)
        shoppingItems.sort((a, b) => a.name.localeCompare(b.name));
        
        setItems(shoppingItems);
      } catch (err) {
        console.error('Error fetching shopping list:', err);
        setError('Failed to load shopping list');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchShoppingList();
    }
  }, [currentUser]);

  // Move item to cart (from shopping list to cart)
  const moveItemToCart = async (id: string) => {
    try {
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) return;
      
      const updatedItems = [...items];
      const currentItem = updatedItems[itemIndex];
      
      // Toggle inCart status to true
      const _inCartResult = await groceryItemsApi.toggleInCart(id);
      
      // Toggle needToBuy status to false
      const needToBuyResult = await groceryItemsApi.toggleNeedToBuy(id);
      
      // Update local state with both changes
      updatedItems[itemIndex] = {
        ...currentItem,
        inCart: true, // Always set to true when moving to cart
        needToBuy: needToBuyResult.needToBuy !== undefined ? needToBuyResult.needToBuy : !currentItem.needToBuy,
      };
      
      setItems(updatedItems);
      
      // Clear any previous error messages
      if (error) setError('');
    } catch (err) {
      console.error('Error moving item to cart:', err);
      setError('Failed to update item');
    }
  };
  
  // Move item from cart back to shopping list
  const moveItemFromCart = async (id: string) => {
    try {
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) return;
      
      const updatedItems = [...items];
      const currentItem = updatedItems[itemIndex];
      
      // Toggle inCart status to false
      const _inCartResult = await groceryItemsApi.toggleInCart(id);
      
      // Toggle needToBuy status to true
      const needToBuyResult = await groceryItemsApi.toggleNeedToBuy(id);
      
      // Update local state with both changes
      updatedItems[itemIndex] = {
        ...currentItem,
        inCart: false, // Always set to false when moving back to shopping list
        needToBuy: needToBuyResult.needToBuy !== undefined ? needToBuyResult.needToBuy : !currentItem.needToBuy,
      };
      
      setItems(updatedItems);
      
      // Clear any previous error messages
      if (error) setError('');
    } catch (err) {
      console.error('Error moving item from cart:', err);
      setError('Failed to update item');
    }
  };

  // Empty the cart using the API
  const emptyCart = async () => {
    try {
      // Check if there are any items in cart
      const inCartItems = items.filter(item => item.inCart);
      
      if (inCartItems.length === 0) return;
      
      // Call the API to reset the cart
      await groceryItemsApi.resetCart();
      
      // Update local state - set inCart to false for all items
      const updatedItems = items.map(item => ({
        ...item,
        inCart: false,
      }));
      
      setItems(updatedItems);
      
      // Clear any previous error messages
      if (error) setError('');
    } catch (err) {
      console.error('Error emptying cart:', err);
      setError('Failed to empty cart');
    }
  };

  // Filter items for shopping list and cart
  const shoppingListItems = items.filter(item => item.needToBuy);
  const cartItems = items.filter(item => item.inCart);
  
  // Log the filtered items for debugging
  console.log(`ShoppingList - Filtered ${shoppingListItems.length} items for shopping list`);
  console.log(`ShoppingList - Filtered ${cartItems.length} items for cart`);
  
  // Log each item in the cart for debugging
  if (cartItems.length > 0) {
    console.log('Cart items:');
    cartItems.forEach(item => {
      console.log(`- Item ID: ${item.id}, Name: ${item.name}, inCart: ${item.inCart}, needToBuy: ${item.needToBuy}`);
    });
  }

  if (loading) {
    return <div className="loading">Loading shopping list...</div>;
  }

  return (
    <div className="shopping-list-page">
      <div className="shopping-list-header">
        <button 
          className="btn btn-secondary" 
          onClick={emptyCart}
          disabled={cartItems.length === 0}
        >
          Empty Cart
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Shopping List Section */}
      <div className="list-section">
        <h2 className="section-title">Items to Buy</h2>
        {shoppingListItems.length === 0 ? (
          <div className="empty-list">
            <p>Your shopping list is empty.</p>
          </div>
        ) : (
          <div className="item-container">
            <ul className="item-list">
              {shoppingListItems.map(item => (
                <div 
                  key={item.id} 
                  className="item"
                  role="button"
                  tabIndex={0}
                  onClick={() => moveItemToCart(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      moveItemToCart(item.id);
                    }
                  }}
                >
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                  </div>
                </div>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Cart Section */}
      <div className="cart-section">
        <h2 className="section-title">Cart</h2>
        {cartItems.length === 0 ? (
          <div className="empty-list">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div className="item-container">
            <ul className="item-list">
              {cartItems.map(item => (
                <div 
                  key={item.id} 
                  className="item in-cart"
                  role="button"
                  tabIndex={0}
                  onClick={() => moveItemFromCart(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      moveItemFromCart(item.id);
                    }
                  }}
                >
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                  </div>
                </div>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
