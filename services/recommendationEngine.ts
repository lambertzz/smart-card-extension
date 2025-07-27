import type { CreditCard, CardRecommendation, MerchantCategory, RewardRule } from "~types";

class RecommendationEngine {
  getBestCard(
    cards: CreditCard[], 
    category: MerchantCategory, 
    estimatedAmount: number = 100
  ): CardRecommendation | null {
    if (!cards.length) return null;

    const recommendations = cards
      .filter(card => card.isActive)
      .map(card => this.calculateRecommendation(card, category, estimatedAmount))
      .filter(rec => rec !== null) as CardRecommendation[]
      .sort((a, b) => b.rewardAmount - a.rewardAmount);

    return recommendations[0] || null;
  }

  private calculateRecommendation(
    card: CreditCard, 
    category: MerchantCategory, 
    amount: number
  ): CardRecommendation | null {
    // Find the best matching reward rule for this category
    const matchingRule = this.findBestRewardRule(card, category);
    if (!matchingRule) return null;

    const { rewardRate, effectiveAmount, reasoning, isCapReached, remainingCap } = 
      this.calculateReward(matchingRule, amount);

    return {
      card,
      rewardAmount: effectiveAmount * rewardRate,
      rewardRate,
      reasoning,
      isCapReached,
      remainingCap
    };
  }

  private findBestRewardRule(card: CreditCard, category: MerchantCategory): RewardRule | null {
    // First try exact category match
    let bestRule = card.rewardStructure.find(rule => rule.category === category);
    
    // If no exact match, try 'general' category as fallback
    if (!bestRule) {
      bestRule = card.rewardStructure.find(rule => rule.category === 'general');
    }

    // If still no match, try 'online' for general purchases
    if (!bestRule && category === 'general') {
      bestRule = card.rewardStructure.find(rule => rule.category === 'online');
    }

    return bestRule || null;
  }

  private calculateReward(rule: RewardRule, amount: number): {
    rewardRate: number;
    effectiveAmount: number;
    reasoning: string;
    isCapReached: boolean;
    remainingCap?: number;
  } {
    const rewardRate = rule.rewardRate;
    let effectiveAmount = amount;
    let reasoning = `${(rewardRate * 100).toFixed(1)}% back on ${rule.category}`;
    let isCapReached = false;
    let remainingCap: number | undefined;

    if (rule.cap) {
      const currentUsage = rule.cap.currentUsage || 0;
      remainingCap = Math.max(0, rule.cap.amount - currentUsage);
      
      if (currentUsage >= rule.cap.amount) {
        // Cap already reached - no rewards for this rule
        effectiveAmount = 0;
        reasoning += ` (cap reached: $${rule.cap.amount} ${rule.cap.period})`;
        isCapReached = true;
      } else if (currentUsage + amount > rule.cap.amount) {
        // Partial reward - only up to the cap
        effectiveAmount = rule.cap.amount - currentUsage;
        reasoning += ` (partial: $${effectiveAmount.toFixed(2)} until $${rule.cap.amount} ${rule.cap.period} cap)`;
      } else {
        // Full reward within cap
        const usageAfter = currentUsage + amount;
        reasoning += ` ($${usageAfter.toFixed(2)} of $${rule.cap.amount} ${rule.cap.period} cap used)`;
      }
    }

    return {
      rewardRate,
      effectiveAmount,
      reasoning,
      isCapReached,
      remainingCap
    };
  }

  getAllRecommendations(
    cards: CreditCard[], 
    category: MerchantCategory, 
    amount: number = 100
  ): CardRecommendation[] {
    return cards
      .filter(card => card.isActive)
      .map(card => this.calculateRecommendation(card, category, amount))
      .filter(rec => rec !== null) as CardRecommendation[]
      .sort((a, b) => b.rewardAmount - a.rewardAmount);
  }

  compareCards(
    cards: CreditCard[], 
    category: MerchantCategory, 
    amount: number = 100
  ): { 
    best: CardRecommendation | null; 
    alternatives: CardRecommendation[];
    potentialSavings: number;
  } {
    const recommendations = this.getAllRecommendations(cards, category, amount);
    
    const best = recommendations[0] || null;
    const alternatives = recommendations.slice(1, 3); // Show top 2 alternatives
    
    const worstReward = recommendations[recommendations.length - 1]?.rewardAmount || 0;
    const bestReward = best?.rewardAmount || 0;
    const potentialSavings = bestReward - worstReward;

    return {
      best,
      alternatives,
      potentialSavings
    };
  }

  // Helper method to estimate transaction amount from page context
  estimateTransactionAmount(): number {
    // Try to find total amount on checkout page
    const amountSelectors = [
      '.total', '.grand-total', '.final-total', 
      '[data-testid*="total"]', '[data-testid*="amount"]',
      '.price-total', '.order-total', '.checkout-total'
    ];

    for (const selector of amountSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || '';
        const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          if (amount > 0 && amount < 10000) { // Reasonable bounds
            return amount;
          }
        }
      }
    }

    // Default fallback
    return 100;
  }
}

export const recommendationEngine = new RecommendationEngine();