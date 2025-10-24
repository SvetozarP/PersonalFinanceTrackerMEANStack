import request from 'supertest';
import { app } from '../../app';
import { connectDB, disconnectDB } from '../../config/database';
import { User } from '../../modules/auth/models/user.model';
import { Transaction } from '../../modules/financial/transactions/models/transaction.model';
import { Category } from '../../modules/financial/categories/models/category.model';
import { Budget } from '../../modules/financial/budgets/models/budget.model';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/environment';

describe('Analytics Export Integration Tests', () => {
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

  describe('POST /api/analytics/reports/generate', () => {
    it('should generate a PDF report successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'pdf',
          reportType: 'comprehensive',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeInsights: true,
          includeRecommendations: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.pdf');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should generate an Excel report successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'excel',
          reportType: 'spending',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should generate a CSV report successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'csv',
          reportType: 'budgets',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should generate a JSON report successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          reportType: 'cashflow',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.json');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should return 400 for missing start date', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'pdf',
          reportType: 'comprehensive',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Start date and end date are required');
    });

    it('should return 400 for missing end date', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'pdf',
          reportType: 'comprehensive',
          startDate: '2024-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Start date and end date are required');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .send({
          format: 'pdf',
          reportType: 'comprehensive',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'invalid',
          reportType: 'comprehensive',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid report type', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'pdf',
          reportType: 'invalid',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/analytics/export (legacy endpoint)', () => {
    it('should generate a PDF report via legacy endpoint', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          format: 'pdf',
          type: 'all',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.pdf');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should generate a CSV report via legacy endpoint', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          format: 'csv',
          type: 'spending',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should generate a JSON report via legacy endpoint', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          format: 'json',
          type: 'budgets',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.json');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    it('should return 400 for missing required parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          format: 'pdf',
          type: 'all'
          // Missing startDate and endDate
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/export')
        .query({
          format: 'pdf',
          type: 'all',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Report content validation', () => {
    it('should include spending data in comprehensive report', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          reportType: 'comprehensive',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      
      const reportData = JSON.parse(response.text);
      expect(reportData.metadata).toBeDefined();
      expect(reportData.metadata.reportType).toBe('comprehensive');
      expect(reportData.spending).toBeDefined();
      expect(reportData.budgets).toBeDefined();
      expect(reportData.cashFlow).toBeDefined();
    });

    it('should include only spending data in spending report', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          reportType: 'spending',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      
      const reportData = JSON.parse(response.text);
      expect(reportData.spending).toBeDefined();
      expect(reportData.budgets).toBeUndefined();
      expect(reportData.cashFlow).toBeUndefined();
    });

    it('should include only budget data in budget report', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          reportType: 'budgets',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      
      const reportData = JSON.parse(response.text);
      expect(reportData.budgets).toBeDefined();
      expect(reportData.spending).toBeUndefined();
      expect(reportData.cashFlow).toBeUndefined();
    });

    it('should include only cash flow data in cashflow report', async () => {
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          reportType: 'cashflow',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      
      const reportData = JSON.parse(response.text);
      expect(reportData.cashFlow).toBeDefined();
      expect(reportData.spending).toBeUndefined();
      expect(reportData.budgets).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock a server error by using an invalid date range
      const response = await request(app)
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'pdf',
          reportType: 'comprehensive',
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
        .post('/api/analytics/reports/generate')
        .set('Authorization', `Bearer ${emptyAuthToken}`)
        .send({
          format: 'json',
          reportType: 'comprehensive',
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      
      const reportData = JSON.parse(response.text);
      expect(reportData.metadata).toBeDefined();
      // Should still generate a report even with no data
    });
  });
});
