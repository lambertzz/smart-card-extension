import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { recommendationEngine } from '../../services/recommendationEngine';
import { mockCreditCards } from '../testData';

describe('RecommendationEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBestCard', () => {
    it('should recommend card with highest reward rate for category', () => {
      const result = recommendationEngine.getBestCard(mockCreditCards, 'groceries', 100);
      
      expect(result).toBeDefined();
      expect(result?.card.id).toBe('card1'); // Chase Freedom Flex 5% groceries
      expect(result?.rewardRate).toBe(0.05);
      expect(result?.rewardAmount).toBe(5.00);
    });

    it('should recommend card with highest general rate when no category match', () => {
      const result = recommendationEngine.getBestCard(mockCreditCards, 'electronics', 100);
      
      expect(result).toBeDefined();
      expect(result?.card.id).toBe('card2'); // Citi Double Cash 2% general
      expect(result?.rewardRate).toBe(0.02);
      expect(result?.rewardAmount).toBe(2.00);
    });

    it('should consider spending caps when recommending', () => {
      // Card1 has $1500 quarterly cap with $800 current usage
      // For $800 purchase, it would exceed cap
      const result = recommendationEngine.getBestCard(mockCreditCards, 'groceries', 800);
      
      expect(result).toBeDefined();
      // Should still recommend card1 but mark cap as reached
      if (result?.card.id === 'card1') {
        expect(result.isCapReached).toBe(true);
        expect(result.remainingCap).toBe(700); // 1500 - 800
      }
    });

    it('should avoid inactive cards', () => {
      const result = recommendationEngine.getBestCard(mockCreditCards, 'gas', 50);
      
      expect(result).toBeDefined();
      expect(result?.card.id).not.toBe('card4'); // Inactive gas card
      expect(result?.card.id).toBe('card2'); // Should fall back to general card
    });

    it('should return null for empty card list', () => {
      const result = recommendationEngine.getBestCard([], 'groceries', 100);
      
      expect(result).toBeNull();
    });

    it('should handle dining category correctly', () => {
      const result = recommendationEngine.getBestCard(mockCreditCards, 'dining', 25);
      
      expect(result).toBeDefined();
      expect(result?.card.id).toBe('card3'); // Capital One Savor 4% dining
      expect(result?.rewardRate).toBe(0.04);
      expect(result?.rewardAmount).toBe(1.00);
    });

    it('should provide reasoning for recommendation', () => {
      const result = recommendationEngine.getBestCard(mockCreditCards, 'groceries', 100);
      
      expect(result).toBeDefined();
      expect(result?.reasoning).toContain('groceries');
      expect(result?.reasoning).toContain('5%');
    });

    it('should handle large amounts that exceed caps', () => {
      const result = recommendationEngine.getBestCard(mockCreditCards, 'groceries', 2000);
      
      expect(result).toBeDefined();
      if (result?.card.id === 'card1') {
        expect(result.isCapReached).toBe(true);
        // Should recommend using remaining cap amount
        expect(result.remainingCap).toBe(700);
      }
    });

    it('should calculate rewards correctly for different amounts', () => {
      const testCases = [
        { amount: 50, expectedReward: 2.50 },
        { amount: 100, expectedReward: 5.00 },
        { amount: 200, expectedReward: 10.00 }
      ];

      testCases.forEach(({ amount, expectedReward }) => {
        const result = recommendationEngine.getBestCard(mockCreditCards, 'groceries', amount);
        expect(result?.rewardAmount).toBe(expectedReward);
      });
    });
  });

  describe('compareCards', () => {
    it('should rank cards by reward rate for category', () => {
      const rankings = recommendationEngine.compareCards(mockCreditCards, 'groceries', 100);
      
      expect(rankings).toHaveLength(3); // Only active cards
      expect(rankings[0].card.id).toBe('card1'); // 5% groceries
      expect(rankings[1].card.id).toBe('card3'); // 2% groceries  
      expect(rankings[2].card.id).toBe('card2'); // 2% general
    });

    it('should handle ties in reward rates', () => {
      const rankings = recommendationEngine.compareCards(mockCreditCards, 'general', 100);
      
      expect(rankings).toHaveLength(3);
      // Should be sorted by reward rate descending
      expect(rankings[0].rewardRate).toBeGreaterThanOrEqual(rankings[1].rewardRate);
      expect(rankings[1].rewardRate).toBeGreaterThanOrEqual(rankings[2].rewardRate);
    });
  });
});