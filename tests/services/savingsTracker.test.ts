import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { savingsTracker } from '../../services/savingsTracker';
import { mockTransactions } from '../testData';

// Mock the storage service
jest.mock('../../services/storage', () => ({
  storageService: {
    getTransactions: jest.fn()
  }
}));

import { storageService } from '../../services/storage';
const mockStorageService = storageService as any;

describe('SavingsTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.getTransactions.mockResolvedValue(mockTransactions);
  });

  describe('getSavingsStats', () => {
    it('should calculate total savings and missed savings correctly', async () => {
      const stats = await savingsTracker.getSavingsStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalSaved).toBeGreaterThan(0);
      expect(stats.totalMissed).toBeGreaterThan(0);
      expect(stats.monthlyStats).toBeDefined();
      expect(Array.isArray(stats.monthlyStats)).toBe(true);
    });

    it('should separate optimal vs suboptimal transactions', async () => {
      const optimalTransactions = mockTransactions.filter(t => t.cardUsed === t.recommendedCard);
      const suboptimalTransactions = mockTransactions.filter(t => t.cardUsed !== t.recommendedCard);
      
      const stats = await savingsTracker.getSavingsStats();
      
      // Calculate expected totals
      const expectedSaved = optimalTransactions.reduce((sum, t) => sum + t.potentialSavings, 0);
      const expectedMissed = suboptimalTransactions.reduce((sum, t) => sum + t.potentialSavings, 0);
      
      expect(stats.totalSaved).toBeCloseTo(expectedSaved, 2);
      expect(stats.totalMissed).toBeCloseTo(expectedMissed, 2);
    });

    it('should group transactions by month correctly', async () => {
      const stats = await savingsTracker.getSavingsStats();
      
      expect(stats.monthlyStats.length).toBeGreaterThan(0);
      
      stats.monthlyStats.forEach(monthData => {
        expect(monthData).toHaveProperty('month');
        expect(monthData).toHaveProperty('saved');
        expect(monthData).toHaveProperty('missed');
        expect(typeof monthData.month).toBe('string');
        expect(typeof monthData.saved).toBe('number');
        expect(typeof monthData.missed).toBe('number');
      });
    });

    it('should handle empty transaction data', async () => {
      mockStorageService.getTransactions.mockResolvedValue([]);
      
      const stats = await savingsTracker.getSavingsStats();
      
      expect(stats.totalSaved).toBe(0);
      expect(stats.totalMissed).toBe(0);
      expect(stats.monthlyStats).toEqual([]);
    });

    it('should sort monthly stats chronologically', async () => {
      const stats = await savingsTracker.getSavingsStats();
      
      if (stats.monthlyStats.length > 1) {
        for (let i = 1; i < stats.monthlyStats.length; i++) {
          const prev = new Date(stats.monthlyStats[i - 1].month);
          const curr = new Date(stats.monthlyStats[i].month);
          expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
        }
      }
    });
  });

  describe('getCashbackForecast', () => {
    it('should generate forecast based on historical data', async () => {
      const forecast = await savingsTracker.getCashbackForecast();
      
      expect(forecast).toBeDefined();
      expect(forecast).toHaveProperty('nextMonth');
      expect(forecast).toHaveProperty('nextQuarter');
      expect(forecast).toHaveProperty('nextYear');
      expect(forecast).toHaveProperty('confidence');
      
      expect(typeof forecast.nextMonth).toBe('number');
      expect(typeof forecast.nextQuarter).toBe('number');
      expect(typeof forecast.nextYear).toBe('number');
      expect(typeof forecast.confidence).toBe('number');
      
      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(100);
    });

    it('should provide reasonable forecasts', async () => {
      const forecast = await savingsTracker.getCashbackForecast();
      
      // Forecasts should be positive and increasing over time
      expect(forecast.nextMonth).toBeGreaterThanOrEqual(0);
      expect(forecast.nextQuarter).toBeGreaterThanOrEqual(forecast.nextMonth);
      expect(forecast.nextYear).toBeGreaterThanOrEqual(forecast.nextQuarter);
    });

    it('should handle insufficient data gracefully', async () => {
      mockStorageService.getTransactions.mockResolvedValue([mockTransactions[0]]);
      
      const forecast = await savingsTracker.getCashbackForecast();
      
      expect(forecast).toBeDefined();
      expect(forecast.confidence).toBeLessThan(100); // Should have lower confidence
    });
  });

  describe('getSpendingTrends', () => {
    it('should analyze spending patterns by category', async () => {
      const trends = await savingsTracker.getSpendingTrends();
      
      expect(trends).toBeDefined();
      expect(trends).toHaveProperty('categoryBreakdown');
      expect(trends).toHaveProperty('monthlyTrends');
      expect(trends).toHaveProperty('topCategories');
      
      expect(Array.isArray(trends.categoryBreakdown)).toBe(true);
      expect(Array.isArray(trends.monthlyTrends)).toBe(true);
      expect(Array.isArray(trends.topCategories)).toBe(true);
    });

    it('should identify top spending categories', async () => {
      const trends = await savingsTracker.getSpendingTrends();
      
      trends.topCategories.forEach(category => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('amount');
        expect(category).toHaveProperty('percentage');
        expect(typeof category.amount).toBe('number');
        expect(typeof category.percentage).toBe('number');
      });
    });

    it('should calculate category optimization rates', async () => {
      const trends = await savingsTracker.getSpendingTrends();
      
      trends.categoryBreakdown.forEach(category => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('totalSpent');
        expect(category).toHaveProperty('optimizationRate');
        expect(category.optimizationRate).toBeGreaterThanOrEqual(0);
        expect(category.optimizationRate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed transaction data', async () => {
      const malformedTransactions = [
        { ...mockTransactions[0], potentialSavings: null },
        { ...mockTransactions[1], amount: undefined },
        { ...mockTransactions[2], timestamp: 'invalid-date' }
      ];
      
      mockStorageService.getTransactions.mockResolvedValue(malformedTransactions);
      
      const stats = await savingsTracker.getSavingsStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalSaved).toBe('number');
      expect(typeof stats.totalMissed).toBe('number');
    });

    it('should handle storage service errors', async () => {
      mockStorageService.getTransactions.mockRejectedValue(new Error('Storage error'));
      
      const stats = await savingsTracker.getSavingsStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalSaved).toBe(0);
      expect(stats.totalMissed).toBe(0);
    });

    it('should validate numerical calculations', async () => {
      const stats = await savingsTracker.getSavingsStats();
      
      expect(Number.isFinite(stats.totalSaved)).toBe(true);
      expect(Number.isFinite(stats.totalMissed)).toBe(true);
      expect(stats.totalSaved).toBeGreaterThanOrEqual(0);
      expect(stats.totalMissed).toBeGreaterThanOrEqual(0);
    });
  });
});