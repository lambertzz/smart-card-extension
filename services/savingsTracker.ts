import type { Transaction, SavingsStats } from "~types";
import { storageService } from "~services/storage";

class SavingsTrackerService {
  async logTransaction(transaction: Transaction): Promise<void> {
    await storageService.saveTransaction(transaction);
  }

  async getSavingsStats(): Promise<SavingsStats> {
    const transactions = await storageService.getTransactions();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalSaved = 0;
    let totalMissed = 0;
    const monthlyStats = new Map<string, { saved: number; missed: number }>();

    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.timestamp);
      const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;

      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, { saved: 0, missed: 0 });
      }

      const monthStats = monthlyStats.get(monthKey)!;

      if (transaction.cardUsed === transaction.recommendedCard) {
        // User used the recommended card
        totalSaved += transaction.potentialSavings;
        monthStats.saved += transaction.potentialSavings;
      } else {
        // User missed the optimal choice
        totalMissed += transaction.potentialSavings;
        monthStats.missed += transaction.potentialSavings;
      }
    }

    // Convert to array format for last 6 months
    const monthlyStatsArray = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const stats = monthlyStats.get(monthKey) || { saved: 0, missed: 0 };
      
      monthlyStatsArray.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        saved: stats.saved,
        missed: stats.missed
      });
    }

    return {
      totalSaved,
      totalMissed,
      monthlyStats: monthlyStatsArray
    };
  }

  async getCurrentMonthSavings(): Promise<{ saved: number; missed: number }> {
    const transactions = await storageService.getTransactions();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let saved = 0;
    let missed = 0;

    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.timestamp);
      
      if (transactionDate.getMonth() === currentMonth && 
          transactionDate.getFullYear() === currentYear) {
        
        if (transaction.cardUsed === transaction.recommendedCard) {
          saved += transaction.potentialSavings;
        } else {
          missed += transaction.potentialSavings;
        }
      }
    }

    return { saved, missed };
  }

  calculatePotentialSavings(
    actualReward: number, 
    optimalReward: number
  ): number {
    return Math.max(0, optimalReward - actualReward);
  }
}

export const savingsTracker = new SavingsTrackerService();