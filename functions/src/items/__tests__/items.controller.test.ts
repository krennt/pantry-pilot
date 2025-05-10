import { Request, Response } from 'express';
import { db } from '../../shared/utils/firebase';
import * as responseUtils from '../../shared/utils/response';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  return {
    firestore: {
      Timestamp: {
        now: jest.fn().mockReturnValue({ seconds: 1234567890, nanoseconds: 0 }),
      },
      FieldPath: {
        documentId: jest.fn().mockReturnValue('id'),
      },
    },
  };
});

// Mock Firebase utils
jest.mock('../../shared/utils/firebase', () => {
  return {
    db: {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      batch: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(null),
      }),
    },
    Timestamp: {
      now: jest.fn().mockReturnValue({ seconds: 1234567890, nanoseconds: 0 }),
    },
  };
});

// Mock response utils
jest.mock('../../shared/utils/response', () => {
  return {
    sendSuccess: jest.fn(),
    sendError: jest.fn(),
  };
});

describe('Items Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response
    mockRequest = {
      params: {},
      body: {},
      user: { uid: 'test-user-id', email: 'test@example.com' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getAllItems', () => {
    it('should return all grocery items', async () => {
      // Mock data
      const mockItems = [
        {
          id: 'item1',
          data: () => ({
            name: 'Milk',
            category: 'Dairy',
            defaultUnit: 'gallon',
            needToBuy: false,
            inCart: false,
          }),
        },
        {
          id: 'item2',
          data: () => ({
            name: 'Bread',
            category: 'Bakery',
            defaultUnit: 'loaf',
            needToBuy: true,
            inCart: false,
          }),
        },
      ];

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        get: jest.fn().mockResolvedValue({
          docs: mockItems,
        }),
      });

      // Import the controller with mocked dependencies
      const controller = require('../items.controller');

      // Call the function
      await controller.getAllItems(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        items: [
          {
            id: 'item1',
            name: 'Milk',
            category: 'Dairy',
            defaultUnit: 'gallon',
            needToBuy: false,
            inCart: false,
          },
          {
            id: 'item2',
            name: 'Bread',
            category: 'Bakery',
            defaultUnit: 'loaf',
            needToBuy: true,
            inCart: false,
          },
        ],
      });
    });

    it('should handle errors', async () => {
      // Mock Firestore error
      (db.collection as jest.Mock).mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      // Import the controller with mocked dependencies
      const controller = require('../items.controller');

      // Call the function
      await controller.getAllItems(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendError).toHaveBeenCalledWith(mockResponse, 'Failed to get grocery items');
    });
  });

  describe('getItemById', () => {
    it('should return a specific grocery item by ID', async () => {
      // Set up request params
      mockRequest.params = { id: 'item1' };

      // Mock item data
      const mockItem = {
        id: 'item1',
        exists: true,
        data: () => ({
          name: 'Milk',
          category: 'Dairy',
          defaultUnit: 'gallon',
          needToBuy: false,
          inCart: false,
        }),
      };

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockItem),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.getItemById(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(mockResponse, {
        item: {
          id: 'item1',
          name: 'Milk',
          category: 'Dairy',
          defaultUnit: 'gallon',
          needToBuy: false,
          inCart: false,
        },
      });
    });

    it('should return 404 if item not found', async () => {
      // Set up request params
      mockRequest.params = { id: 'nonexistent' };

      // Mock Firestore response for non-existent item
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.getItemById(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendError).toHaveBeenCalledWith(mockResponse, 'Grocery item not found', 404);
    });
  });

  describe('createItem', () => {
    it('should create a new grocery item successfully', async () => {
      // Set up request body with all required fields
      mockRequest.body = {
        name: 'Eggs',
        category: 'Dairy',
        defaultUnit: 'dozen',
        needToBuy: true,
        quantity: 1,
        unit: 'dozen',
      };

      // Mock Firestore response
      const mockDocRef = { id: 'new-item-id' };
      (db.collection as jest.Mock).mockReturnValue({
        add: jest.fn().mockResolvedValue(mockDocRef),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.createItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        {
          item: {
            id: 'new-item-id',
            name: 'Eggs',
            category: 'Dairy',
            defaultUnit: 'dozen',
            needToBuy: true,
            inCart: false,
            quantity: 1,
            unit: 'dozen',
            lastUpdated: expect.anything(),
            updatedBy: 'test-user-id',
          },
        },
        'Grocery item created successfully',
        201
      );
    });

    it('should return 400 if required fields are missing', async () => {
      // Set up request body with missing fields
      mockRequest.body = {
        name: 'Eggs',
        // Missing category and defaultUnit
      };

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.createItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(responseUtils.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Name, category, and defaultUnit are required fields',
        400
      );
      // Verify that add was not called
      expect((db.collection('grocery_items').add as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should handle database errors when creating an item', async () => {
      // Set up request body
      mockRequest.body = {
        name: 'Eggs',
        category: 'Dairy',
        defaultUnit: 'dozen',
        needToBuy: true,
      };

      // Mock Firestore error
      const dbError = new Error('Permission denied');
      (db.collection as jest.Mock).mockReturnValue({
        add: jest.fn().mockRejectedValue(dbError),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.createItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create grocery item: Database error: Permission denied',
        500
      );
    });

    it('should handle unexpected errors when creating an item', async () => {
      // Set up request body
      mockRequest.body = {
        name: 'Eggs',
        category: 'Dairy',
        defaultUnit: 'dozen',
        needToBuy: true,
      };

      // Mock a general error before the database call
      (db.collection as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.createItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(responseUtils.sendError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create grocery item: Database error: Unexpected error',
        500
      );
    });
  });

  describe('updateItem', () => {
    it('should update an existing grocery item', async () => {
      // Set up request params and body
      mockRequest.params = { id: 'item1' };
      mockRequest.body = {
        name: 'Updated Milk',
        category: 'Dairy',
        needToBuy: true,
      };

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'Milk',
            category: 'Dairy',
            defaultUnit: 'gallon',
            needToBuy: false,
            inCart: false,
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.updateItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { id: 'item1' },
        'Grocery item updated successfully'
      );
    });

    it('should return 404 if item to update is not found', async () => {
      // Set up request params
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { name: 'Updated Item' };

      // Mock Firestore response for non-existent item
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.updateItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendError).toHaveBeenCalledWith(mockResponse, 'Grocery item not found', 404);
    });
  });

  describe('deleteItem', () => {
    it('should delete an existing grocery item', async () => {
      // Set up request params
      mockRequest.params = { id: 'item1' };

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
        }),
        delete: jest.fn().mockResolvedValue({}),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.deleteItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { id: 'item1' },
        'Grocery item deleted successfully'
      );
    });

    it('should return 404 if item to delete is not found', async () => {
      // Set up request params
      mockRequest.params = { id: 'nonexistent' };

      // Mock Firestore response for non-existent item
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.deleteItem(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendError).toHaveBeenCalledWith(mockResponse, 'Grocery item not found', 404);
    });
  });

  describe('toggleNeedToBuy', () => {
    it('should toggle needToBuy flag from false to true', async () => {
      // Set up request params
      mockRequest.params = { id: 'item1' };

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'Milk',
            category: 'Dairy',
            defaultUnit: 'gallon',
            needToBuy: false,
            inCart: false,
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.toggleNeedToBuy(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { id: 'item1', needToBuy: true },
        'Grocery item updated successfully'
      );
    });

    it('should toggle needToBuy flag from true to false', async () => {
      // Set up request params
      mockRequest.params = { id: 'item2' };

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'Bread',
            category: 'Bakery',
            defaultUnit: 'loaf',
            needToBuy: true,
            inCart: false,
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.toggleNeedToBuy(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { id: 'item2', needToBuy: false },
        'Grocery item updated successfully'
      );
    });
  });

  describe('toggleInCart', () => {
    it('should toggle inCart flag from false to true', async () => {
      // Set up request params
      mockRequest.params = { id: 'item1' };

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'Milk',
            category: 'Dairy',
            defaultUnit: 'gallon',
            needToBuy: true,
            inCart: false,
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.toggleInCart(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { id: 'item1', inCart: true },
        'Grocery item updated successfully'
      );
    });

    it('should toggle inCart flag from true to false', async () => {
      // Set up request params
      mockRequest.params = { id: 'item2' };

      // Mock Firestore response
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            name: 'Bread',
            category: 'Bakery',
            defaultUnit: 'loaf',
            needToBuy: true,
            inCart: true,
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.toggleInCart(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { id: 'item2', inCart: false },
        'Grocery item updated successfully'
      );
    });
  });

  describe('resetCart', () => {
    it('should reset all inCart flags to false', async () => {
      // Mock Firestore response
      const mockItems = [
        {
          ref: { update: jest.fn() },
          id: 'item1',
          data: () => ({
            name: 'Milk',
            inCart: true,
          }),
        },
        {
          ref: { update: jest.fn() },
          id: 'item2',
          data: () => ({
            name: 'Bread',
            inCart: true,
          }),
        },
      ];

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(null),
      };

      (db.batch as jest.Mock).mockReturnValue(mockBatch);
      (db.collection as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: false,
          size: 2,
          docs: mockItems,
        }),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.resetCart(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        { count: 2 },
        'Reset 2 items in cart'
      );
    });

    it('should handle case when no items are in cart', async () => {
      // Mock Firestore response for empty cart
      (db.collection as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: true,
          docs: [],
        }),
      });

      // Import the controller
      const controller = require('../items.controller');

      // Call the function
      await controller.resetCart(mockRequest as Request, mockResponse as Response);

      // Assertions
      expect(db.collection).toHaveBeenCalledWith('grocery_items');
      expect(responseUtils.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        null,
        'No items in cart to reset'
      );
    });
  });
});
