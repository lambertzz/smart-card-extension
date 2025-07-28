import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { achievementsService } from '../../services/achievementsService';
import { mockChrome } from '../setup';
import { mockCreditCards, mockTransactions } from '../testData';

// Mock the storage service
jest.mock('../../services/storage', () => ({
  storageService: {
    getTransactions: jest.fn(),
    getCards: jest.fn(),
    getSettings: jest.fn()
  }
}));

import { storageService } from '../../services/storage';
const mockStorageService = storageService as any;

describe('AchievementsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.getTransactions.mockResolvedValue(mockTransactions);
    mockStorageService.getCards.mockResolvedValue(mockCreditCards.filter(c => c.isActive));
  });

  describe('getUserAchievements', () => {
    it('should calculate achievement progress correctly', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ achievements: [] });
      
      const achievements = await achievementsService.getUserAchievements();
      
      expect(achievements).toBeDefined();
      expect(achievements.length).toBeGreaterThan(0);
      
      // Find the "first_save" achievement
      const firstSave = achievements.find(a => a.id === 'first_save');
      expect(firstSave).toBeDefined();
      expect(firstSave?.progress).toBeGreaterThan(0);
    });

    it('should mark achievements as unlocked when target is reached', async () => {
      // Mock transactions that would unlock "first_save" achievement
      const optimizedTransactions = mockTransactions.map(t => ({
        ...t,
        cardUsed: t.recommendedCard, // All transactions use optimal card
        potentialSavings: 2.00 // Total savings > $1
      }));
      
      mockStorageService.getTransactions.mockResolvedValue(optimizedTransactions);
      mockChrome.storage.local.get.mockResolvedValue({ achievements: [] });
      
      const achievements = await achievementsService.getUserAchievements();
      
      const firstSave = achievements.find(a => a.id === 'first_save');
      expect(firstSave?.isUnlocked).toBe(true);
      expect(firstSave?.progress).toBe(100);
    });

    it('should calculate card collector achievement based on active cards', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ achievements: [] });
      
      const achievements = await achievementsService.getUserAchievements();
      
      const cardCollector = achievements.find(a => a.id === 'card_collector');
      expect(cardCollector).toBeDefined();
      expect(cardCollector?.currentValue).toBe(3); // 3 active cards in mock data
      expect(cardCollector?.progress).toBe(60); // 3/5 * 100
    });

    it('should handle stored achievement data', async () => {
      const storedAchievements = [{
        id: 'first_save',
        isUnlocked: true,
        unlockedAt: new Date('2024-01-15')
      }];
      
      mockChrome.storage.local.get.mockResolvedValue({ achievements: storedAchievements });
      
      const achievements = await achievementsService.getUserAchievements();
      
      const firstSave = achievements.find(a => a.id === 'first_save');
      expect(firstSave?.unlockedAt).toEqual(new Date('2024-01-15'));
    });
  });

  describe('getTotalPoints', () => {
    it('should calculate total points from unlocked achievements', async () => {
      // Mock scenario where first_save and first_card are unlocked
      const mockAchievements = [
        {
          id: 'first_save',
          title: 'First Steps',
          description: 'Earn your first $1 in optimized rewards',
          icon: '🎯',
          category: 'savings',
          difficulty: 'bronze',
          target: 1,
          pointsReward: 10,
          progress: 100,
          currentValue: 2,
          isUnlocked: true
        },
        {
          id: 'first_card',
          title: 'Getting Started',
          description: 'Add your first credit card',
          icon: '💳',
          category: 'usage',
          difficulty: 'bronze',
          target: 1,
          pointsReward: 5,
          progress: 100,
          currentValue: 3,
          isUnlocked: true
        }
      ];
      
      jest.spyOn(achievementsService, 'getUserAchievements').mockResolvedValue(mockAchievements as any);
      
      const totalPoints = await achievementsService.getTotalPoints();
      
      expect(totalPoints).toBe(15); // 10 + 5
    });

    it('should return 0 when no achievements are unlocked', async () => {
      const mockAchievements = [
        {
          id: 'big_saver',
          pointsReward: 50,
          isUnlocked: false
        }
      ];
      
      jest.spyOn(achievementsService, 'getUserAchievements').mockResolvedValue(mockAchievements as any);
      
      const totalPoints = await achievementsService.getTotalPoints();
      
      expect(totalPoints).toBe(0);
    });
  });

  describe('getDifficultyColor', () => {
    it('should return correct colors for each difficulty', () => {
      expect(achievementsService.getDifficultyColor('bronze')).toBe('#cd7f32');
      expect(achievementsService.getDifficultyColor('silver')).toBe('#c0c0c0');
      expect(achievementsService.getDifficultyColor('gold')).toBe('#ffd700');
      expect(achievementsService.getDifficultyColor('platinum')).toBe('#e5e4e2');
    });

    it('should return default color for unknown difficulty', () => {
      expect(achievementsService.getDifficultyColor('unknown' as any)).toBe('#666666');
    });
  });

  describe('achievement progress calculations', () => {
    it('should calculate savings achievements based on optimal transactions', async () => {
      const optimizedTransactions = [
        {
          ...mockTransactions[0],
          cardUsed: mockTransactions[0].recommendedCard,
          potentialSavings: 50.00
        },
        {
          ...mockTransactions[1],
          cardUsed: mockTransactions[1].recommendedCard,
          potentialSavings: 75.00
        }
      ];
      
      mockStorageService.getTransactions.mockResolvedValue(optimizedTransactions);
      mockChrome.storage.local.get.mockResolvedValue({ achievements: [] });
      
      const achievements = await achievementsService.getUserAchievements();
      
      const bigSaver = achievements.find(a => a.id === 'big_saver');
      expect(bigSaver).toBeDefined();
      expect(bigSaver?.currentValue).toBe(125.00); // Total savings
      expect(bigSaver?.progress).toBeGreaterThan(100); // Exceeds $100 target
      expect(bigSaver?.isUnlocked).toBe(true);
    });

    it('should handle edge cases in achievement calculations', async () => {
      // Test with empty data
      mockStorageService.getTransactions.mockResolvedValue([]);
      mockStorageService.getCards.mockResolvedValue([]);
      mockChrome.storage.local.get.mockResolvedValue({ achievements: [] });
      
      const achievements = await achievementsService.getUserAchievements();
      
      achievements.forEach(achievement => {
        expect(achievement.currentValue).toBeGreaterThanOrEqual(0);
        expect(achievement.progress).toBeGreaterThanOrEqual(0);
        expect(achievement.progress).toBeLessThanOrEqual(100);
      });
    });
  });
});