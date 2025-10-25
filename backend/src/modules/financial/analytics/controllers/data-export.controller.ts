import { Request, Response } from 'express';
import { DataExportService } from '../services/data-export.service';
import { logger } from '../../../../shared/services/logger.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class DataExportController {
  private dataExportService: DataExportService;

  constructor() {
    this.dataExportService = new DataExportService();
  }

  /**
   * Export all financial data
   * POST /api/analytics/export/data
   */
  exportFinancialData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        format = 'excel',
        dataTypes = ['all'],
        startDate,
        endDate,
        includeMetadata = true,
        groupBy = 'month',
        filters = {}
      } = req.body;

      // Validate required fields
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const options = {
        format,
        dataTypes,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        includeMetadata,
        groupBy,
        filters
      };

      const exportResult = await this.dataExportService.exportFinancialData(userId, options);

      // Set appropriate headers for file download
      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.setHeader('Content-Length', exportResult.size);

      res.status(200).send(exportResult.data);

      logger.info('Financial data exported via API', { 
        userId, 
        format: options.format, 
        dataTypes: options.dataTypes,
        filename: exportResult.filename,
        size: exportResult.size,
        recordCount: exportResult.recordCount
      });
    } catch (error) {
      logger.error('Error in exportFinancialData controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Export transactions only
   * POST /api/analytics/export/transactions
   */
  exportTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        format = 'excel',
        startDate,
        endDate,
        includeMetadata = true,
        filters = {}
      } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const options = {
        format,
        dataTypes: ['transactions'] as any,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        includeMetadata,
        filters
      };

      const exportResult = await this.dataExportService.exportTransactions(userId, options);

      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.setHeader('Content-Length', exportResult.size);

      res.status(200).send(exportResult.data);

      logger.info('Transactions exported via API', { userId, format: options.format, filename: exportResult.filename });
    } catch (error) {
      logger.error('Error in exportTransactions controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Export categories only
   * POST /api/analytics/export/categories
   */
  exportCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        format = 'excel',
        includeMetadata = true
      } = req.body;

      const options = {
        format,
        dataTypes: ['categories'] as any,
        startDate: new Date(),
        endDate: new Date(),
        includeMetadata
      };

      const exportResult = await this.dataExportService.exportCategories(userId, options);

      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.setHeader('Content-Length', exportResult.size);

      res.status(200).send(exportResult.data);

      logger.info('Categories exported via API', { userId, format: options.format, filename: exportResult.filename });
    } catch (error) {
      logger.error('Error in exportCategories controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Export budgets only
   * POST /api/analytics/export/budgets
   */
  exportBudgets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        format = 'excel',
        startDate,
        endDate,
        includeMetadata = true
      } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const options = {
        format,
        dataTypes: ['budgets'] as any,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        includeMetadata
      };

      const exportResult = await this.dataExportService.exportBudgets(userId, options);

      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.setHeader('Content-Length', exportResult.size);

      res.status(200).send(exportResult.data);

      logger.info('Budgets exported via API', { userId, format: options.format, filename: exportResult.filename });
    } catch (error) {
      logger.error('Error in exportBudgets controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Export analytics only
   * POST /api/analytics/export/analytics
   */
  exportAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        format = 'excel',
        startDate,
        endDate,
        includeMetadata = true,
        groupBy = 'month'
      } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const options = {
        format,
        dataTypes: ['analytics'] as any,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        includeMetadata,
        groupBy
      };

      const exportResult = await this.dataExportService.exportAnalytics(userId, options);

      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.setHeader('Content-Length', exportResult.size);

      res.status(200).send(exportResult.data);

      logger.info('Analytics exported via API', { userId, format: options.format, filename: exportResult.filename });
    } catch (error) {
      logger.error('Error in exportAnalytics controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Get export status and history
   * GET /api/analytics/export/status
   */
  getExportStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // In a real implementation, this would query the database for export history
      const exportHistory = [
        {
          id: '1',
          filename: 'financial-data-export-2024-01-15.xlsx',
          format: 'excel',
          size: 1024000,
          recordCount: 150,
          exportDate: new Date('2024-01-15T10:00:00Z'),
          status: 'completed'
        },
        {
          id: '2',
          filename: 'transactions-export-2024-01-14.csv',
          format: 'csv',
          size: 512000,
          recordCount: 75,
          exportDate: new Date('2024-01-14T15:30:00Z'),
          status: 'completed'
        }
      ];

      res.status(200).json({
        success: true,
        data: {
          exportHistory,
          totalExports: exportHistory.length,
          lastExport: exportHistory[0]?.exportDate
        },
        message: 'Export status retrieved successfully'
      });

      logger.info('Export status retrieved via API', { userId });
    } catch (error) {
      logger.error('Error in getExportStatus controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}

