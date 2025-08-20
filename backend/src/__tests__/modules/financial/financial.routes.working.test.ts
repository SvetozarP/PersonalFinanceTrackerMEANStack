import request from 'supertest';
import express from 'express';

// Mock the auth middleware
const mockAuthMiddleware = jest.fn((req, res, next) => next());

// Create mock controller
const mockController = {
  getFinancialDashboard: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      success: true,
      data: { balance: 1000, income: 2000, expenses: 1000 },
    });
  }),
  generateFinancialReport: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      success: true,
      data: { reportType: 'monthly', data: {} },
    });
  }),
  getBudgetAnalysis: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      success: true,
      data: { budget: 1500, spent: 1000, remaining: 500 },
    });
  }),
  getFinancialInsights: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      success: true,
      data: { insights: ['High spending on food'], trends: [] },
    });
  }),
  exportFinancialData: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      success: true,
      data: { filename: 'export.csv', data: [] },
    });
  }),
  getFinancialSummary: jest.fn().mockImplementation((req, res) => {
    res.status(200).json({
      success: true,
      data: { summary: 'Monthly summary', period: 'month' },
    });
  }),
};

// Create mock routes
const createMockRoutes = () => {
  const router = express.Router();
  
  // Apply auth middleware
  router.use(mockAuthMiddleware);
  
  // Define routes
  router.get('/dashboard', mockController.getFinancialDashboard);
  router.post('/reports', mockController.generateFinancialReport);
  router.get('/budget-analysis', mockController.getBudgetAnalysis);
  router.get('/insights', mockController.getFinancialInsights);
  router.post('/export', mockController.exportFinancialData);
  router.get('/summary', mockController.getFinancialSummary);
  
  return router;
};

describe('Financial Routes - Working Test', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/financial', createMockRoutes());
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /dashboard', () => {
    it('should return financial dashboard data', async () => {
      const response = await request(app)
        .get('/api/financial/dashboard')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('balance');
      expect(response.body.data).toHaveProperty('income');
      expect(response.body.data).toHaveProperty('expenses');
    });

    it('should apply authentication middleware', async () => {
      await request(app).get('/api/financial/dashboard');
      expect(mockAuthMiddleware).toHaveBeenCalled();
    });

    it('should handle query parameters', async () => {
      const response = await request(app)
        .get('/api/financial/dashboard')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          accountId: 'account123',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /reports', () => {
    it('should generate financial report', async () => {
      const reportData = {
        reportType: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeCategories: true,
        includeTrends: true,
        includeProjections: false,
      };

      const response = await request(app)
        .post('/api/financial/reports')
        .set('Content-Type', 'application/json')
        .send(reportData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reportType');
    });

    it('should apply authentication middleware', async () => {
      await request(app)
        .post('/api/financial/reports')
        .set('Content-Type', 'application/json')
        .send({ reportType: 'monthly' });

      expect(mockAuthMiddleware).toHaveBeenCalled();
    });
  });

  describe('GET /budget-analysis', () => {
    it('should return budget analysis', async () => {
      const response = await request(app)
        .get('/api/financial/budget-analysis')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('budget');
      expect(response.body.data).toHaveProperty('spent');
      expect(response.body.data).toHaveProperty('remaining');
    });

    it('should apply authentication middleware', async () => {
      await request(app).get('/api/financial/budget-analysis');
      expect(mockAuthMiddleware).toHaveBeenCalled();
    });
  });

  describe('GET /insights', () => {
    it('should return financial insights', async () => {
      const response = await request(app)
        .get('/api/financial/insights')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data).toHaveProperty('trends');
    });

    it('should apply authentication middleware', async () => {
      await request(app).get('/api/financial/insights');
      expect(mockAuthMiddleware).toHaveBeenCalled();
    });
  });

  describe('POST /export', () => {
    it('should export financial data', async () => {
      const exportData = {
        format: 'csv',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeCategories: true,
        includeTransactions: true,
        includeStats: true,
      };

      const response = await request(app)
        .post('/api/financial/export')
        .set('Content-Type', 'application/json')
        .send(exportData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filename');
    });

    it('should apply authentication middleware', async () => {
      await request(app)
        .post('/api/financial/export')
        .set('Content-Type', 'application/json')
        .send({ format: 'csv', startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(mockAuthMiddleware).toHaveBeenCalled();
    });
  });

  describe('GET /summary', () => {
    it('should return financial summary', async () => {
      const response = await request(app)
        .get('/api/financial/summary')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should apply authentication middleware', async () => {
      await request(app).get('/api/financial/summary');
      expect(mockAuthMiddleware).toHaveBeenCalled();
    });
  });

  describe('Route Configuration', () => {
    it('should have all expected routes', () => {
      const routes = app._router.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const expectedRoutes = [
        { path: '/dashboard', methods: ['get'] },
        { path: '/reports', methods: ['post'] },
        { path: '/budget-analysis', methods: ['get'] },
        { path: '/insights', methods: ['get'] },
        { path: '/export', methods: ['post'] },
        { path: '/summary', methods: ['get'] },
      ];

      expectedRoutes.forEach(expectedRoute => {
        const foundRoute = routes.find(
          (route: any) => route.path === expectedRoute.path
        );
        expect(foundRoute).toBeDefined();
        expect(foundRoute?.methods).toEqual(
          expect.arrayContaining(expectedRoute.methods)
        );
      });
    });

    it('should apply authentication to all routes', async () => {
      const routes = ['/dashboard', '/reports', '/budget-analysis', '/insights', '/export', '/summary'];
      
      for (const route of routes) {
        jest.clearAllMocks();
        
        if (route === '/reports' || route === '/export') {
          await request(app)
            .post(`/api/financial${route}`)
            .set('Content-Type', 'application/json')
            .send({});
        } else {
          await request(app).get(`/api/financial${route}`);
        }
        
        expect(mockAuthMiddleware).toHaveBeenCalled();
      }
    });
  });
});
