import { auth } from '../firebase';

const API_BASE_URL = 'https://us-central1-pantrypilot-e2ba5.cloudfunctions.net/api';

/**
 * Get the current user's ID token for authentication
 */
const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken();
};

/**
 * Make an authenticated API request
 */
const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> => {
  try {
    console.log(`API Request: ${method} ${endpoint}`, body ? { body } : '');
    
    const token = await getIdToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Log response status
    console.log(`API Response status: ${response.status} ${response.statusText}`);
    
    // Clone the response to read it twice (once for error checking, once for the actual data)
    const responseClone = response.clone();
    
    // Try to parse the response as JSON regardless of status code
    let responseData;
    try {
      responseData = await responseClone.json();
      console.log('API Response data:', responseData);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
    }
    
    if (!response.ok) {
      // If we have parsed response data with an error message, use it
      if (responseData && responseData.error) {
        throw new Error(responseData.error);
      }
      
      // Otherwise, try to parse the error response
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `API request failed with status ${response.status}`
      );
    }
    
    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    
    // Provide more context about the error
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // If it's a network error, provide a more user-friendly message
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error: Please check your internet connection');
      }
    }
    
    throw error;
  }
};

/**
 * Grocery Items API
 */
export const groceryItemsApi = {
  /**
   * Get all grocery items
   */
  getAllItems: async () => {
    try {
      console.log('API getAllItems - Fetching all items');
      
      const response = await apiRequest<{ success: boolean; data: { items: any[] } }>('/items');
      
      console.log('API getAllItems - Response:', response);
      
      if (!response.data || !Array.isArray(response.data.items)) {
        console.error('API getAllItems - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response.data.items;
    } catch (error) {
      console.error('API getAllItems - Error details:', error);
      throw error; // Re-throw to be handled by the component
    }
  },
  
  /**
   * Get shopping list items
   */
  getShoppingList: async () => {
    try {
      console.log('API getShoppingList - Fetching shopping list items');
      
      const response = await apiRequest<{ success: boolean; data: { items: any[] } }>('/items/shopping');
      
      console.log('API getShoppingList - Response:', response);
      
      if (!response.data || !Array.isArray(response.data.items)) {
        console.error('API getShoppingList - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Log detailed information about the items
      console.log(`API getShoppingList - Received ${response.data.items.length} items`);
      console.log('Items breakdown:');
      console.log(`- Items with needToBuy=true: ${response.data.items.filter(item => item.needToBuy).length}`);
      console.log(`- Items with inCart=true: ${response.data.items.filter(item => item.inCart).length}`);
      
      // Log each item with inCart=true for debugging
      const inCartItems = response.data.items.filter(item => item.inCart);
      if (inCartItems.length > 0) {
        console.log('Items with inCart=true:');
        inCartItems.forEach(item => {
          console.log(`- Item ID: ${item.id}, Name: ${item.name}, inCart: ${item.inCart}, needToBuy: ${item.needToBuy}`);
        });
      } else {
        console.log('No items with inCart=true received from API');
      }
      
      return response.data.items;
    } catch (error) {
      console.error('API getShoppingList - Error details:', error);
      throw error; // Re-throw to be handled by the component
    }
  },
  
  /**
   * Get a specific grocery item by ID
   */
  getItemById: async (id: string) => {
    try {
      console.log(`API getItemById - Fetching item with ID: ${id}`);
      
      const response = await apiRequest<{ success: boolean; data: { item: any } }>(`/items/${id}`);
      
      console.log('API getItemById - Response:', response);
      
      if (!response.data || !response.data.item) {
        console.error('API getItemById - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response.data.item;
    } catch (error) {
      console.error('API getItemById - Error details:', error);
      throw error; // Re-throw to be handled by the component
    }
  },
  
  /**
   * Create a new grocery item
   */
  createItem: async (itemData: any) => {
    try {
      console.log('API createItem - Sending data:', itemData);
      
      // Log the complete request for debugging
      console.log('API createItem - Complete request:', {
        endpoint: '/items',
        method: 'POST',
        body: itemData
      });
      
    const response = await apiRequest<{ success: boolean; data: any }>(
      '/items',
      'POST',
      itemData
    );
    
    console.log('API createItem - Response:', response);
    
    if (!response.data) {
      console.error('API createItem - Invalid response format:', response);
      throw new Error('Invalid response format from server');
    }
    
    return response.data;
    } catch (error) {
      console.error('API createItem - Error details:', error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error('API createItem - Error stack:', error.stack);
        
        // Enhance error message with more context
        const enhancedError = new Error(`Failed to create item: ${error.message}`);
        enhancedError.stack = error.stack;
        throw enhancedError;
      }
      
      throw error; // Re-throw to be handled by the component
    }
  },
  
  /**
   * Update a grocery item
   */
  updateItem: async (id: string, itemData: any) => {
    try {
      console.log('API updateItem - Sending data:', { id, ...itemData });
      
      // Log the complete request for debugging
      console.log('API updateItem - Complete request:', {
        endpoint: `/items/${id}`,
        method: 'PUT',
        body: itemData
      });
      
      const response = await apiRequest<{ success: boolean; data: { id: string } }>(
        `/items/${id}`,
        'PUT',
        itemData
      );
      
      console.log('API updateItem - Response:', response);
      
      if (!response.data) {
        console.error('API updateItem - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('API updateItem - Error details:', error);
      
      // Add more detailed error information
      if (error instanceof Error) {
        console.error('API updateItem - Error stack:', error.stack);
        
        // Enhance error message with more context
        const enhancedError = new Error(`Failed to update item: ${error.message}`);
        enhancedError.stack = error.stack;
        throw enhancedError;
      }
      
      throw error; // Re-throw to be handled by the component
    }
  },
  
  /**
   * Delete a grocery item
   */
  deleteItem: async (id: string) => {
    try {
      console.log('API deleteItem - Deleting item:', id);
      
      const response = await apiRequest<{ success: boolean; data: { id: string } }>(
        `/items/${id}`,
        'DELETE'
      );
      
      console.log('API deleteItem - Response:', response);
      
      if (!response.data) {
        console.error('API deleteItem - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('API deleteItem - Error details:', error);
      throw error; // Re-throw to be handled by the component
    }
  },
  
  /**
   * Toggle needToBuy flag
   */
  toggleNeedToBuy: async (id: string) => {
    try {
      console.log('API toggleNeedToBuy - Toggling item:', id);
      
      const response = await apiRequest<{ success: boolean; data: { id: string; needToBuy: boolean }; message?: string }>(
        `/items/${id}/buy`,
        'PUT'
      );
      
      console.log('API toggleNeedToBuy - Response:', response);
      
      // Ensure we have the expected data structure
      if (!response.data) {
        console.error('API toggleNeedToBuy - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('API toggleNeedToBuy - Error details:', error);
      
      // Instead of returning a default object, throw the error to be handled by the component
      // This will allow the component to display a more specific error message
      throw error;
    }
  },
  
  /**
   * Toggle inCart flag
   */
  toggleInCart: async (id: string) => {
    try {
      console.log('API toggleInCart - Toggling item:', id);
      
      const response = await apiRequest<{ success: boolean; data: { id: string; inCart: boolean }; message?: string }>(
        `/items/${id}/cart`,
        'PUT'
      );
      
      console.log('API toggleInCart - Response:', response);
      
      // Ensure we have the expected data structure
      if (!response.data) {
        console.error('API toggleInCart - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('API toggleInCart - Error details:', error);
      
      // Instead of returning a default object, throw the error to be handled by the component
      // This will allow the component to display a more specific error message
      throw error;
    }
  },
  
  /**
   * Reset all inCart flags to false
   */
  resetCart: async () => {
    try {
      console.log('API resetCart - Resetting all items in cart');
      
      const response = await apiRequest<{ success: boolean; data: { count: number } }>(
        '/items/reset-cart',
        'POST'
      );
      
      console.log('API resetCart - Response:', response);
      
      if (!response.data) {
        console.error('API resetCart - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('API resetCart - Error details:', error);
      throw error; // Re-throw to be handled by the component
    }
  }
};

export default {
  groceryItems: groceryItemsApi
};
