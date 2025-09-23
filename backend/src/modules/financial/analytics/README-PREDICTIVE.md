# Predictive Analytics Module

This module provides comprehensive predictive analytics capabilities for the Personal Finance Tracker, including spending predictions, anomaly detection, financial forecasting, and trend analysis.

## 🚀 Features

### 1. Spending Prediction
- **Linear Regression**: Predicts future spending based on historical trends
- **Time Series Analysis**: Uses exponential smoothing for trend-based predictions
- **Seasonal Decomposition**: Handles seasonal patterns in spending data
- **Hybrid Models**: Combines multiple algorithms for improved accuracy

### 2. Anomaly Detection
- **Statistical Methods**: Z-score and IQR-based anomaly detection
- **Amount Anomalies**: Detects unusual transaction amounts
- **Timing Anomalies**: Identifies unusual spending patterns by time
- **Category Anomalies**: Spots unusual spending in specific categories
- **Pattern Anomalies**: Detects spending spikes and unusual sequences

### 3. Financial Forecasting
- **Income Projections**: Predicts future income based on historical data
- **Expense Forecasting**: Projects future spending patterns
- **Net Worth Predictions**: Calculates projected net worth
- **Scenario Analysis**: Provides optimistic, realistic, and pessimistic scenarios
- **Risk Assessment**: Identifies potential financial risks

### 4. Cash Flow Prediction
- **Inflow/Outflow Projections**: Predicts future cash movements
- **Monthly Projections**: Provides month-by-month cash flow forecasts
- **Category Breakdown**: Analyzes cash flow by spending categories
- **Risk Factors**: Identifies potential cash flow issues

### 5. Trend Analysis
- **Overall Trends**: Analyzes general spending direction and strength
- **Category Trends**: Tracks spending patterns by category
- **Seasonal Patterns**: Identifies recurring seasonal spending
- **Weekly/Monthly Patterns**: Analyzes spending by time periods

## 📁 File Structure

```
analytics/
├── interfaces/
│   ├── analytics.interface.ts      # Core analytics interfaces
│   └── predictive.interface.ts     # Predictive analytics interfaces
├── services/
│   ├── analytics.service.ts        # Main analytics service
│   ├── predictive-analytics.service.ts  # Main predictive service
│   ├── spending-prediction.service.ts   # Spending prediction algorithms
│   ├── anomaly-detection.service.ts     # Anomaly detection algorithms
│   ├── financial-forecasting.service.ts # Financial forecasting
│   └── trend-analysis.service.ts        # Trend analysis algorithms
├── controllers/
│   └── analytics.controller.ts     # API controllers
├── routes/
│   └── analytics.routes.ts         # API routes
└── validation/
    └── analytics.validation.ts     # Input validation schemas
```

## 🔧 API Endpoints

### Predictive Insights
```http
GET /api/analytics/predictive/insights
```
Returns comprehensive predictive insights combining all analysis types.

**Query Parameters:**
- `startDate` (optional): Start date for analysis
- `endDate` (optional): End date for analysis
- `categories` (optional): Filter by category IDs
- `confidenceThreshold` (optional): Minimum confidence level (0-1)

### Spending Prediction
```http
GET /api/analytics/predictive/spending
```
Predicts future spending patterns.

**Query Parameters:**
- `startDate` (required): Start date for prediction period
- `endDate` (required): End date for prediction period
- `categories` (optional): Filter by category IDs

### Anomaly Detection
```http
GET /api/analytics/predictive/anomalies
```
Detects unusual spending patterns and transactions.

**Query Parameters:**
- `startDate` (optional): Start date for analysis
- `endDate` (optional): End date for analysis
- `confidenceThreshold` (optional): Minimum confidence level (0-1)

### Financial Forecast
```http
GET /api/analytics/predictive/forecast
```
Provides comprehensive financial forecasting.

**Query Parameters:**
- `startDate` (required): Start date for forecast period
- `endDate` (required): End date for forecast period

### Cash Flow Prediction
```http
GET /api/analytics/predictive/cashflow
```
Predicts future cash flow patterns.

**Query Parameters:**
- `startDate` (required): Start date for prediction period
- `endDate` (required): End date for prediction period

### Trend Analysis
```http
GET /api/analytics/predictive/trends
```
Analyzes spending trends and patterns.

**Query Parameters:**
- `startDate` (optional): Start date for analysis
- `endDate` (optional): End date for analysis

### Model Training
```http
POST /api/analytics/predictive/train
```
Trains predictive models with custom parameters.

**Request Body:**
```json
{
  "modelType": "spending_prediction",
  "parameters": {
    "algorithm": "linear_regression"
  }
}
```

## 🧮 Algorithms

### Spending Prediction Algorithms

1. **Linear Regression**
   - Uses historical data to fit a linear trend
   - Best for data with clear linear patterns
   - Provides confidence scores based on R-squared

2. **Time Series (Exponential Smoothing)**
   - Applies exponential smoothing to historical data
   - Good for data with trends but no seasonality
   - Uses alpha parameter for smoothing control

