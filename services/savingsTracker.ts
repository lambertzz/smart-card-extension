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

  async getSpendingTrends(): Promise<{
    monthlyTrends: { month: string; amount: number; transactions: number }[];
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
    topMerchants: { merchant: string; amount: number; transactions: number }[];
    averageOrderValue: number;
  }> {
    const transactions = await storageService.getTransactions();
    const now = new Date();
    
    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    const categorySpending = new Map<string, number>();
    const merchantSpending = new Map<string, { amount: number; transactions: number }>();
    let totalAmount = 0;
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${targetMonth.getFullYear()}-${targetMonth.getMonth()}`;
      const monthName = targetMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate.getMonth() === targetMonth.getMonth() && 
               tDate.getFullYear() === targetMonth.getFullYear();
      });
      
      const monthAmount = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      monthlyTrends.push({
        month: monthName,
        amount: monthAmount,
        transactions: monthTransactions.length
      });
    }
    
    // Category breakdown
    transactions.forEach(t => {
      categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
      totalAmount += t.amount;
      
      const merchant = merchantSpending.get(t.merchantName) || { amount: 0, transactions: 0 };
      merchant.amount += t.amount;
      merchant.transactions += 1;
      merchantSpending.set(t.merchantName, merchant);
    });
    
    const categoryBreakdown = Array.from(categorySpending.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Top merchants
    const topMerchants = Array.from(merchantSpending.entries())
      .map(([merchant, data]) => ({
        merchant,
        amount: data.amount,
        transactions: data.transactions
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    const averageOrderValue = transactions.length > 0 ? totalAmount / transactions.length : 0;
    
    return {
      monthlyTrends,
      categoryBreakdown,
      topMerchants,
      averageOrderValue
    };
  }

  async getCashbackForecast(): Promise<{
    nextMonthForecast: number;
    quarterlyForecast: number;
    yearlyForecast: number;
    categoryForecasts: { category: string; forecast: number }[];
    confidenceLevel: number;
    trendsAnalysis: {
      isIncreasing: boolean;
      changeRate: number;
      seasonalPattern: boolean;
    };
  }> {
    const transactions = await storageService.getTransactions();
    const cards = await storageService.getCards();
    
    if (transactions.length < 3) {
      return {
        nextMonthForecast: 0,
        quarterlyForecast: 0,
        yearlyForecast: 0,
        categoryForecasts: [],
        confidenceLevel: 10,
        trendsAnalysis: {
          isIncreasing: false,
          changeRate: 0,
          seasonalPattern: false
        }
      };
    }

    // Analyze spending patterns over time
    const now = new Date();
    const monthlySpending = new Map<string, number>();
    const monthlyRewards = new Map<string, number>();
    const categorySpending = new Map<string, number>();
    
    // Group transactions by month and category
    transactions.forEach(t => {
      const monthKey = `${new Date(t.timestamp).getFullYear()}-${new Date(t.timestamp).getMonth()}`;
      const currentSpending = monthlySpending.get(monthKey) || 0;
      monthlySpending.set(monthKey, currentSpending + t.amount);
      
      // Calculate actual rewards earned
      const card = cards.find(c => c.id === t.cardUsed);
      let rewardEarned = 0;
      if (card) {
        const rule = card.rewardStructure.find(r => r.category === t.category) ||
                    card.rewardStructure.find(r => r.category === 'general');
        if (rule) {
          rewardEarned = t.amount * rule.rewardRate;
        }
      }
      
      const currentRewards = monthlyRewards.get(monthKey) || 0;
      monthlyRewards.set(monthKey, currentRewards + rewardEarned);
      
      // Category spending
      const categoryTotal = categorySpending.get(t.category) || 0;
      categorySpending.set(t.category, categoryTotal + t.amount);
    });

    // Calculate trends
    const spendingAmounts = Array.from(monthlySpending.values());
    const rewardAmounts = Array.from(monthlyRewards.values());
    
    if (spendingAmounts.length === 0) {
      return {
        nextMonthForecast: 0,
        quarterlyForecast: 0,
        yearlyForecast: 0,
        categoryForecasts: [],
        confidenceLevel: 0,
        trendsAnalysis: {
          isIncreasing: false,
          changeRate: 0,
          seasonalPattern: false
        }
      };
    }

    // Simple trend analysis
    const avgMonthlySpending = spendingAmounts.reduce((sum, a) => sum + a, 0) / spendingAmounts.length;
    const avgMonthlyRewards = rewardAmounts.reduce((sum, a) => sum + a, 0) / rewardAmounts.length;
    
    // Calculate growth trend
    let changeRate = 0;
    let isIncreasing = false;
    if (spendingAmounts.length >= 3) {
      const firstHalf = spendingAmounts.slice(0, Math.floor(spendingAmounts.length / 2));
      const secondHalf = spendingAmounts.slice(Math.floor(spendingAmounts.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum, a) => sum + a, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, a) => sum + a, 0) / secondHalf.length;
      
      changeRate = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      isIncreasing = changeRate > 5;
    }

    // Detect seasonal patterns
    const seasonalPattern = this.detectSeasonalSpending(transactions);
    
    // Apply growth trend to forecast
    const growthMultiplier = isIncreasing ? 1 + (Math.abs(changeRate) / 100) : 1;
    const baseMonthlyReward = avgMonthlyRewards * growthMultiplier;
    
    // Generate category forecasts
    const categoryForecasts = Array.from(categorySpending.entries())
      .map(([category, totalSpent]) => {
        const avgCategorySpending = totalSpent / (spendingAmounts.length || 1);
        const bestCard = cards
          .filter(c => c.isActive)
          .map(c => {
            const rule = c.rewardStructure.find(r => r.category === category) ||
                        c.rewardStructure.find(r => r.category === 'general');
            return { rate: rule?.rewardRate || 0 };
          })
          .sort((a, b) => b.rate - a.rate)[0];
        
        const forecastReward = avgCategorySpending * (bestCard?.rate || 0) * growthMultiplier;
        return {
          category,
          forecast: forecastReward
        };
      })
      .filter(f => f.forecast > 0)
      .sort((a, b) => b.forecast - a.forecast);

    // Calculate confidence based on data quality
    let confidenceLevel = Math.min(90, transactions.length * 10); // More transactions = higher confidence
    if (spendingAmounts.length >= 6) confidenceLevel += 10; // Bonus for 6+ months of data
    if (seasonalPattern) confidenceLevel += 5; // Bonus for clear patterns

    return {
      nextMonthForecast: Math.max(0, baseMonthlyReward),
      quarterlyForecast: Math.max(0, baseMonthlyReward * 3),
      yearlyForecast: Math.max(0, baseMonthlyReward * 12),
      categoryForecasts: categoryForecasts.slice(0, 5),
      confidenceLevel,
      trendsAnalysis: {
        isIncreasing,
        changeRate: Math.abs(changeRate),
        seasonalPattern
      }
    };
  }

  private detectSeasonalSpending(transactions: Transaction[]): boolean {
    const monthlyTotals = new Map<number, number>();
    transactions.forEach(t => {
      const month = new Date(t.timestamp).getMonth();
      monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + t.amount);
    });
    
    if (monthlyTotals.size < 4) return false;
    
    const amounts = Array.from(monthlyTotals.values());
    const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // If standard deviation is more than 40% of average, consider it seasonal
    return stdDev > avg * 0.4;
  }

  async getOptimizationSuggestions(): Promise<{
    suggestions: string[];
    potentialAnnualSavings: number;
    cardUtilizationTips: string[];
  }> {
    const transactions = await storageService.getTransactions();
    const cards = await storageService.getCards();
    const suggestions: string[] = [];
    const cardUtilizationTips: string[] = [];
    let potentialAnnualSavings = 0;
    
    // Category spending analysis
    const categorySpending = new Map<string, number>();
    transactions.forEach(t => {
      categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
    });
    
    // Find categories with high spending but low reward rates
    categorySpending.forEach((amount, category) => {
      const bestCard = cards
        .filter(c => c.isActive)
        .map(c => {
          const rule = c.rewardStructure.find(r => r.category === category) ||
                      c.rewardStructure.find(r => r.category === 'general');
          return { card: c, rate: rule?.rewardRate || 0 };
        })
        .sort((a, b) => b.rate - a.rate)[0];
      
      if (bestCard && bestCard.rate < 0.02 && amount > 500) {
        suggestions.push(
          `Consider getting a card with higher rewards for ${category} - you've spent $${amount.toFixed(0)} in this category.`
        );
        potentialAnnualSavings += amount * 0.03; // Assume 3% potential improvement
      }
    });
    
    // Cap utilization warnings
    cards.forEach(card => {
      card.rewardStructure.forEach(rule => {
        if (rule.cap) {
          const usagePercentage = (rule.cap.currentUsage || 0) / rule.cap.amount * 100;
          if (usagePercentage > 80) {
            cardUtilizationTips.push(
              `${card.name}: ${usagePercentage.toFixed(0)}% of your ${rule.category} cap used this ${rule.cap.period}.`
            );
          } else if (usagePercentage < 20) {
            cardUtilizationTips.push(
              `${card.name}: Only ${usagePercentage.toFixed(0)}% of your ${rule.category} cap used - consider using this card more for ${rule.category} purchases.`
            );
          }
        }
      });
    });
    
    // Unused cards warning
    const unusedCards = cards.filter(c => c.isActive && 
      !transactions.some(t => t.cardUsed === c.id)
    );
    if (unusedCards.length > 0) {
      suggestions.push(
        `You have ${unusedCards.length} unused card(s). Consider using them for their bonus categories or removing them if not needed.`
      );
    }
    
    // High spending without optimal rewards
    const missedSavings = transactions
      .filter(t => t.cardUsed !== t.recommendedCard)
      .reduce((sum, t) => sum + t.potentialSavings, 0);
    
    if (missedSavings > 50) {
      suggestions.push(
        `You could have saved an additional $${missedSavings.toFixed(2)} by using optimal cards. Check recommendations more frequently!`
      );
      potentialAnnualSavings += missedSavings * 4; // Extrapolate quarterly
    }
    
    return {
      suggestions,
      potentialAnnualSavings,
      cardUtilizationTips
    };
  }
}

export const savingsTracker = new SavingsTrackerService();