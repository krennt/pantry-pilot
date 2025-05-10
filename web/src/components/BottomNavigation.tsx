import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { groceryItemsApi } from '../services/api';

import './BottomNavigation.css';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  needToBuy: boolean;
  inCart: boolean;
}

interface QuickAddProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickAdd: React.FC<QuickAddProps> = ({ isOpen, onClose }) => {
  // Search mode states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GroceryItem[]>([]);
  const [allItems, setAllItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddNewForm, setShowAddNewForm] = useState(false);
  
  // New item form states
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  
  // Ref for search input auto-focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch all grocery items when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGroceryItems();
      // Focus on search input when modal opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      // Reset states when modal closes
      resetStates();
    }
  }, [isOpen]);

  // Filter search results when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const filteredItems = allItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(filteredItems);
  }, [searchQuery, allItems]);

  const fetchGroceryItems = async () => {
    try {
      setLoading(true);
      const items = await groceryItemsApi.getAllItems();
      setAllItems(items);
    } catch (err) {
      console.error('Error fetching grocery items:', err);
      setError('Failed to load grocery items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetStates = () => {
    setSearchQuery('');
    setSearchResults([]);
    setItemName('');
    setCategory('');
    setUnit('');
    setError('');
    setSuccess(false);
    setSuccessMessage('');
    setShowAddNewForm(false);
  };

  const handleAddToShoppingList = async (item: GroceryItem) => {
    try {
      setLoading(true);
      setError('');
      
      // Only add to shopping list if not already there
      if (!item.needToBuy) {
        await groceryItemsApi.toggleNeedToBuy(item.id);
      }
      
      setSuccess(true);
      setSuccessMessage(`${item.name} added to shopping list!`);
      
      // Update the item in search results
      setSearchResults(prevResults => 
        prevResults.map(result => 
          result.id === item.id ? { ...result, needToBuy: true } : result
        )
      );
      
      // Reset after showing success message
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 1500);
    } catch (err) {
      console.error('Error adding item to shopping list:', err);
      setError('Failed to add item to shopping list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create a new grocery item with needToBuy set to true
      const newItem = {
        name: itemName,
        category: category || 'General',
        defaultUnit: unit || 'pcs',
        needToBuy: true,
        inCart: false
      };

      // Add the item to the database and shopping list
      await groceryItemsApi.createItem(newItem);
      
      setSuccess(true);
      setSuccessMessage(`${itemName} added to shopping list!`);
      
      // Reset form after showing success message
      setTimeout(() => {
        resetStates();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error adding item to shopping list:', err);
      setError('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetStates();
    onClose();
  };

  const handleShowAddNewForm = () => {
    // Pre-fill the name field with the search query
    if (searchQuery) {
      setItemName(searchQuery);
    }
    setShowAddNewForm(true);
  };

  const handleBackToSearch = () => {
    setShowAddNewForm(false);
    setError('');
    // Focus back on search input
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="quick-add-overlay">
      <div className="quick-add-container">
        <div className="quick-add-header">
          <h3>{showAddNewForm ? 'Add New Item' : 'Add to Shopping List'}</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        {success ? (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        ) : showAddNewForm ? (
          // New Item Form
          <form onSubmit={handleCreateNewItem}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="itemName">Item Name</label>
              <input
                type="text"
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter item name"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category (optional)</label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="unit">Unit (optional)</label>
              <input
                type="text"
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Enter unit (e.g., kg, pcs)"
                disabled={loading}
              />
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Item'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleBackToSearch}
                disabled={loading}
              >
                Back to Search
              </button>
            </div>
          </form>
        ) : (
          // Search Interface
          <div className="quick-add-search">
            {error && <div className="error-message">{error}</div>}
            
            <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            
            {loading ? (
              <div className="loading-indicator">Loading...</div>
            ) : (
              <>
                {searchQuery.trim() !== '' && (
                  <div className="search-results">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="results-count">
                          {searchResults.length} item{searchResults.length !== 1 ? 's' : ''} found
                        </div>
                        <ul className="results-list">
                          {searchResults.map(item => (
                            <li key={item.id} className="result-item">
                              <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                {/* Category is intentionally not displayed in search results */}
                              </div>
                              <button
                                className={`add-to-list-btn ${item.needToBuy ? 'added' : ''}`}
                                onClick={() => handleAddToShoppingList(item)}
                                disabled={loading}
                                title={item.needToBuy ? 'Already in shopping list' : 'Add to shopping list'}
                              >
                                {item.needToBuy ? '✓' : '+'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <div className="no-results">
                        <p>No items found matching &quot;{searchQuery}&quot;</p>
                      </div>
                    )}
                    
                    <div className="add-new-option">
                      <button 
                        className="btn btn-text" 
                        onClick={handleShowAddNewForm}
                        disabled={loading}
                      >
                        Can&apos;t find what you&apos;re looking for? Add a new item
                      </button>
                    </div>
                  </div>
                )}
                
                {searchQuery.trim() === '' && (
                  <div className="search-prompt">
                    <p>Start typing to search for grocery items</p>
                    <p className="search-tip">or</p>
                    <button 
                      className="btn btn-outline" 
                      onClick={handleShowAddNewForm}
                      disabled={loading}
                    >
                      Add a new item
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      <nav className="bottom-navigation">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M19 21H5a1 1 0 0 1-1-1v-9H1l10.327-9.388a1 1 0 0 1 1.346 0L23 11h-3v9a1 1 0 0 1-1 1zM6 19h12V9.157l-6-5.454-6 5.454V19z"/>
            </svg>
          </div>
          <span>Dashboard</span>
        </Link>
        <Link to="/shopping" className={`nav-item ${isActive('/shopping')}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M4 6.414L.757 3.172l1.415-1.415L5.414 5h15.242a1 1 0 0 1 .958 1.287l-2.4 8a1 1 0 0 1-.958.713H6v2h11v2H5a1 1 0 0 1-1-1V6.414zM6 7v6h11.512l1.8-6H6zm-.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm12 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
          </div>
          <span>Shopping</span>
        </Link>
        <button 
          className="nav-item add-button"
          onClick={() => setQuickAddOpen(true)}
        >
          <div className="nav-icon plus-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/>
            </svg>
          </div>
        </button>
        <Link to="/items" className={`nav-item ${isActive('/items')}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M8 4h13v2H8V4zM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM8 11h13v2H8v-2zm0 7h13v2H8v-2z"/>
            </svg>
          </div>
          <span>Items</span>
        </Link>
        <Link to="/meals" className={`nav-item ${isActive('/meals')}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M19 22H5a3 3 0 0 1-3-3V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12h4v4a3 3 0 0 1-3 3zm-1-5v2a1 1 0 0 0 2 0v-2h-2zm-2 3V4H4v15a1 1 0 0 0 1 1h11zM6 7h8v2H6V7zm0 4h8v2H6v-2zm0 4h5v2H6v-2z"/>
            </svg>
          </div>
          <span>Meals</span>
        </Link>
      </nav>
      <QuickAdd isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
};

export default BottomNavigation;