3. **Seasonal Decomposition**
   - Separates trend, seasonal, and residual components
   - Ideal for data with seasonal patterns
   - Handles weekly and monthly seasonality

4. **Hybrid Model**
   - Combines multiple algorithms
   - Uses weighted averaging for predictions
   - Provides more robust results

### Anomaly Detection Algorithms

1. **Z-Score Detection**
   - Identifies values beyond 2.5 standard deviations
   - Good for normally distributed data
   - Configurable threshold

2. **IQR (Interquartile Range) Detection**
   - Uses quartiles to identify outliers
   - More robust to non-normal distributions
   - 1.5x IQR multiplier by default

3. **Pattern-Based Detection**
   - Detects consecutive high-value transactions
   - Identifies spending spikes
   - Analyzes timing patterns

### Forecasting Algorithms

1. **ARIMA (AutoRegressive Integrated Moving Average)**
   - Advanced time series forecasting
   - Handles trends and seasonality
   - Requires sufficient historical data

2. **Exponential Smoothing**
   - Simple but effective forecasting
   - Good for short-term predictions
   - Configurable smoothing parameters

3. **Linear Regression**
   - Projects trends into the future
   - Simple and interpretable
   - Good baseline method

## 📊 Data Requirements

### Minimum Data Requirements
- **Spending Prediction**: 30+ days of transaction data
- **Anomaly Detection**: 3+ transactions for basic analysis
- **Financial Forecasting**: 30+ days of historical data
- **Trend Analysis**: 14+ days of data
- **Cash Flow Prediction**: 30+ days of data

### Recommended Data Requirements
- **High Accuracy**: 90+ days of data
- **Seasonal Analysis**: 365+ days of data
- **Complex Patterns**: 180+ days of data

## 🧪 Testing

### Unit Tests
```bash
npm test -- --testPathPattern=analytics
```

### Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Manual Testing
```bash
node scripts/test-predictive-analytics.js
```

## 📈 Performance Considerations

### Algorithm Selection
- **Small Datasets (< 30 days)**: Linear regression
- **Medium Datasets (30-90 days)**: Time series analysis
- **Large Datasets (90+ days)**: Seasonal decomposition or ARIMA
- **Complex Patterns**: Hybrid models

### Caching
- Results are cached for 1 hour by default
- Cache keys include user ID and query parameters
- Invalidate cache when new transactions are added

### Memory Usage
- Services process data in chunks for large datasets
- Streaming processing for very large datasets
- Memory cleanup after processing

## 🔒 Security & Privacy

### Data Protection
- All data is user-specific and isolated
- No cross-user data sharing
- Secure data transmission

### Input Validation
- All inputs are validated and sanitized
- SQL injection prevention
- XSS protection

### Rate Limiting
- API endpoints have rate limits
- Prevents abuse and ensures fair usage
- Configurable per endpoint

## 🚀 Usage Examples

### Basic Spending Prediction
```typescript
const query = {
  userId: 'user123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  confidenceThreshold: 0.7
};

const prediction = await predictiveService.getSpendingPrediction(query);
console.log(`Predicted spending: $${prediction.totalPredictedAmount}`);
```

### Anomaly Detection
```typescript
const anomalies = await predictiveService.getAnomalyDetection(query);
anomalies.anomalies.forEach(anomaly => {
  console.log(`Anomaly: ${anomaly.description} (${anomaly.severity})`);
});
```

### Financial Forecast
```typescript
const forecast = await predictiveService.getFinancialForecast(query);
console.log(`Projected net worth: $${forecast.baseScenario.projectedNetWorth}`);
```

## 🔧 Configuration

### Environment Variables
```env
# Predictive Analytics Configuration
PREDICTIVE_CACHE_TTL=3600
PREDICTIVE_MAX_DATA_POINTS=10000
PREDICTIVE_CONFIDENCE_THRESHOLD=0.7
PREDICTIVE_ANOMALY_THRESHOLD=2.5
```

### Service Configuration
```typescript
const config = {
  cache: {
    ttl: 3600, // 1 hour
    maxSize: 1000
  },
  algorithms: {
    defaultConfidence: 0.7,
    anomalyThreshold: 2.5,
    iqrMultiplier: 1.5
  },
  limits: {
    maxDataPoints: 10000,
    maxPredictionDays: 365
  }
};
```

## 📚 Further Reading

- [Time Series Analysis Guide](https://en.wikipedia.org/wiki/Time_series)
- [Anomaly Detection Techniques](https://en.wikipedia.org/wiki/Anomaly_detection)
- [Machine Learning for Finance](https://en.wikipedia.org/wiki/Financial_modeling)
- [Statistical Forecasting Methods](https://en.wikipedia.org/wiki/Forecasting)

## 🤝 Contributing

1. Follow the existing code style
2. Add comprehensive tests for new features
3. Update documentation
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This module is part of the Personal Finance Tracker project and follows the same license terms.
