import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { groceryItemsApi } from '../services/api';

import './GroceryItems.css';

interface GroceryItem {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  needToBuy: boolean;
  inCart: boolean;
  imageUrl?: string;
}

type SortOption = 'name' | 'category' | 'recent';

const GroceryItems: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    defaultUnit: '',
    needToBuy: false
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const { currentUser } = useAuth();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [filterNeedToBuy, setFilterNeedToBuy] = useState<boolean | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch all grocery items using the API
  useEffect(() => {
    const fetchGroceryItems = async () => {
      try {
        setLoading(true);
        console.log('Fetching grocery items via API...');
        
        const groceryItems = await groceryItemsApi.getAllItems();
        console.log('Grocery items fetched successfully:', groceryItems);
        
        // Extract unique categories for the filter
        const categories = Array.from(new Set(groceryItems.map(item => item.category)));
        if (categories.length > 0 && selectedCategories.length === 0) {
          // Use a functional update to avoid dependency on selectedCategories
          setSelectedCategories(prevCategories => 
            prevCategories.length === 0 ? categories : prevCategories
          );
        }
        
        setItems(groceryItems);
      } catch (err) {
        console.error('Error fetching grocery items:', err);
        // Add more detailed error logging
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
          setError(`Failed to load grocery items: ${err.message}`);
        } else {
          setError('Failed to load grocery items');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchGroceryItems();
    }
  }, [currentUser]); // Remove selectedCategories from dependency array

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  // Add new grocery item using the API
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.name || !formData.category || !formData.defaultUnit) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Log the form data being sent
      console.log('Sending new item data:', formData);
      
      // Create a properly structured item object that matches backend expectations
      const newItem = {
        name: formData.name,
        category: formData.category,
        defaultUnit: formData.defaultUnit,
        needToBuy: formData.needToBuy,
        inCart: false
        // Removed quantity and unit to prevent them from showing up in the shopping list
      };
      
      // Clear any previous errors
      setError('');
      
      console.log('Sending structured item data to API:', newItem);
      
      const createdItem = await groceryItemsApi.createItem(newItem);
      
      console.log('Successfully created item, API response:', createdItem);
      
      // Refresh the entire list to ensure we have the latest data
      const refreshedItems = await groceryItemsApi.getAllItems();
      setItems(refreshedItems);
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        defaultUnit: '',
        needToBuy: false
      });
      
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding grocery item:', err);
      
      // Provide more detailed error message if available
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        
        // Log the full error object for debugging
        console.error('Full error object:', err);
        
        // Extract the most specific error message possible
        let errorMessage = err.message;
        
        // If the error message contains a more specific message after a colon, extract it
        if (errorMessage.includes('Failed to create grocery item:')) {
          const specificError = errorMessage.split('Failed to create grocery item:')[1].trim();
          errorMessage = specificError || errorMessage;
        }
        
        setError(`Failed to add grocery item: ${errorMessage}`);
      } else {
        setError('Failed to add grocery item');
      }
    }
  };

  // Start editing an item
  const handleEditStart = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      defaultUnit: item.defaultUnit,
      needToBuy: item.needToBuy
    });
    setShowAddForm(true);
  };

  // Update grocery item using the API
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItemId) return;
    
    try {
      if (!formData.name || !formData.category || !formData.defaultUnit) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Log the form data being sent
      console.log('Sending updated item data:', formData);
      
      // Create a properly structured item object that matches backend expectations
      const updatedItem = {
        name: formData.name,
        category: formData.category,
        defaultUnit: formData.defaultUnit,
        needToBuy: formData.needToBuy,
        // Don't include inCart as we don't want to modify it during an edit
        // Include optional fields if they're needed by the backend
        unit: formData.defaultUnit
      };
      
      // Clear any previous errors
      setError('');
      
      console.log('Sending structured update data to API:', updatedItem);
      
      await groceryItemsApi.updateItem(editingItemId, updatedItem);
      
      console.log('Successfully sent update request, refreshing items list');
      
      // Refresh the entire list to ensure we have the latest data
      const refreshedItems = await groceryItemsApi.getAllItems();
      setItems(refreshedItems);
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        defaultUnit: '',
        needToBuy: false
      });
      
      setEditingItemId(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error updating grocery item:', err);
      
      // Provide more detailed error message if available
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setError(`Failed to update grocery item: ${err.message}`);
      } else {
        setError('Failed to update grocery item');
      }
    }
  };

  // Delete grocery item using the API
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      // Clear any previous errors
      setError('');
      
      console.log('Deleting item with ID:', id);
      
      await groceryItemsApi.deleteItem(id);
      
      console.log('Successfully deleted item with ID:', id);
      
      // Update local state
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting grocery item:', err);
      
      // Provide more detailed error message if available
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setError(`Failed to delete grocery item: ${err.message}`);
      } else {
        setError('Failed to delete grocery item');
      }
    }
  };

  // Toggle needToBuy status using the API
  const toggleNeedToBuy = async (id: string) => {
    try {
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) return;
      
      // Clear any previous errors
      setError('');
      
      console.log('Before API call - Item:', items[itemIndex]);
      
      // Call the API to toggle the needToBuy status
      const result = await groceryItemsApi.toggleNeedToBuy(id);
      
      console.log('API result:', result);
      
      // Update local state - toggle the current value if result doesn't contain needToBuy
      const updatedItems = [...items];
      const currentItem = updatedItems[itemIndex];
      
      // If the API result contains needToBuy, use that value, otherwise toggle the current value
      const newNeedToBuy = result.needToBuy !== undefined 
        ? result.needToBuy 
        : !currentItem.needToBuy;
      
      updatedItems[itemIndex] = {
        ...currentItem,
        needToBuy: newNeedToBuy,
      };
      
      console.log('Updated item:', updatedItems[itemIndex]);
      
      setItems(updatedItems);
    } catch (err) {
      console.error('Error toggling item status:', err);
      
      // Provide more detailed error message if available
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setError(`Failed to update item: ${err.message}`);
      } else {
        setError('Failed to update item');
      }
    }
  };

  // Cancel form
  const handleCancel = () => {
    setFormData({
      name: '',
      category: '',
      defaultUnit: '',
      needToBuy: false
    });
    setEditingItemId(null);
    setShowAddForm(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Handle sort option change
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  // Handle filter by needToBuy status
  const handleNeedToBuyFilterChange = (value: boolean | null) => {
    setFilterNeedToBuy(value);
  };

  // Get all unique categories from items
  const allCategories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category)));
  }, [items]);

  // Filter and sort items based on search, category, and sort options
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Filter by search query
        const matchesSearch = searchQuery === '' || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Filter by selected categories
        const matchesCategory = selectedCategories.length === 0 || 
          selectedCategories.includes(item.category);
        
        // Filter by needToBuy status if selected
        const matchesNeedToBuy = filterNeedToBuy === null || 
          item.needToBuy === filterNeedToBuy;
        
        return matchesSearch && matchesCategory && matchesNeedToBuy;
      })
      .sort((a, b) => {
        // Sort by selected option
        if (sortOption === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortOption === 'category') {
          return a.category.localeCompare(b.category);
        }
        // Default sort by name
        return a.name.localeCompare(b.name);
      });
  }, [items, searchQuery, selectedCategories, sortOption, filterNeedToBuy]);

  // Group items by category for display
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, GroceryItem[]> = {};
    
    filteredItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  }, [filteredItems]);

  if (loading) {
    return <div className="loading">Loading grocery items...</div>;
  }

  return (
    <div className="grocery-items-page">
      <div className="grocery-items-header">
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Item'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {showAddForm && (
        <div className="item-form-container">
          <form onSubmit={editingItemId ? handleUpdateItem : handleAddItem} className="item-form">
            <h2>{editingItemId ? 'Edit Item' : 'Add New Item'}</h2>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category" className="form-label">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="defaultUnit" className="form-label">Default Unit</label>
              <input
                type="text"
                id="defaultUnit"
                name="defaultUnit"
                className="form-input"
                value={formData.defaultUnit}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="needToBuy"
                  checked={formData.needToBuy}
                  onChange={handleInputChange}
                />
                Add to Shopping List
              </label>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingItemId ? 'Update Item' : 'Add Item'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {!showAddForm && (
        <div className="search-filter-container">
          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <button 
              className="advanced-filters-toggle"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {showAdvancedFilters && (
            <div className="filter-options">
            <div className="filter-section">
              <h3>Filter by Status</h3>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterNeedToBuy === null ? 'active' : ''}`}
                  onClick={() => handleNeedToBuyFilterChange(null)}
                >
                  All Items
                </button>
                <button 
                  className={`filter-btn ${filterNeedToBuy === true ? 'active' : ''}`}
                  onClick={() => handleNeedToBuyFilterChange(true)}
                >
                  In Shopping List
                </button>
                <button 
                  className={`filter-btn ${filterNeedToBuy === false ? 'active' : ''}`}
                  onClick={() => handleNeedToBuyFilterChange(false)}
                >
                  Not in Shopping List
                </button>
              </div>
            </div>
            
            <div className="filter-section">
              <h3>Sort by</h3>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${sortOption === 'name' ? 'active' : ''}`}
                  onClick={() => handleSortChange('name')}
                >
                  Name
                </button>
                <button 
                  className={`filter-btn ${sortOption === 'category' ? 'active' : ''}`}
                  onClick={() => handleSortChange('category')}
                >
                  Category
                </button>
              </div>
            </div>
            
            {allCategories.length > 0 && (
              <div className="filter-section categories-filter">
                <h3>Categories</h3>
                <div className="category-checkboxes">
                  {allCategories.map(category => (
                    <label key={category} className="category-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      )}
      
      {items.length === 0 ? (
        <div className="empty-list">
          <p>No grocery items found. Add some items to get started.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-list">
          <p>No items match your search criteria. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grocery-items-list">
          {sortOption === 'category' ? (
            // Display grouped by category
            Object.entries(itemsByCategory).map(([category, categoryItems]) => (
              <div key={category} className="category-section">
                <h2 className="category-title">{category}</h2>
                <div className="item-list">
                  {categoryItems.map(item => (
                    <div key={item.id} className="list-item">
                      <span className="item-name">{item.name}</span>
                      <div className="item-actions">
                        <button 
                          className={`btn-shopping-list ${item.needToBuy ? 'active' : ''}`}
                          onClick={() => toggleNeedToBuy(item.id)}
                          title={item.needToBuy ? "Remove from Shopping List" : "Add to Shopping List"}
                        >
                          {item.needToBuy ? '🛒' : '➕'}
                        </button>
                        <button 
                          className="action-btn edit-btn" 
                          onClick={() => handleEditStart(item)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Display as flat list
            <div className="item-list">
              {filteredItems.map(item => (
                <div key={item.id} className="list-item">
                  <span className="item-name">{item.name}</span>
                  <div className="item-actions">
                    <button 
                      className={`btn-shopping-list ${item.needToBuy ? 'active' : ''}`}
                      onClick={() => toggleNeedToBuy(item.id)}
                      title={item.needToBuy ? "Remove from Shopping List" : "Add to Shopping List"}
                    >
                      {item.needToBuy ? '🛒' : '➕'}
                    </button>
                    <button 
                      className="action-btn edit-btn" 
                      onClick={() => handleEditStart(item)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroceryItems;
