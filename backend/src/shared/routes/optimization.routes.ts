import { Router } from 'express';
import { optimizationController } from '../controllers/optimization.controller';
import { authenticateToken } from '../../modules/auth/auth.middleware';

const router = Router();

// Apply authentication middleware to all optimization routes
router.use(authenticateToken);

/**
 * @route GET /api/optimization/health
 * @desc Get database health report
 * @access Private
 */
router.get('/health', optimizationController.getHealthReport);

/**
 * @route GET /api/optimization/metrics
 * @desc Get performance metrics
 * @access Private
 */
router.get('/metrics', optimizationController.getPerformanceMetrics);

/**
 * @route POST /api/optimization/analyze-query
 * @desc Analyze query performance
 * @access Private
 */
router.post('/analyze-query', optimizationController.analyzeQueryPerformance);

/**
 * @route POST /api/optimization/analyze-execution-plan
 * @desc Analyze query execution plan
 * @access Private
 */
router.post('/analyze-execution-plan', optimizationController.analyzeQueryExecutionPlan);

/**
 * @route GET /api/optimization/index-stats
 * @desc Get index usage statistics
 * @access Private
 */
router.get('/index-stats', optimizationController.getIndexUsageStats);

/**
 * @route GET /api/optimization/validate-indexes
 * @desc Validate critical indexes
 * @access Private
 */
router.get('/validate-indexes', optimizationController.validateCriticalIndexes);

/**
 * @route POST /api/optimization/create-indexes
 * @desc Create missing indexes
 * @access Private
 */
router.post('/create-indexes', optimizationController.createMissingIndexes);

/**
 * @route POST /api/optimization/optimize
 * @desc Optimize database performance
 * @access Private
 */
router.post('/optimize', optimizationController.optimizePerformance);

/**
 * @route POST /api/optimization/optimize-connections
 * @desc Optimize connection pooling
 * @access Private
 */
router.post('/optimize-connections', optimizationController.optimizeConnectionPooling);


/**
 * @route GET /api/optimization/database-metrics
 * @desc Get database metrics
 * @access Private
 */
router.get('/database-metrics', optimizationController.getDatabaseMetrics);

/**
 * @route POST /api/optimization/comprehensive
 * @desc Run comprehensive optimization
 * @access Private
 */
router.post('/comprehensive', optimizationController.runComprehensiveOptimization);

export default router;


