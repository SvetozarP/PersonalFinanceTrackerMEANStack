import request from 'supertest';
import { app } from '../../app';
import { connectDB, disconnectDB } from '../../config/database';
import { User } from '../../modules/auth/models/user.model';
import { Transaction } from '../../modules/financial/transactions/models/transaction.model';
import { Category } from '../../modules/financial/categories/models/category.model';
import { Budget } from '../../modules/financial/budgets/models/budget.model';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/environment';

// Mock external dependencies
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn().mockReturnValue({}),
    json_to_sheet: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn()
  },
  write: jest.fn().mockReturnValue(Buffer.from('mock excel content'))
}));

describe('Data Export Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let testUser: any;
  let testCategory: any;
  let testBudget: any;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Category.deleteMany({});
    await Budget.deleteMany({});

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    userId = testUser._id.toString();
    authToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });

    // Create test category
    testCategory = await Category.create({
      name: 'Food',
      description: 'Food and dining expenses',
      userId,
      type: 'expense'
    });

    // Create test transactions
    await Transaction.create([
      {
        amount: 50.00,
        description: 'Grocery shopping',
        type: 'expense',
        category: testCategory._id,
        userId,
        date: new Date('2024-01-15'),
        status: 'completed'
      },
      {
        amount: 25.00,
        description: 'Lunch',
        type: 'expense',
        category: testCategory._id,
        userId,
        date: new Date('2024-01-20'),
        status: 'completed'
      },
      {
        amount: 100.00,
        description: 'Salary',
        type: 'income',
        userId,
        date: new Date('2024-01-01'),
        status: 'completed'
      }
    ]);

    // Create test budget
    testBudget = await Budget.create({
      name: 'Monthly Budget',
      description: 'Monthly budget for January 2024',
      userId,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      totalAmount: 1000.00,
      categories: [{
        category: testCategory._id,
        allocatedAmount: 200.00
      }]
    });
  });

  describe('POST /api/analytics/export/data', () => {
    it('should export all financial data in Excel format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          dataTypes: ['all'],
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should export all financial data in CSV format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          dataTypes: ['all'],
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should export all financial data in JSON format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          dataTypes: ['all'],
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.json');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should export specific data types only', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          dataTypes: ['transactions', 'categories'],
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: false
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should apply filters correctly', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          dataTypes: ['transactions'],
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true,
          filters: {
            categories: [testCategory._id.toString()],
            transactionTypes: ['expense'],
            minAmount: 10,
            maxAmount: 100
          }
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should return 400 for missing start date', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          dataTypes: ['all'],
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Start date and end date are required');
    });

    it('should return 400 for missing end date', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          dataTypes: ['all'],
          startDate: '2024-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Start date and end date are required');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .send({
          format: 'excel',
          dataTypes: ['all'],
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'invalid',
          dataTypes: ['all'],
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid data types', async () => {
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          dataTypes: ['invalid'],
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/analytics/export/transactions', () => {
    it('should export transactions in Excel format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should export transactions in CSV format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: false
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should apply transaction filters', async () => {
      const response = await request(app)
        .post('/api/analytics/export/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true,
          filters: {
            categories: [testCategory._id.toString()],
            transactionTypes: ['expense'],
            minAmount: 20,
            maxAmount: 100
          }
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.body).toBeInstanceOf(Buffer);
    });
  });

  describe('POST /api/analytics/export/categories', () => {
    it('should export categories in Excel format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          includeMetadata: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should export categories in CSV format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          includeMetadata: false
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toBeInstanceOf(Buffer);
    });
  });

  describe('POST /api/analytics/export/budgets', () => {
    it('should export budgets in Excel format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should return 400 for missing date range', async () => {
      const response = await request(app)
        .post('/api/analytics/export/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          includeMetadata: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Start date and end date are required');
    });
  });

  describe('POST /api/analytics/export/analytics', () => {
    it('should export analytics in Excel format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true,
          groupBy: 'month'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should export analytics in JSON format', async () => {
      const response = await request(app)
        .post('/api/analytics/export/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetadata: true,
          groupBy: 'day'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.json');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should validate groupBy parameter', async () => {
      const response = await request(app)
        .post('/api/analytics/export/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          groupBy: 'invalid'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/analytics/export/status', () => {
    it('should get export status successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/export/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.exportHistory).toBeDefined();
      expect(response.body.data.totalExports).toBeDefined();
      expect(response.body.data.lastExport).toBeDefined();
      expect(Array.isArray(response.body.data.exportHistory)).toBe(true);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/export/status');

      expect(response.status).toBe(401);
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with invalid data that might cause server errors
      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          dataTypes: ['all'],
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        });

      expect(response.status).toBe(400);
    });

    it('should handle missing user data gracefully', async () => {
      // Create a user with no transactions or budgets
      const emptyUser = await User.create({
        email: 'empty@example.com',
        password: 'password123',
        firstName: 'Empty',
        lastName: 'User'
      });
      const emptyUserId = emptyUser._id.toString();
      const emptyAuthToken = jwt.sign({ userId: emptyUserId }, JWT_SECRET, { expiresIn: '1h' });

      const response = await request(app)
        .post('/api/analytics/export/data')
        .set('Authorization', `Bearer ${emptyAuthToken}`)
        .send({
          format: 'json',
          dataTypes: ['all'],
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Buffer);
    });
  });
});

