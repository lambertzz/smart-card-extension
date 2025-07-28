import type { Transaction, CreditCard } from "~types";
import { storageService } from "~services/storage";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'savings' | 'optimization' | 'usage' | 'milestone';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: Date;
  progress: number; // 0-100
  target: number;
  currentValue: number;
  isUnlocked: boolean;
  pointsReward: number;
}

class AchievementsService {
  private readonly achievements: Omit<Achievement, 'progress' | 'currentValue' | 'isUnlocked' | 'unlockedAt'>[] = [
    // Savings Achievements
    {
      id: 'first_save',
      title: 'First Steps',
      description: 'Earn your first $1 in optimized rewards',
      icon: '🎯',
      category: 'savings',
      difficulty: 'bronze',
      target: 1,
      pointsReward: 10
    },
    {
      id: 'big_saver',
      title: 'Big Saver',
      description: 'Save $100 in total through optimal card usage',
      icon: '💰',
      category: 'savings',
      difficulty: 'gold',
      target: 100,
      pointsReward: 50
    },
    {
      id: 'first_card',
      title: 'Getting Started',
      description: 'Add your first credit card',
      icon: '💳',
      category: 'usage',
      difficulty: 'bronze',
      target: 1,
      pointsReward: 5
    },
    {
      id: 'card_collector',
      title: 'Card Collector',
      description: 'Add 5 different credit cards',
      icon: '🗂️',
      category: 'usage',
      difficulty: 'silver',
      target: 5,
      pointsReward: 20
    }
  ];

  async getUserAchievements(): Promise<Achievement[]> {
    const transactions = await storageService.getTransactions();
    const cards = await storageService.getCards();
    
    // Get stored achievement progress
    const storedAchievements = await this.getStoredAchievements();
    
    return this.achievements.map(template => {
      const stored = storedAchievements.find(a => a.id === template.id);
      const currentValue = this.calculateCurrentValue(template.id, transactions, cards);
      const progress = Math.min(100, (currentValue / template.target) * 100);
      const isUnlocked = currentValue >= template.target;

      return {
        ...template,
        progress,
        currentValue,
        isUnlocked,
        unlockedAt: stored?.unlockedAt
      };
    });
  }

  private calculateCurrentValue(
    achievementId: string, 
    transactions: Transaction[], 
    cards: CreditCard[]
  ): number {
    switch (achievementId) {
      case 'first_save':
      case 'big_saver':
        return transactions
          .filter(t => t.cardUsed === t.recommendedCard)
          .reduce((sum, t) => sum + t.potentialSavings, 0);

      case 'first_card':
      case 'card_collector':
        return cards.filter(c => c.isActive).length;

      default:
        return 0;
    }
  }

  private async getStoredAchievements(): Promise<Achievement[]> {
    try {
      const result = await chrome.storage.local.get('achievements');
      return result.achievements || [];
    } catch (error) {
      return [];
    }
  }

  async getTotalPoints(): Promise<number> {
    const achievements = await this.getUserAchievements();
    return achievements
      .filter(a => a.isUnlocked)
      .reduce((sum, a) => sum + a.pointsReward, 0);
  }

  getDifficultyColor(difficulty: Achievement['difficulty']): string {
    switch (difficulty) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      default: return '#666666';
    }
  }
}

export const achievementsService = new AchievementsService();