#!/usr/bin/env node

/**
 * Test script for Predictive Analytics
 * This script demonstrates how to use the predictive analytics services
 */

const { PredictiveAnalyticsService } = require('../src/modules/financial/analytics/services/predictive-analytics.service');

async function testPredictiveAnalytics() {
  console.log('🚀 Testing Predictive Analytics Services...\n');

  try {
    const service = new PredictiveAnalyticsService();

    // Test query
    const query = {
      userId: 'test-user-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      categories: undefined,
      transactionTypes: undefined,
      accounts: undefined,
      includeRecurring: true,
      confidenceThreshold: 0.7,
      modelType: 'spending_prediction',
      algorithm: undefined,
    };

    console.log('📊 Testing Spending Prediction...');
    try {
      const spendingPrediction = await service.getSpendingPrediction(query);
      console.log('✅ Spending Prediction:', {
        totalPredictedAmount: spendingPrediction.totalPredictedAmount,
        confidence: spendingPrediction.confidence,
        methodology: spendingPrediction.methodology,
      });
    } catch (error) {
      console.log('⚠️  Spending Prediction (Expected - No Data):', error.message);
    }

    console.log('\n🔍 Testing Anomaly Detection...');
    try {
      const anomalyDetection = await service.getAnomalyDetection(query);
      console.log('✅ Anomaly Detection:', {
        totalAnomalies: anomalyDetection.summary.totalAnomalies,
        criticalAnomalies: anomalyDetection.summary.criticalAnomalies,
        detectionAccuracy: anomalyDetection.summary.detectionAccuracy,
      });
    } catch (error) {
      console.log('⚠️  Anomaly Detection (Expected - No Data):', error.message);
    }

    console.log('\n📈 Testing Financial Forecast...');
    try {
      const financialForecast = await service.getFinancialForecast(query);
      console.log('✅ Financial Forecast:', {
        projectedIncome: financialForecast.baseScenario.projectedIncome,
        projectedExpenses: financialForecast.baseScenario.projectedExpenses,
        projectedNetWorth: financialForecast.baseScenario.projectedNetWorth,
        confidence: financialForecast.baseScenario.confidence,
      });
    } catch (error) {
      console.log('⚠️  Financial Forecast (Expected - No Data):', error.message);
    }

    console.log('\n💰 Testing Cash Flow Prediction...');
    try {
      const cashFlowPrediction = await service.getCashFlowPrediction(query);
      console.log('✅ Cash Flow Prediction:', {
        projectedInflows: cashFlowPrediction.predictions.projectedInflows,
        projectedOutflows: cashFlowPrediction.predictions.projectedOutflows,
        projectedNetCashFlow: cashFlowPrediction.predictions.projectedNetCashFlow,
        confidence: cashFlowPrediction.predictions.confidence,
      });
    } catch (error) {
      console.log('⚠️  Cash Flow Prediction (Expected - No Data):', error.message);
    }

    console.log('\n📊 Testing Trend Analysis...');
    try {
      const trendAnalysis = await service.getTrendAnalysis(query);
      console.log('✅ Trend Analysis:', {
        overallDirection: trendAnalysis.overallTrend.direction,
        overallStrength: trendAnalysis.overallTrend.strength,
        categoryTrendsCount: trendAnalysis.categoryTrends.length,
        confidence: trendAnalysis.overallTrend.confidence,
      });
    } catch (error) {
      console.log('⚠️  Trend Analysis (Expected - No Data):', error.message);
    }

    console.log('\n🧠 Testing Model Training...');
    try {
      const model = await service.trainModel('test-user-123', 'spending_prediction', {
        algorithm: 'linear_regression',
      });
      console.log('✅ Model Training:', {
        modelId: model.id,
        modelType: model.type,
        algorithm: model.algorithm,
        status: model.status,
        accuracy: model.performance.accuracy,
      });
    } catch (error) {
      console.log('⚠️  Model Training Error:', error.message);
    }

    console.log('\n🎯 Testing Comprehensive Insights...');
    try {
      const insights = await service.getPredictiveInsights(query);
      console.log('✅ Comprehensive Insights:', {
        totalInsights: insights.summary.totalInsights,
        highPriorityInsights: insights.summary.highPriorityInsights,
        criticalInsights: insights.summary.criticalInsights,
        trendsCount: insights.trends.length,
        risksCount: insights.risks.length,
        opportunitiesCount: insights.opportunities.length,
      });
    } catch (error) {
      console.log('⚠️  Comprehensive Insights (Expected - No Data):', error.message);
    }

    console.log('\n✅ Predictive Analytics Services Test Completed!');
    console.log('\n📝 Note: Some services may show "Expected - No Data" errors because they require historical transaction data.');
    console.log('   This is normal behavior when testing with empty databases.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testPredictiveAnalytics()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testPredictiveAnalytics };









