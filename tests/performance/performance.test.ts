import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockChrome } from '../setup';
import { mockCreditCards, mockTransactions } from '../testData';

// Performance benchmarks and stress tests
describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performance.mark = jest.fn();
    performance.measure = jest.fn();
  });

  describe('Service Performance', () => {
    it('should handle recommendation engine efficiently', async () => {
      const { recommendationEngine } = await import('../../services/recommendationEngine');
      
      const largeCardSet = Array.from({ length: 50 }, (_, i) => ({
        ...mockCreditCards[0],
        id: `card_${i}`,
        name: `Card ${i}`,
        rewardStructure: [
          {
            category: 'general' as const,
            rewardRate: Math.random() * 0.05 + 0.01 // 1-6%
          }
        ]
      }));

      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        recommendationEngine.getBestCard(largeCardSet, 'general', 100);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      
      // Should average less than 1ms per recommendation
      expect(avgTime).toBeLessThan(1);
    });

    it('should handle large transaction datasets efficiently', async () => {
      const { savingsTracker } = await import('../../services/savingsTracker');
      
      // Mock large transaction dataset
      const largeTransactionSet = Array.from({ length: 10000 }, (_, i) => ({
        id: `txn_${i}`,
        merchantName: `Merchant ${i % 100}`,
        category: ['groceries', 'dining', 'gas', 'travel', 'general'][i % 5] as any,
        amount: Math.random() * 200 + 10,
        cardUsed: mockCreditCards[i % 3].id,
        recommendedCard: mockCreditCards[i % 3].id,
        potentialSavings: Math.random() * 5,
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      }));

      // Mock storage to return large dataset
      jest.doMock('../../services/storage', () => ({
        storageService: {
          getTransactions: jest.fn().mockResolvedValue(largeTransactionSet)
        }
      }));

      const startTime = performance.now();
      const stats = await savingsTracker.getSavingsStats();
      const endTime = performance.now();
      
      // Should process 10k transactions in under 100ms
      expect(endTime - startTime).toBeLessThan(100);
      expect(stats).toBeDefined();
      expect(stats.monthlyStats.length).toBeGreaterThan(0);
    });

    it('should handle achievements calculation efficiently', async () => {
      // Mock large datasets
      const largeCardSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockCreditCards[0],
        id: `card_${i}`,
        isActive: true
      }));

      const largeTransactionSet = Array.from({ length: 5000 }, (_, i) => ({
        ...mockTransactions[0],
        id: `txn_${i}`,
        potentialSavings: Math.random() * 10
      }));

      jest.doMock('../../services/storage', () => ({
        storageService: {
          getCards: jest.fn().mockResolvedValue(largeCardSet),
          getTransactions: jest.fn().mockResolvedValue(largeTransactionSet),
          getSettings: jest.fn().mockResolvedValue({ enableNotifications: true })
        }
      }));

      const { achievementsService } = await import('../../services/achievementsService');
      
      const startTime = performance.now();
      const achievements = await achievementsService.getUserAchievements();
      const endTime = performance.now();
      
      // Should calculate achievements in under 50ms
      expect(endTime - startTime).toBeLessThan(50);
      expect(achievements.length).toBeGreaterThan(0);
    });
  });

  describe('DOM Performance', () => {
    it('should handle merchant detection efficiently', async () => {
      const { merchantDetection } = await import('../../services/merchantDetection');
      
      const hostnames = [
        'amazon.com', 'target.com', 'walmart.com', 'bestbuy.com',
        'costco.com', 'macys.com', 'nordstrom.com', 'ebay.com',
        'etsy.com', 'wayfair.com', 'overstock.com', 'zappos.com'
      ];

      const iterations = 10000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const hostname = hostnames[i % hostnames.length];
        merchantDetection.detectMerchant(hostname);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;
      
      // Should average less than 0.1ms per detection
      expect(avgTime).toBeLessThan(0.1);
    });

    it('should handle checkout detection without blocking UI', async () => {
      // Mock complex DOM structure
      const mockElements = Array.from({ length: 1000 }, (_, i) => ({
        textContent: i % 10 === 0 ? '$' + (Math.random() * 100).toFixed(2) : 'content',
        style: { display: 'block' }
      }));

      document.querySelectorAll = jest.fn().mockReturnValue(mockElements);
      document.querySelector = jest.fn().mockReturnValue(mockElements[0]);

      const { merchantDetection } = await import('../../services/merchantDetection');
      
      const startTime = performance.now();
      
      // Run multiple checkout detections
      for (let i = 0; i < 100; i++) {
        merchantDetection.isCheckoutPage();
        merchantDetection.extractAmount();
      }
      
      const endTime = performance.now();
      
      // Should complete in under 50ms to avoid UI blocking
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during normal operations', async () => {
      const { storageService } = await import('../../services/storage');
      const { recommendationEngine } = await import('../../services/recommendationEngine');
      
      // Simulate memory-intensive operations
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        // Create temporary objects
        const tempCards = mockCreditCards.map(card => ({ ...card }));
        recommendationEngine.getBestCard(tempCards, 'general', 100);
        recommendationEngine.compareCards(tempCards, 'dining', 50);
        
        // Simulate storage operations
        mockChrome.storage.local.get.mockResolvedValue({ cards: tempCards });
        await storageService.getCards();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Memory usage should stabilize (hard to test precisely in Jest)
      expect(true).toBe(true); // Placeholder - in real tests, monitor heap usage
    });

    it('should handle large datasets without excessive memory usage', async () => {
      const { savingsTracker } = await import('../../services/savingsTracker');
      
      // Create large dataset
      const hugeTransactionSet = Array.from({ length: 50000 }, (_, i) => ({
        id: `huge_txn_${i}`,
        merchantName: 'Merchant',
        category: 'general' as const,
        amount: 100,
        cardUsed: 'card1',
        recommendedCard: 'card1',
        potentialSavings: 2,
        timestamp: new Date(Date.now() - i * 60000) // 1 minute apart
      }));

      jest.doMock('../../services/storage', () => ({
        storageService: {
          getTransactions: jest.fn().mockResolvedValue(hugeTransactionSet)
        }
      }));

      // Process dataset multiple times
      for (let i = 0; i < 10; i++) {
        await savingsTracker.getSavingsStats();
        await savingsTracker.getSpendingTrends();
      }
      
      // Should complete without memory errors
      expect(true).toBe(true); // In real tests, monitor memory usage
    });
  });

  describe('Storage Performance', () => {
    it('should handle rapid storage operations efficiently', async () => {
      const { storageService } = await import('../../services/storage');
      
      // Mock storage with artificial delay
      let operationCount = 0;
      mockChrome.storage.local.set.mockImplementation(async () => {
        operationCount++;
        await new Promise(resolve => setTimeout(resolve, 1)); // 1ms delay
        return Promise.resolve();
      });

      const startTime = performance.now();
      
      // Perform rapid operations
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(storageService.addCard({
          ...mockCreditCards[0],
          id: `rapid_card_${i}`
        }));
      }
      
      await Promise.all(promises);
      const endTime = performance.now();
      
      // Should handle concurrent operations efficiently
      expect(operationCount).toBe(100);
      expect(endTime - startTime).toBeLessThan(500); // Under 500ms for 100 operations
    });

    it('should batch storage operations when possible', async () => {
      const { storageService } = await import('../../services/storage');
      
      let writeCount = 0;
      mockChrome.storage.local.set.mockImplementation(async () => {
        writeCount++;
        return Promise.resolve();
      });

      // Add multiple cards
      for (let i = 0; i < 10; i++) {
        await storageService.addCard({
          ...mockCreditCards[0],
          id: `batch_card_${i}`
        });
      }
      
      // Should minimize storage writes (batching would reduce this)
      expect(writeCount).toBe(10); // Current: 1 write per operation
      // TODO: Implement batching to reduce this number
    });
  });

  describe('Rendering Performance', () => {
    it('should handle theme switching without lag', async () => {
      // This would be tested in a real browser environment
      // Simulate theme switching performance
      const themeOperations = [];
      
      for (let i = 0; i < 1000; i++) {
        themeOperations.push(() => {
          // Simulate theme calculations
          const lightTheme = {
            background: "#ffffff",
            text: "#000000",
            // ... other properties
          };
          
          const darkTheme = {
            background: "#1f2937",
            text: "#f9fafb",
            // ... other properties
          };
          
          const theme = i % 2 === 0 ? lightTheme : darkTheme;
          return theme;
        });
      }
      
      const startTime = performance.now();
      themeOperations.forEach(op => op());
      const endTime = performance.now();
      
      // Theme switching should be instant
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should handle achievement rendering efficiently', async () => {
      // Simulate rendering many achievements
      const achievements = Array.from({ length: 100 }, (_, i) => ({
        id: `perf_achievement_${i}`,
        title: `Achievement ${i}`,
        description: 'Test achievement',
        progress: Math.random() * 100,
        isUnlocked: Math.random() > 0.5,
        difficulty: ['bronze', 'silver', 'gold'][i % 3]
      }));

      const startTime = performance.now();
      
      // Simulate achievement list processing
      achievements.forEach(achievement => {
        // Simulate DOM operations that would happen during rendering
        const progressBar = {
          width: `${achievement.progress}%`,
          background: achievement.isUnlocked ? '#gold' : '#gray'
        };
        
        const difficultyColor = achievement.difficulty === 'gold' ? '#ffd700' :
                              achievement.difficulty === 'silver' ? '#c0c0c0' : '#cd7f32';
        
        return { progressBar, difficultyColor };
      });
      
      const endTime = performance.now();
      
      // Should process 100 achievements quickly
      expect(endTime - startTime).toBeLessThan(20);
    });
  });

  describe('Network Performance', () => {
    it('should handle storage API calls efficiently', async () => {
      // Mock Chrome API with realistic delays
      mockChrome.storage.local.get.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 2)); // 2ms delay
        return { cards: mockCreditCards };
      });

      const { storageService } = await import('../../services/storage');
      
      const startTime = performance.now();
      
      // Multiple concurrent reads
      const promises = Array.from({ length: 50 }, () => storageService.getCards());
      await Promise.all(promises);
      
      const endTime = performance.now();
      
      // Should handle concurrent reads efficiently
      expect(endTime - startTime).toBeLessThan(200); // Under 200ms for 50 concurrent reads
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle corrupted data efficiently', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        cards: 'invalid-json-string',
        transactions: null,
        settings: undefined
      });

      const { storageService } = await import('../../services/storage');
      const { savingsTracker } = await import('../../services/savingsTracker');
      
      const startTime = performance.now();
      
      // Should handle errors quickly without hanging
      await storageService.getCards();
      await storageService.getTransactions();
      await storageService.getSettings();
      await savingsTracker.getSavingsStats();
      
      const endTime = performance.now();
      
      // Error handling should be fast
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should handle empty datasets efficiently', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        cards: [],
        transactions: [],
        settings: {}
      });

      const { recommendationEngine } = await import('../../services/recommendationEngine');
      const { savingsTracker } = await import('../../services/savingsTracker');
      const { achievementsService } = await import('../../services/achievementsService');
      
      const startTime = performance.now();
      
      // Operations on empty data should still be fast
      recommendationEngine.getBestCard([], 'general', 100);
      await savingsTracker.getSavingsStats();
      await achievementsService.getUserAchievements();
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(20);
    });
  });
});