/**
 * @jest-environment node
 */

import express from 'express';
import request from 'supertest';

describe('Analytics Routes - Budget Reporting Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock routes for budget reporting endpoints
    const router = express.Router();

    // Mock auth middleware - just call next()
    router.use((req: any, res: any, next: any) => {
      req.user = { userId: 'test-user-id' };
      next();
    });

    // Mock budget performance report endpoint
    router.get('/budgets/:budgetId/performance', (req: any, res: any) => {
      const { budgetId } = req.params;
      const { startDate, endDate } = req.query;

      if (!budgetId || budgetId === 'undefined' || budgetId === '') {
        return res.status(400).json({
          success: false,
          message: 'Budget ID is required'
        });
      }

      // Validate date format if provided
      if (startDate && isNaN(Date.parse(startDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start date format'
        });
      }

      if (endDate && isNaN(Date.parse(endDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end date format'
        });
      }

      // Validate date range if both dates provided
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          budgetId,
          budgetName: 'Monthly Budget',
          period: {
            startDate: startDate ? new Date(startDate) : new Date('2024-01-01'),
            endDate: endDate ? new Date(endDate) : new Date('2024-01-31')
          },
          performance: {
            totalAllocated: 4000,
            totalSpent: 3000,
            remainingAmount: 1000,
            utilizationPercentage: 75,
            varianceAmount: -1000,
            variancePercentage: -25,
            status: 'under'
          },
          categoryPerformance: [],
          trends: {
            dailySpending: [],
            weeklyTrends: []
          },
          insights: []
        }
      });
    });

    // Mock budget vs actual report endpoint
    router.get('/budgets/:budgetId/vs-actual', (req: any, res: any) => {
      const { budgetId } = req.params;
      const { startDate, endDate } = req.query;

      if (!budgetId || budgetId === 'undefined' || budgetId === '') {
        return res.status(400).json({
          success: false,
          message: 'Budget ID is required'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          budgetId,
          budgetName: 'Monthly Budget',
          period: {
            startDate: startDate ? new Date(startDate) : new Date('2024-01-01'),
            endDate: endDate ? new Date(endDate) : new Date('2024-01-31')
          },
          summary: {
            totalBudgeted: 4000,
            totalActual: 3000,
            variance: -1000,
            variancePercentage: -25,
            status: 'under'
          },
          categoryComparison: [],
          monthlyBreakdown: [],
          topVariances: [],
          recommendations: []
        }
      });
    });

    // Mock budget trend analysis endpoint
    router.get('/budgets/:budgetId/trends', (req: any, res: any) => {
      const { budgetId } = req.params;
      const { startDate, endDate } = req.query;

      if (!budgetId || budgetId === 'undefined' || budgetId === '') {
        return res.status(400).json({
          success: false,
          message: 'Budget ID is required'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          budgetId,
          budgetName: 'Monthly Budget',
          analysisPeriod: {
            startDate: startDate ? new Date(startDate) : new Date('2024-01-01'),
            endDate: endDate ? new Date(endDate) : new Date('2024-01-31')
          },
          trends: {
            utilizationTrend: [],
            spendingVelocity: [],
            categoryTrends: []
          },
          projections: {
            endOfPeriodProjection: {
              projectedSpending: 3100,
              projectedVariance: -900,
              confidence: 'high',
              basedOnTrend: 'last_week'
            },
            categoryProjections: []
          },
          insights: []
        }
      });
    });

    // Mock budget variance analysis endpoint
    router.get('/budgets/:budgetId/variance', (req: any, res: any) => {
      const { budgetId } = req.params;
      const { startDate, endDate } = req.query;

      if (!budgetId || budgetId === 'undefined' || budgetId === '') {
        return res.status(400).json({
          success: false,
          message: 'Budget ID is required'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          budgetId,
          budgetName: 'Monthly Budget',
          period: {
            startDate: startDate ? new Date(startDate) : new Date('2024-01-01'),
            endDate: endDate ? new Date(endDate) : new Date('2024-01-31')
          },
          varianceSummary: {
            totalVariance: -1000,
            totalVariancePercentage: -25,
            favorableVariances: 1000,
            unfavorableVariances: 0,
            netVariance: -1000
          },
          categoryVariances: [],
          varianceDrivers: [],
          varianceTrends: [],
          recommendations: []
        }
      });
    });

    // Mock budget forecast endpoint
    router.get('/budgets/:budgetId/forecast', (req: any, res: any) => {
      const { budgetId } = req.params;
      const { forecastStartDate, forecastEndDate } = req.query;

      if (!budgetId || budgetId === 'undefined' || budgetId === '') {
        return res.status(400).json({
          success: false,
          message: 'Budget ID is required'
        });
      }

      // Validate forecast date format if provided
      if (forecastStartDate && isNaN(Date.parse(forecastStartDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid forecast start date format'
        });
      }

      if (forecastEndDate && isNaN(Date.parse(forecastEndDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid forecast end date format'
        });
      }

      // Validate forecast date range if both dates provided
      if (forecastStartDate && forecastEndDate && new Date(forecastStartDate) >= new Date(forecastEndDate)) {
        return res.status(400).json({
          success: false,
          message: 'Forecast end date must be after forecast start date'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          budgetId,
          budgetName: 'Monthly Budget',
          forecastPeriod: {
            startDate: forecastStartDate ? new Date(forecastStartDate) : new Date('2024-02-01'),
            endDate: forecastEndDate ? new Date(forecastEndDate) : new Date('2024-02-29')
          },
          forecast: {
            projectedSpending: 3200,
            projectedVariance: -800,
            confidence: 'high',
            methodology: 'historical'
          },
          categoryForecasts: [],
          scenarios: [],
          riskFactors: [],
          recommendations: []
        }
      });
    });

    // Mock budget category breakdown endpoint
    router.get('/budgets/:budgetId/breakdown', (req: any, res: any) => {
      const { budgetId } = req.params;
      const { startDate, endDate } = req.query;

      if (!budgetId || budgetId === 'undefined' || budgetId === '') {
        return res.status(400).json({
          success: false,
          message: 'Budget ID is required'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          budgetId,
          budgetName: 'Monthly Budget',
          period: {
            startDate: startDate ? new Date(startDate) : new Date('2024-01-01'),
            endDate: endDate ? new Date(endDate) : new Date('2024-01-31')
          },
          categoryBreakdown: [],
          spendingPatterns: {
            topSpendingCategories: [],
            mostActiveCategories: [],
            categoryEfficiency: []
          },
          insights: []
        }
      });
    });

    // Mock budget alerts endpoint
    router.get('/budgets/alerts', (req: any, res: any) => {
      const { budgetId } = req.query;

      res.status(200).json({
        success: true,
        data: [
          {
            id: 'alert-123',
            budgetId: budgetId || 'budget123',
            budgetName: 'Monthly Budget',
            type: 'threshold',
            severity: 'warning',
            message: 'Budget utilization is at 90%',
            triggeredAt: new Date('2024-01-25'),
            data: {
              currentValue: 90,
              threshold: 90,
              variance: 0,
              variancePercentage: 0
            },
            actions: [],
            resolved: false
          }
        ]
      });
    });

    // Mock budget export endpoint
    router.get('/budgets/export', (req: any, res: any) => {
      const { startDate, endDate, format, reportType, includeCharts, includeDetails, budgetIds, categories } = req.query;

      // Validate required parameters
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      // Validate date format
      if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      // Validate date range
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }

      // Validate format
      if (format && !['json', 'csv', 'pdf', 'excel'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Must be one of: json, csv, pdf, excel'
        });
      }

      // Validate report type
      if (reportType && !['performance', 'variance', 'trend', 'forecast', 'breakdown', 'all'].includes(reportType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Must be one of: performance, variance, trend, forecast, breakdown, all'
        });
      }

      // Set appropriate headers for file download
      const exportFormat = format || 'json';
      const contentType = exportFormat === 'json' ? 'application/json' : 
                         exportFormat === 'csv' ? 'text/csv' :
                         exportFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="budget-report-${reportType || 'all'}-${new Date().toISOString().split('T')[0]}.${exportFormat}"`);

      res.status(200).send(JSON.stringify({
        exportType: reportType || 'all',
        format: exportFormat,
        dateRange: { startDate, endDate },
        includeCharts: includeCharts === 'true',
        includeDetails: includeDetails !== 'false', // Default to true if not specified
        budgetIds: budgetIds ? budgetIds.split(',') : undefined,
        categories: categories ? categories.split(',') : undefined,
        data: {}
      }, null, 2));
    });

    app.use('/api/analytics', router);
  });

  describe('GET /api/analytics/budgets/:budgetId/performance', () => {
    it('should get budget performance report successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgetId).toBe('budget123');
      expect(response.body.data.budgetName).toBe('Monthly Budget');
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.performance.totalAllocated).toBe(4000);
      expect(response.body.data.performance.totalSpent).toBe(3000);
      expect(response.body.data.performance.utilizationPercentage).toBe(75);
      expect(response.body.data.performance.status).toBe('under');
    });

    it('should get budget performance report with custom date range', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/performance')
        .query({
          startDate: '2024-02-01',
          endDate: '2024-02-29'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period.startDate).toBe('2024-02-01T00:00:00.000Z');
      expect(response.body.data.period.endDate).toBe('2024-02-29T00:00:00.000Z');
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/undefined/performance')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Budget ID is required');
    });

    it('should return 400 when start date format is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/performance')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-31'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid start date format');
    });

    it('should return 400 when end date format is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/performance')
        .query({
          startDate: '2024-01-01',
          endDate: 'invalid-date'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid end date format');
    });

    it('should return 400 when end date is before start date', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/performance')
        .query({
          startDate: '2024-01-31',
          endDate: '2024-01-01'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('End date must be after start date');
    });
  });

  describe('GET /api/analytics/budgets/:budgetId/vs-actual', () => {
    it('should get budget vs actual report successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/vs-actual')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgetId).toBe('budget123');
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalBudgeted).toBe(4000);
      expect(response.body.data.summary.totalActual).toBe(3000);
      expect(response.body.data.summary.variance).toBe(-1000);
      expect(response.body.data.summary.variancePercentage).toBe(-25);
      expect(response.body.data.summary.status).toBe('under');
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/undefined/vs-actual')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Budget ID is required');
    });
  });

  describe('GET /api/analytics/budgets/:budgetId/trends', () => {
    it('should get budget trend analysis successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgetId).toBe('budget123');
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.projections).toBeDefined();
      expect(response.body.data.projections.endOfPeriodProjection).toBeDefined();
      expect(response.body.data.projections.endOfPeriodProjection.projectedSpending).toBe(3100);
      expect(response.body.data.projections.endOfPeriodProjection.confidence).toBe('high');
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/undefined/trends')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Budget ID is required');
    });
  });

  describe('GET /api/analytics/budgets/:budgetId/variance', () => {
    it('should get budget variance analysis successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/variance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgetId).toBe('budget123');
      expect(response.body.data.varianceSummary).toBeDefined();
      expect(response.body.data.varianceSummary.totalVariance).toBe(-1000);
      expect(response.body.data.varianceSummary.totalVariancePercentage).toBe(-25);
      expect(response.body.data.varianceSummary.favorableVariances).toBe(1000);
      expect(response.body.data.varianceSummary.unfavorableVariances).toBe(0);
      expect(response.body.data.varianceSummary.netVariance).toBe(-1000);
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/undefined/variance')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Budget ID is required');
    });
  });

  describe('GET /api/analytics/budgets/:budgetId/forecast', () => {
    it('should get budget forecast successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/forecast')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgetId).toBe('budget123');
      expect(response.body.data.forecast).toBeDefined();
      expect(response.body.data.forecast.projectedSpending).toBe(3200);
      expect(response.body.data.forecast.projectedVariance).toBe(-800);
      expect(response.body.data.forecast.confidence).toBe('high');
      expect(response.body.data.forecast.methodology).toBe('historical');
    });

    it('should get budget forecast with custom forecast period', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/forecast')
        .query({
          forecastStartDate: '2024-03-01',
          forecastEndDate: '2024-03-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.forecastPeriod.startDate).toBe('2024-03-01T00:00:00.000Z');
      expect(response.body.data.forecastPeriod.endDate).toBe('2024-03-31T00:00:00.000Z');
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/undefined/forecast')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Budget ID is required');
    });

    it('should return 400 when forecast start date format is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/forecast')
        .query({
          forecastStartDate: 'invalid-date',
          forecastEndDate: '2024-02-29'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid forecast start date format');
    });

    it('should return 400 when forecast end date format is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/forecast')
        .query({
          forecastStartDate: '2024-02-01',
          forecastEndDate: 'invalid-date'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid forecast end date format');
    });

    it('should return 400 when forecast end date is before forecast start date', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/forecast')
        .query({
          forecastStartDate: '2024-02-29',
          forecastEndDate: '2024-02-01'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Forecast end date must be after forecast start date');
    });
  });

  describe('GET /api/analytics/budgets/:budgetId/breakdown', () => {
    it('should get budget category breakdown successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/budget123/breakdown')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.budgetId).toBe('budget123');
      expect(response.body.data.categoryBreakdown).toBeDefined();
      expect(response.body.data.spendingPatterns).toBeDefined();
      expect(response.body.data.spendingPatterns.topSpendingCategories).toBeDefined();
      expect(response.body.data.spendingPatterns.mostActiveCategories).toBeDefined();
      expect(response.body.data.spendingPatterns.categoryEfficiency).toBeDefined();
    });

    it('should return 400 when budget ID is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/undefined/breakdown')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Budget ID is required');
    });
  });

  describe('GET /api/analytics/budgets/alerts', () => {
    it('should get budget alerts successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('alert-123');
      expect(response.body.data[0].type).toBe('threshold');
      expect(response.body.data[0].severity).toBe('warning');
      expect(response.body.data[0].message).toBe('Budget utilization is at 90%');
    });

    it('should get budget alerts for specific budget', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/alerts')
        .query({ budgetId: 'specific-budget-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].budgetId).toBe('specific-budget-123');
    });
  });

  describe('GET /api/analytics/budgets/export', () => {
    it('should export budget report successfully', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'json',
          reportType: 'performance',
          includeCharts: 'false',
          includeDetails: 'true',
          budgetIds: 'budget123,budget456',
          categories: 'cat1,cat2'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('budget-report-performance');

      const exportData = JSON.parse(response.text);
      expect(exportData.exportType).toBe('performance');
      expect(exportData.format).toBe('json');
      expect(exportData.includeCharts).toBe(false);
      expect(exportData.includeDetails).toBe(true);
      expect(exportData.budgetIds).toEqual(['budget123', 'budget456']);
      expect(exportData.categories).toEqual(['cat1', 'cat2']);
    });

    it('should export budget report with default values', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(200);

      const exportData = JSON.parse(response.text);
      expect(exportData.exportType).toBe('all');
      expect(exportData.format).toBe('json');
      expect(exportData.includeCharts).toBe(false);
      expect(exportData.includeDetails).toBe(true);
    });

    it('should return 400 when start date is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          endDate: '2024-01-31',
          format: 'json',
          reportType: 'performance'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Start date and end date are required');
    });

    it('should return 400 when end date is missing', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          format: 'json',
          reportType: 'performance'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Start date and end date are required');
    });

    it('should return 400 when date format is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-31',
          format: 'json',
          reportType: 'performance'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid date format');
    });

    it('should return 400 when end date is before start date', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-31',
          endDate: '2024-01-01',
          format: 'json',
          reportType: 'performance'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('End date must be after start date');
    });

    it('should return 400 when format is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'invalid-format',
          reportType: 'performance'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid format. Must be one of: json, csv, pdf, excel');
    });

    it('should return 400 when report type is invalid', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'json',
          reportType: 'invalid-type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid report type. Must be one of: performance, variance, trend, forecast, breakdown, all');
    });

    it('should export CSV format correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'csv',
          reportType: 'performance'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('budget-report-performance');
      expect(response.headers['content-disposition']).toContain('.csv');
    });

    it('should export PDF format correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'pdf',
          reportType: 'performance'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('budget-report-performance');
      expect(response.headers['content-disposition']).toContain('.pdf');
    });

    it('should export Excel format correctly', async () => {
      const response = await request(app)
        .get('/api/analytics/budgets/export')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'excel',
          reportType: 'performance'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('budget-report-performance');
      expect(response.headers['content-disposition']).toContain('.excel');
    });
  });
});
