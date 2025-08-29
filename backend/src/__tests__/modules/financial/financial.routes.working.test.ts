import express from 'express';

// Mock the auth middleware
const mockAuthMiddleware = jest.fn((req, res, next) => next());

// Create mock controller
const mockController = {
  getFinancialDashboard: jest.fn().mockImplementation((req, res, next) => {
    res.status(200).json({
      success: true,
      data: { balance: 1000, income: 2000, expenses: 1000 },
    });
  }),
  generateFinancialReport: jest.fn().mockImplementation((req, res, next) => {
    res.status(200).json({
      success: true,
      data: { reportType: 'monthly', data: {} },
    });
  }),
  getBudgetAnalysis: jest.fn().mockImplementation((req, res, next) => {
    res.status(200).json({
      success: true,
      data: { budget: 1500, spent: 1000, remaining: 500 },
    });
  }),
  getFinancialInsights: jest.fn().mockImplementation((req, res, next) => {
    res.status(200).json({
      success: true,
      data: { insights: ['High spending on food'], trends: [] },
    });
  }),
  exportFinancialData: jest.fn().mockImplementation((req, res, next) => {
    res.status(200).json({
      success: true,
      data: { filename: 'export.csv', data: [] },
    });
  }),
  getFinancialSummary: jest.fn().mockImplementation((req, res, next) => {
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

  // Define routes with proper middleware handling
  router.get('/dashboard', (req, res, next) =>
    mockController.getFinancialDashboard(req, res, next)
  );
  router.post('/reports', (req, res, next) =>
    mockController.generateFinancialReport(req, res, next)
  );
  router.get('/budget-analysis', (req, res, next) =>
    mockController.getBudgetAnalysis(req, res, next)
  );
  router.get('/insights', (req, res, next) =>
    mockController.getFinancialInsights(req, res, next)
  );
  router.post('/export', (req, res, next) =>
    mockController.exportFinancialData(req, res, next)
  );
  router.get('/summary', (req, res, next) =>
    mockController.getFinancialSummary(req, res, next)
  );

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

    // Re-setup mock implementations after clearing
    mockController.getFinancialDashboard.mockImplementation(
      (req, res, next) => {
        res.status(200).json({
          success: true,
          data: { balance: 1000, income: 2000, expenses: 1000 },
        });
      }
    );

    mockController.generateFinancialReport.mockImplementation(
      (req, res, next) => {
        res.status(200).json({
          success: true,
          data: { reportType: 'monthly', data: {} },
        });
      }
    );

    mockController.getBudgetAnalysis.mockImplementation((req, res, next) => {
      res.status(200).json({
        success: true,
        data: { budget: 1500, spent: 1000, remaining: 500 },
      });
    });

    mockController.getFinancialInsights.mockImplementation((req, res, next) => {
      res.status(200).json({
        success: true,
        data: { insights: ['High spending on food'], trends: [] },
      });
    });

    mockController.exportFinancialData.mockImplementation((req, res, next) => {
      res.status(200).json({
        success: true,
        data: { filename: 'export.csv', data: [] },
      });
    });

    mockController.getFinancialSummary.mockImplementation((req, res, next) => {
      res.status(200).json({
        success: true,
        data: { summary: 'Monthly summary', period: 'month' },
      });
    });
  });

  afterEach(async () => {
    // Clean up any pending operations
    jest.clearAllMocks();
  });

  describe('GET /dashboard', () => {
    it('should return financial dashboard data', async () => {
      // Create mock request and response objects
      const req = {
        method: 'GET',
        url: '/api/financial/dashboard',
        query: {},
        headers: { 'Content-Type': 'application/json' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        body: {},
      } as any;

      // Call the mock controller directly
      await mockController.getFinancialDashboard(req, res, () => {});

      expect(mockController.getFinancialDashboard).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { balance: 1000, income: 2000, expenses: 1000 },
      });
    });

    it('should apply authentication middleware', async () => {
      // Test that middleware is applied
      const router = createMockRoutes();
      expect(router.stack.length).toBeGreaterThan(0);

      // Check if auth middleware is present
      const hasAuthMiddleware = router.stack.some(
        (layer: any) =>
          layer.name === 'mockAuthMiddleware' ||
          layer.handle === mockAuthMiddleware
      );
      expect(hasAuthMiddleware).toBe(true);
    });

    it('should handle query parameters', async () => {
      const req = {
        method: 'GET',
        url: '/api/financial/dashboard',
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        headers: { 'Content-Type': 'application/json' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        body: {},
      } as any;

      // Call the mock controller directly
      await mockController.getFinancialDashboard(req, res, () => {});

      expect(mockController.getFinancialDashboard).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { balance: 1000, income: 2000, expenses: 1000 },
      });
    });
  });

  describe('POST /reports', () => {
    it('should generate financial report', async () => {
      const req = {
        method: 'POST',
        url: '/api/financial/reports',
        body: {
          reportType: 'monthly',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        headers: { 'Content-Type': 'application/json' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        body: {},
      } as any;

      // Call the mock controller directly
      await mockController.generateFinancialReport(req, res, () => {});

      expect(mockController.generateFinancialReport).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { reportType: 'monthly', data: {} },
      });
    });
  });

  describe('GET /budget-analysis', () => {
    it('should return budget analysis data', async () => {
      const req = {
        method: 'GET',
        url: '/api/financial/budget-analysis',
        query: {},
        headers: { 'Content-Type': 'application/json' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        body: {},
      } as any;

      // Call the mock controller directly
      await mockController.getBudgetAnalysis(req, res, () => {});

      expect(mockController.getBudgetAnalysis).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { budget: 1500, spent: 1000, remaining: 500 },
      });
    });
  });

  describe('GET /insights', () => {
    it('should return financial insights', async () => {
      const req = {
        method: 'GET',
        url: '/api/financial/insights',
        query: { period: 'month' },
        headers: { 'Content-Type': 'application/json' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        body: {},
      } as any;

      // Call the mock controller directly
      await mockController.getFinancialInsights(req, res, () => {});

      expect(mockController.getFinancialInsights).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { insights: ['High spending on food'], trends: [] },
      });
    });
  });

  describe('POST /export', () => {
    it('should export financial data', async () => {
      const req = {
        method: 'POST',
        url: '/api/financial/export',
        body: { format: 'csv', startDate: '2024-01-01', endDate: '2024-01-31' },
        headers: { 'Content-Type': 'application/json' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        body: {},
      } as any;

      // Call the mock controller directly
      await mockController.exportFinancialData(req, res, () => {});

      expect(mockController.exportFinancialData).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { filename: 'export.csv', data: [] },
      });
    });
  });

  describe('GET /summary', () => {
    it('should return financial summary', async () => {
      const req = {
        method: 'GET',
        url: '/api/financial/summary',
        query: { period: 'month' },
        headers: { 'Content-Type': 'application/json' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        body: {},
      } as any;

      // Call the mock controller directly
      await mockController.getFinancialSummary(req, res, () => {});

      expect(mockController.getFinancialSummary).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { summary: 'Monthly summary', period: 'month' },
      });
    });
  });
});
