import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockChrome } from '../setup';
import { mockCreditCards, mockTransactions, testScenarios } from '../testData';

// Integration test that simulates the full user workflow
describe('Full Workflow Integration Tests', () => {
  let mockStorage: Map<string, any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = new Map();
    
    // Mock Chrome storage with in-memory implementation
    mockChrome.storage.local.get.mockImplementation((key: string) => {
      return Promise.resolve({ [key]: mockStorage.get(key) || [] });
    });
    
    mockChrome.storage.local.set.mockImplementation((data: any) => {
      Object.entries(data).forEach(([key, value]) => {
        mockStorage.set(key, value);
      });
      return Promise.resolve();
    });
  });

  describe('Complete user journey', () => {
    it('should handle end-to-end workflow: setup → shopping → savings tracking', async () => {
      // Step 1: User adds their first credit card
      const { storageService } = await import('../../services/storage');
      
      await storageService.addCard(mockCreditCards[0]);
      
      let cards = await storageService.getCards();
      expect(cards).toHaveLength(1);
      expect(cards[0].name).toBe('Chase Freedom Flex');

      // Step 2: User adds more cards
      await storageService.addCard(mockCreditCards[1]);
      await storageService.addCard(mockCreditCards[2]);
      
      cards = await storageService.getCards();
      expect(cards).toHaveLength(3);

      // Step 3: Simulate shopping transactions
      const { recommendationEngine } = await import('../../services/recommendationEngine');
      
      // Grocery shopping - should recommend Chase Freedom Flex (5% groceries)
      const groceryRecommendation = recommendationEngine.getBestCard(cards, 'groceries', 100);
      expect(groceryRecommendation?.card.name).toBe('Chase Freedom Flex');
      
      // Record the transaction
      const groceryTransaction = {
        id: 'txn_grocery_1',
        merchantName: 'Whole Foods',
        category: 'groceries' as const,
        amount: 100,
        cardUsed: groceryRecommendation!.card.id,
        recommendedCard: groceryRecommendation!.card.id,
        potentialSavings: groceryRecommendation!.rewardAmount,
        timestamp: new Date()
      };
      
      await storageService.addTransaction(groceryTransaction);

      // Dining transaction - should recommend Capital One Savor (4% dining)
      const diningRecommendation = recommendationEngine.getBestCard(cards, 'dining', 50);
      expect(diningRecommendation?.card.name).toBe('Capital One Savor');
      
      const diningTransaction = {
        id: 'txn_dining_1',
        merchantName: 'Restaurant',
        category: 'dining' as const,
        amount: 50,
        cardUsed: diningRecommendation!.card.id,
        recommendedCard: diningRecommendation!.card.id,
        potentialSavings: diningRecommendation!.rewardAmount,
        timestamp: new Date()
      };
      
      await storageService.addTransaction(diningTransaction);

      // Step 4: Check savings tracking
      const { savingsTracker } = await import('../../services/savingsTracker');
      
      const savingsStats = await savingsTracker.getSavingsStats();
      expect(savingsStats.totalSaved).toBeGreaterThan(0);
      expect(savingsStats.totalMissed).toBe(0); // Used optimal cards

      // Step 5: Check achievements
      const { achievementsService } = await import('../../services/achievementsService');
      
      const achievements = await achievementsService.getUserAchievements();
      const firstCardAchievement = achievements.find(a => a.id === 'first_card');
      expect(firstCardAchievement?.isUnlocked).toBe(true);
      
      const firstSaveAchievement = achievements.find(a => a.id === 'first_save');
      expect(firstSaveAchievement?.isUnlocked).toBe(true);

      // Step 6: Check total points
      const totalPoints = await achievementsService.getTotalPoints();
      expect(totalPoints).toBeGreaterThan(0);
    });

    it('should handle suboptimal card usage and track missed savings', async () => {
      // Setup cards
      const { storageService } = await import('../../services/storage');
      
      await storageService.addCard(mockCreditCards[0]); // Chase Freedom Flex
      await storageService.addCard(mockCreditCards[1]); // Citi Double Cash
      
      const cards = await storageService.getCards();

      // Simulate user using suboptimal card
      const { recommendationEngine } = await import('../../services/recommendationEngine');
      
      const recommendation = recommendationEngine.getBestCard(cards, 'groceries', 100);
      expect(recommendation?.card.name).toBe('Chase Freedom Flex'); // 5% groceries
      
      // But user uses Citi Double Cash instead (2% general)
      const suboptimalTransaction = {
        id: 'txn_suboptimal',
        merchantName: 'Safeway',
        category: 'groceries' as const,
        amount: 100,
        cardUsed: mockCreditCards[1].id, // Citi Double Cash
        recommendedCard: mockCreditCards[0].id, // Chase Freedom Flex
        potentialSavings: 3.00, // 5% - 2% = 3% on $100
        timestamp: new Date()
      };
      
      await storageService.addTransaction(suboptimalTransaction);

      // Check that missed savings are tracked
      const { savingsTracker } = await import('../../services/savingsTracker');
      
      const savingsStats = await savingsTracker.getSavingsStats();
      expect(savingsStats.totalSaved).toBe(0);
      expect(savingsStats.totalMissed).toBe(3.00);
    });
  });

  describe('Real website simulation', () => {
    testScenarios.forEach(scenario => {
      it(`should handle complete workflow for ${scenario.name}`, async () => {
        // Setup extension with cards
        const { storageService } = await import('../../services/storage');
        
        for (const card of mockCreditCards.filter(c => c.isActive)) {
          await storageService.addCard(card);
        }

        // Simulate merchant detection
        const { merchantDetection } = await import('../../services/merchantDetection');
        
        // Mock DOM for checkout detection
        Object.defineProperty(window, 'location', {
          value: {
            hostname: scenario.hostname,
            href: scenario.url,
            pathname: new URL(scenario.url).pathname
          },
          writable: true
        });

        const detectedMerchant = merchantDetection.detectMerchant(scenario.hostname);
        
        if (scenario.expectedMerchant !== 'Unknown Store') {
          expect(detectedMerchant?.name).toBe(scenario.expectedMerchant);
          expect(detectedMerchant?.category).toBe(scenario.expectedCategory);
        }

        // Get recommendation for this purchase
        const { recommendationEngine } = await import('../../services/recommendationEngine');
        const cards = await storageService.getCards();
        
        const recommendation = recommendationEngine.getBestCard(
          cards, 
          scenario.expectedCategory, 
          scenario.amount
        );
        
        expect(recommendation).toBeDefined();
        expect(recommendation?.card.id).toBe(scenario.expectedCard);

        // Simulate transaction recording
        const transaction = {
          id: `txn_${scenario.name.replace(/\s+/g, '_').toLowerCase()}`,
          merchantName: scenario.expectedMerchant,
          category: scenario.expectedCategory,
          amount: scenario.amount,
          cardUsed: recommendation!.card.id,
          recommendedCard: recommendation!.card.id,
          potentialSavings: recommendation!.rewardAmount,
          timestamp: new Date()
        };

        await storageService.addTransaction(transaction);

        // Verify savings tracking
        const { savingsTracker } = await import('../../services/savingsTracker');
        const stats = await savingsTracker.getSavingsStats();
        
        expect(stats.totalSaved).toBeGreaterThanOrEqual(recommendation!.rewardAmount);
        expect(stats.totalMissed).toBe(0);
      });
    });
  });

  describe('Performance under load', () => {
    it('should handle high transaction volume efficiently', async () => {
      const { storageService } = await import('../../services/storage');
      
      // Add cards
      for (const card of mockCreditCards.filter(c => c.isActive)) {
        await storageService.addCard(card);
      }

      // Simulate 100 transactions
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const transaction = {
          id: `bulk_txn_${i}`,
          merchantName: 'Test Merchant',
          category: 'general' as const,
          amount: Math.random() * 100 + 10,
          cardUsed: mockCreditCards[0].id,
          recommendedCard: mockCreditCards[0].id,
          potentialSavings: Math.random() * 2,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        };
        
        await storageService.addTransaction(transaction);
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 1 second)
      expect(processingTime).toBeLessThan(1000);

      // Verify all transactions were stored
      const transactions = await storageService.getTransactions();
      expect(transactions).toHaveLength(100);

      // Verify stats calculation still works efficiently
      const { savingsTracker } = await import('../../services/savingsTracker');
      
      const statsStartTime = performance.now();
      const stats = await savingsTracker.getSavingsStats();
      const statsEndTime = performance.now();
      
      expect(statsEndTime - statsStartTime).toBeLessThan(100);
      expect(stats).toBeDefined();
      expect(stats.totalSaved).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error recovery and data integrity', () => {
    it('should recover gracefully from corrupted storage', async () => {
      // Simulate corrupted data
      mockStorage.set('cards', 'invalid-json');
      mockStorage.set('transactions', null);
      
      const { storageService } = await import('../../services/storage');
      
      // Should return empty arrays instead of crashing
      const cards = await storageService.getCards();
      const transactions = await storageService.getTransactions();
      
      expect(cards).toEqual([]);
      expect(transactions).toEqual([]);

      // Should be able to add new data
      await storageService.addCard(mockCreditCards[0]);
      const updatedCards = await storageService.getCards();
      
      expect(updatedCards).toHaveLength(1);
    });

    it('should maintain data consistency across service operations', async () => {
      const { storageService } = await import('../../services/storage');
      const { achievementsService } = await import('../../services/achievementsService');
      
      // Add cards and transactions
      await storageService.addCard(mockCreditCards[0]);
      
      const transaction = {
        id: 'consistency_test',
        merchantName: 'Test',
        category: 'general' as const,
        amount: 50,
        cardUsed: mockCreditCards[0].id,
        recommendedCard: mockCreditCards[0].id,
        potentialSavings: 1.00,
        timestamp: new Date()
      };
      
      await storageService.addTransaction(transaction);

      // Check achievements reflect the data
      const achievements = await achievementsService.getUserAchievements();
      const firstCard = achievements.find(a => a.id === 'first_card');
      const firstSave = achievements.find(a => a.id === 'first_save');
      
      expect(firstCard?.currentValue).toBe(1); // 1 active card
      expect(firstSave?.currentValue).toBe(1.00); // $1 saved
    });
  });
});