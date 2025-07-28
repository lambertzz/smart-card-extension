# SmartCard Extension Test Suite

This comprehensive test suite validates all features of the SmartCard Extension across different websites and scenarios.

## 📋 Test Coverage

### 🏗️ Unit Tests (`/services/`)
- **Storage Service**: Card/transaction storage, settings management
- **Recommendation Engine**: Card optimization algorithms, reward calculations
- **Achievements Service**: Achievement progress, point calculations
- **Merchant Detection**: Website recognition, category classification
- **Savings Tracker**: Statistics calculation, trend analysis

### 🖥️ Integration Tests (`/popup/`)
- **Tab Navigation**: Cards, Savings, Achievements, Settings
- **Card Management**: Add/delete cards, form validation
- **Theme System**: Light/dark mode switching
- **Data Flow**: Service integration, state management

### 🌐 E2E Tests (`/e2e/`)
- **Cross-Website Testing**: 60+ supported merchants
- **Checkout Detection**: Amazon, Target, Walmart, Netflix, etc.
- **Amount Extraction**: Multiple price formats and currencies
- **Edge Cases**: Subdomains, international sites, dynamic content

### 🔄 Full Workflow Tests (`/integration/`)
- **Complete User Journey**: Setup → Shopping → Tracking
- **Multi-Card Scenarios**: Optimal vs suboptimal usage
- **Real Website Simulation**: All test scenarios
- **Data Integrity**: Error recovery, consistency

### ⚡ Performance Tests (`/performance/`)
- **Service Benchmarks**: Recommendation speed, large datasets
- **DOM Operations**: Merchant detection efficiency
- **Memory Management**: Leak detection, garbage collection
- **Storage Performance**: Concurrent operations, batching

## 🚀 Running Tests

### Run All Tests
```bash
./tests/runAllTests.sh
```

### Run Specific Test Suites
```bash
# Unit tests only
npx jest tests/services/

# Integration tests only  
npx jest tests/popup/

# E2E tests only
npx jest tests/e2e/

# Performance tests only
npx jest tests/performance/

# Full workflow tests only
npx jest tests/integration/
```

### Run with Coverage
```bash
npx jest --coverage
```

### Watch Mode (Development)
```bash
npx jest --watch
```

## 📊 Test Reports

After running tests, reports are generated in:

- `test-reports/combined-coverage/` - Overall coverage
- `test-reports/unit-coverage/` - Service unit test coverage  
- `test-reports/popup-coverage/` - UI integration coverage
- `test-reports/test-summary.md` - Complete test summary

## 🎯 Test Scenarios

### Supported Merchants (60+)
The test suite validates the extension across major merchant categories:

**E-commerce**: Amazon, eBay, Etsy, Wayfair, Overstock
**Grocery**: Whole Foods, Safeway, Kroger, Albertsons, Publix
**Dining**: McDonald's, Starbucks, Chipotle, Subway, Domino's
**Department Stores**: Target, Walmart, Macy's, Nordstrom, Kohl's
**Electronics**: Best Buy, Apple, Microsoft, Newegg, B&H
**Gas Stations**: Shell, Chevron, Exxon, BP, Mobil
**Streaming**: Netflix, Disney+, Hulu, Amazon Prime, Spotify
**Travel**: Expedia, Booking.com, Southwest, Delta, Uber

### Card Types Tested
- **Category Bonus Cards**: 5% groceries, 4% dining, 3% gas
- **Flat Rate Cards**: 2% everything, 1.5% all purchases
- **Rotating Categories**: Quarterly activation bonuses
- **Spending Caps**: Monthly/quarterly/yearly limits
- **Inactive Cards**: Expired or deactivated cards

### User Workflows
1. **First-Time Setup**: Add first card, unlock first achievements
2. **Multi-Card Optimization**: Compare recommendations across cards
3. **Checkout Detection**: Real-time recommendations during shopping
4. **Savings Tracking**: Historical analysis and forecasting
5. **Achievement System**: Progress tracking and point rewards
6. **Settings Management**: Theme switching, notification preferences

### Error Scenarios
- Corrupted storage data recovery
- Network failures during API calls
- Malformed DOM structures
- Missing merchant data
- Invalid transaction records

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- React Testing Library integration
- jsdom environment for DOM testing
- Coverage thresholds (80% minimum)
- Custom module mapping for imports

### Mock Setup (`/setup.ts`)
- Chrome extension API mocking
- Storage service simulation
- DOM method stubbing
- Console output suppression

### Test Data (`/testData.ts`)
- Mock credit cards with realistic reward structures
- Sample transactions across categories
- Test scenarios for all supported merchants
- Edge case data sets

## 📈 Performance Benchmarks

The test suite validates performance across key metrics:

- **Recommendation Speed**: < 1ms per recommendation
- **Large Dataset Processing**: 10k transactions in < 100ms
- **Achievement Calculation**: < 50ms for 100 cards, 5k transactions
- **Merchant Detection**: < 0.1ms per hostname lookup
- **DOM Operations**: < 50ms for complex checkout detection
- **Storage Operations**: < 500ms for 100 concurrent writes

## 🛡️ Security Testing

Security validations include:
- Input sanitization (XSS prevention)
- Sensitive data protection (no credit card exposure)
- Storage encryption verification
- DOM injection attack prevention
- Safe merchant data handling

## 🐛 Debugging Tests

### Enable Verbose Output
```bash
npx jest --verbose
```

### Debug Specific Test
```bash
npx jest --testNamePattern="specific test name" --verbose
```

### Watch for Changes
```bash
npx jest --watch --testPathPattern="path/to/test"
```

### Coverage Analysis
```bash
npx jest --coverage --coverageReporters=html
# View: coverage/lcov-report/index.html
```

## 📝 Writing New Tests

### Unit Test Template
```typescript
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { serviceToTest } from '../../services/serviceToTest';
import { mockChrome } from '../setup';

describe('ServiceToTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle expected scenario', async () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = await serviceToTest.method(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe('expected value');
  });
});
```

### E2E Test Template
```typescript
import { testScenarios } from '../testData';

describe('E2E Feature Tests', () => {
  testScenarios.forEach(scenario => {
    it(`should handle ${scenario.name}`, async () => {
      // Setup test environment
      mockDOM.setLocation(scenario.url);
      
      // Test the feature
      const result = await featureUnderTest(scenario);
      
      // Validate results
      expect(result).toMatchScenario(scenario);
    });
  });
});
```

## 🎯 Test Quality Guidelines

1. **Descriptive Names**: Test names should clearly describe the scenario
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and validation
3. **Mock Isolation**: Each test should be independent with proper mocking
4. **Edge Cases**: Include both happy path and error scenarios
5. **Performance**: Include timing assertions for critical paths
6. **Realistic Data**: Use representative test data that mirrors real usage

## 📞 Support

For test-related issues:
1. Check existing test output in `test-reports/`
2. Run specific failing test with `--verbose` flag
3. Verify mock setup matches expected service behavior
4. Check that test data represents realistic scenarios

The test suite is designed to catch regressions and ensure reliability across all supported websites and features.