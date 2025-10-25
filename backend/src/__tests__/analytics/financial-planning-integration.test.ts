import request from 'supertest';
import { app } from '../../app';
import { connectDB, disconnectDB } from '../../config/database';
import { User } from '../../modules/auth/models/user.model';
import { Transaction } from '../../modules/financial/transactions/models/transaction.model';
import { Category } from '../../modules/financial/categories/models/category.model';
import { Budget } from '../../modules/financial/budgets/models/budget.model';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/environment';

describe('Financial Planning Integration Tests', () => {
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

  describe('POST /api/analytics/planning/goals', () => {
    it('should create a financial goal successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Emergency Fund',
          description: 'Build a 6-month emergency fund',
          targetAmount: 10000,
          targetDate: '2025-12-31',
          priority: 'high',
          category: 'savings',
          status: 'not_started',
          monthlyContribution: 500
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Emergency Fund');
      expect(response.body.data.targetAmount).toBe(10000);
      expect(response.body.data.monthlyContribution).toBe(500);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.progressPercentage).toBe(0);
      expect(response.body.data.status).toBe('not_started');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Emergency Fund',
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/goals')
        .send({
          name: 'Emergency Fund',
          targetAmount: 10000,
          targetDate: '2025-12-31',
          priority: 'high',
          category: 'savings',
          status: 'not_started',
          monthlyContribution: 500
        });

      expect(response.status).toBe(401);
    });

    it('should validate goal data correctly', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A'.repeat(101), // Too long
          targetAmount: -1000, // Negative amount
          targetDate: '2020-01-01', // Past date
          priority: 'invalid', // Invalid priority
          category: 'invalid', // Invalid category
          status: 'invalid', // Invalid status
          monthlyContribution: -100 // Negative contribution
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/analytics/planning/goals/:goalId/progress', () => {
    it('should update goal progress successfully', async () => {
      // First create a goal
      const createResponse = await request(app)
        .post('/api/analytics/planning/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Emergency Fund',
          description: 'Build a 6-month emergency fund',
          targetAmount: 10000,
          targetDate: '2025-12-31',
          priority: 'high',
          category: 'savings',
          status: 'not_started',
          monthlyContribution: 500
        });

      const goalId = createResponse.body.data.id;

      // Update progress
      const response = await request(app)
        .put(`/api/analytics/planning/goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentAmount: 2500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentAmount).toBe(2500);
      expect(response.body.data.progressPercentage).toBe(25);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should mark goal as completed when progress reaches 100%', async () => {
      // First create a goal
      const createResponse = await request(app)
        .post('/api/analytics/planning/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Emergency Fund',
          description: 'Build a 6-month emergency fund',
          targetAmount: 10000,
          targetDate: '2025-12-31',
          priority: 'high',
          category: 'savings',
          status: 'not_started',
          monthlyContribution: 500
        });

      const goalId = createResponse.body.data.id;

      // Update progress to 100%
      const response = await request(app)
        .put(`/api/analytics/planning/goals/${goalId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentAmount: 10000
        });

      expect(response.status).toBe(200);
      expect(response.body.data.progressPercentage).toBe(100);
      expect(response.body.data.status).toBe('completed');
    });

    it('should return 400 for missing currentAmount', async () => {
      const response = await request(app)
        .put('/api/analytics/planning/goals/goal123/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('currentAmount is required');
    });
  });

  describe('GET /api/analytics/planning/scenarios', () => {
    it('should generate financial scenarios successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/planning/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          timeHorizon: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      // Check scenario types
      const scenarioTypes = response.body.data.map((s: any) => s.scenarioType);
      expect(scenarioTypes).toContain('optimistic');
      expect(scenarioTypes).toContain('realistic');
      expect(scenarioTypes).toContain('pessimistic');
    });

    it('should use default time horizon when not provided', async () => {
      const response = await request(app)
        .get('/api/analytics/planning/scenarios')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    it('should validate time horizon parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/planning/scenarios')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          timeHorizon: 100 // Too high
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/analytics/planning/retirement', () => {
    it('should create retirement plan successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/retirement')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentAge: 30,
          retirementAge: 65,
          currentSavings: 10000,
          monthlyContribution: 500,
          expectedReturn: 7,
          inflationRate: 3,
          targetAmount: 1000000
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.currentAge).toBe(30);
      expect(response.body.data.retirementAge).toBe(65);
      expect(response.body.data.projectedAmount).toBeGreaterThan(0);
      expect(response.body.data.recommendations).toBeDefined();
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/retirement')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentAge: 30,
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should validate age parameters', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/retirement')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentAge: 10, // Too young
          retirementAge: 30, // Too young
          currentSavings: 10000,
          monthlyContribution: 500,
          expectedReturn: 7,
          targetAmount: 1000000
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/analytics/planning/debt-payoff', () => {
    it('should create debt payoff plan with avalanche strategy', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/debt-payoff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          debts: [
            {
              name: 'Credit Card',
              balance: 5000,
              interestRate: 18,
              minimumPayment: 150,
              priority: 1
            },
            {
              name: 'Car Loan',
              balance: 15000,
              interestRate: 6,
              minimumPayment: 300,
              priority: 2
            }
          ],
          strategy: 'avalanche'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.strategy).toBe('avalanche');
      expect(response.body.data.totalDebt).toBe(20000);
      expect(response.body.data.debts).toHaveLength(2);
      expect(response.body.data.timeline).toBeDefined();
      expect(Array.isArray(response.body.data.timeline)).toBe(true);
    });

    it('should create debt payoff plan with snowball strategy', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/debt-payoff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          debts: [
            {
              name: 'Small Loan',
              balance: 2000,
              interestRate: 12,
              minimumPayment: 100,
              priority: 1
            },
            {
              name: 'Large Loan',
              balance: 10000,
              interestRate: 8,
              minimumPayment: 200,
              priority: 2
            }
          ],
          strategy: 'snowball'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.strategy).toBe('snowball');
    });

    it('should return 400 for empty debts array', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/debt-payoff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          debts: [],
          strategy: 'avalanche'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('debts array is required and must not be empty');
    });

    it('should validate debt structure', async () => {
      const response = await request(app)
        .post('/api/analytics/planning/debt-payoff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          debts: [
            {
              name: 'Credit Card',
              // Missing required fields
            }
          ],
          strategy: 'avalanche'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Each debt must have');
    });
  });

  describe('GET /api/analytics/planning/recommendations', () => {
    it('should get financial recommendations successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/planning/recommendations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const recommendation = response.body.data[0];
        expect(recommendation).toHaveProperty('category');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('action');
        expect(recommendation).toHaveProperty('potentialImpact');
        expect(recommendation).toHaveProperty('timeframe');
      }
    });
  });

  describe('GET /api/analytics/planning/dashboard', () => {
    it('should get planning dashboard data successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/planning/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.scenarios).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalRecommendations).toBeDefined();
      expect(response.body.data.summary.highPriorityRecommendations).toBeDefined();
      expect(response.body.data.summary.scenarioCount).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with invalid data that might cause server errors
      const response = await request(app)
        .post('/api/analytics/planning/retirement')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentAge: 30,
          retirementAge: 65,
          currentSavings: 'invalid', // Invalid type
          monthlyContribution: 500,
          expectedReturn: 7,
          targetAmount: 1000000
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
        .get('/api/analytics/planning/recommendations')
        .set('Authorization', `Bearer ${emptyAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

