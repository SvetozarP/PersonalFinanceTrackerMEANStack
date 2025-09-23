import { Request, Response } from 'express';
import { databaseOptimizationService } from '../services/database-optimization.service';
import { logger } from '../services/logger.service';

/**
 * Database Optimization Controller
 * Provides endpoints for database optimization and performance monitoring
 */
export class OptimizationController {
  /**
   * Get database health report
   */
  async getHealthReport(req: Request, res: Response): Promise<void> {
    try {
      const healthReport = await databaseOptimizationService.getDatabaseHealthReport();
      
      res.status(200).json({
        success: true,
        data: healthReport,
        message: 'Database health report retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting database health report', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve database health report',
        error: String(error)
      });
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = databaseOptimizationService.getPerformanceMetrics();
      
      res.status(200).json({
        success: true,
        data: metrics,
        message: 'Performance metrics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting performance metrics', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: String(error)
      });
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQueryPerformance(req: Request, res: Response): Promise<void> {
    try {
      const { query, collection } = req.body;

      if (!query || !collection) {
        res.status(400).json({
          success: false,
          message: 'Query and collection are required'
        });
        return;
      }

      const analysis = await databaseOptimizationService.analyzeQueryPerformance(query, collection);
      
      res.status(200).json({
        success: true,
        data: analysis,
        message: 'Query performance analysis completed'
      });
    } catch (error) {
      logger.error('Error analyzing query performance', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to analyze query performance',
        error: String(error)
      });
    }
  }

  /**
   * Analyze query execution plan
   */
  async analyzeQueryExecutionPlan(req: Request, res: Response): Promise<void> {
    try {
      const { query, collection } = req.body;

      if (!query || !collection) {
        res.status(400).json({
          success: false,
          message: 'Query and collection are required'
        });
        return;
      }

      const analysis = await databaseOptimizationService.analyzeQueryExecutionPlan(query, collection);
      
      res.status(200).json({
        success: true,
        data: analysis,
        message: 'Query execution plan analysis completed'
      });
    } catch (error) {
      logger.error('Error analyzing query execution plan', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to analyze query execution plan',
        error: String(error)
      });
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await databaseOptimizationService.getIndexUsageStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Index usage statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting index usage statistics', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve index usage statistics',
        error: String(error)
      });
    }
  }

  /**
   * Validate critical indexes
   */
  async validateCriticalIndexes(req: Request, res: Response): Promise<void> {
    try {
      const validation = await databaseOptimizationService.validateCriticalIndexes();
      
      res.status(200).json({
        success: true,
        data: validation,
        message: 'Critical indexes validation completed'
      });
    } catch (error) {
      logger.error('Error validating critical indexes', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to validate critical indexes',
        error: String(error)
      });
    }
  }

  /**
   * Create missing indexes
   */
  async createMissingIndexes(req: Request, res: Response): Promise<void> {
    try {
      const { missingIndexes } = req.body;

      if (!missingIndexes || !Array.isArray(missingIndexes)) {
        res.status(400).json({
          success: false,
          message: 'Missing indexes array is required'
        });
        return;
      }

      await databaseOptimizationService.createMissingIndexes(missingIndexes);
      
      res.status(200).json({
        success: true,
        message: 'Missing indexes created successfully'
      });
    } catch (error) {
      logger.error('Error creating missing indexes', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to create missing indexes',
        error: String(error)
      });
    }
  }

  /**
   * Optimize database performance
   */
  async optimizePerformance(req: Request, res: Response): Promise<void> {
    try {
      await databaseOptimizationService.optimizePerformance();
      
      res.status(200).json({
        success: true,
        message: 'Database performance optimization completed'
      });
    } catch (error) {
      logger.error('Error optimizing database performance', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to optimize database performance',
        error: String(error)
      });
    }
  }

  /**
   * Optimize connection pooling
   */
  async optimizeConnectionPooling(req: Request, res: Response): Promise<void> {
    try {
      await databaseOptimizationService.optimizeConnectionPooling();
      
      res.status(200).json({
        success: true,
        message: 'Connection pooling optimization completed'
      });
    } catch (error) {
      logger.error('Error optimizing connection pooling', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to optimize connection pooling',
        error: String(error)
      });
    }
  }


  /**
   * Get database metrics
   */
  async getDatabaseMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await databaseOptimizationService.getDatabaseMetrics();
      
      res.status(200).json({
        success: true,
        data: metrics,
        message: 'Database metrics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting database metrics', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve database metrics',
        error: String(error)
      });
    }
  }

  /**
   * Run comprehensive optimization
   */
  async runComprehensiveOptimization(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Starting comprehensive database optimization...');

      // 1. Validate critical indexes
      const validation = await databaseOptimizationService.validateCriticalIndexes();
      if (!validation.valid) {
        await databaseOptimizationService.createMissingIndexes(validation.missing);
      }

      // 2. Optimize performance
      await databaseOptimizationService.optimizePerformance();

      // 3. Optimize connection pooling
      await databaseOptimizationService.optimizeConnectionPooling();

      // 4. Get final health report
      const healthReport = await databaseOptimizationService.getDatabaseHealthReport();

      logger.info('Comprehensive database optimization completed', {
        healthScore: healthReport.healthScore
      });

      res.status(200).json({
        success: true,
        data: {
          healthReport,
          optimizationSteps: [
            'Critical indexes validated and created',
            'Database performance optimized',
            'Connection pooling optimized',
            'Health report generated'
          ]
        },
        message: 'Comprehensive database optimization completed successfully'
      });
    } catch (error) {
      logger.error('Error running comprehensive optimization', { error: String(error) });
      res.status(500).json({
        success: false,
        message: 'Failed to run comprehensive optimization',
        error: String(error)
      });
    }
  }
}

export const optimizationController = new OptimizationController();
