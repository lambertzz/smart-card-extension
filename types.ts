export interface CreditCard {
  id: string;
  name: string;
  rewardStructure: RewardRule[];
  isActive: boolean;
  createdAt: Date;
}

export interface RewardRule {
  category: MerchantCategory;
  rewardRate: number; // percentage as decimal (0.05 = 5%)
  cap?: {
    amount: number; // dollar amount cap
    period: 'monthly' | 'quarterly' | 'yearly';
    currentUsage: number; // current spending toward cap
  };
}

export type MerchantCategory = 
  | 'general'
  | 'groceries'
  | 'gas'
  | 'travel'
  | 'dining'
  | 'online'
  | 'department_stores'
  | 'electronics'
  | 'pharmacy'
  | 'warehouse_clubs';

export interface Merchant {
  name: string;
  domain: string;
  category: MerchantCategory;
  checkoutSelectors: string[]; // CSS selectors for checkout detection
}

export interface Transaction {
  id: string;
  merchantName: string;
  category: MerchantCategory;
  amount: number;
  cardUsed?: string; // card id
  recommendedCard: string; // card id
  potentialSavings: number;
  timestamp: Date;
}

export interface CardRecommendation {
  card: CreditCard;
  rewardAmount: number;
  rewardRate: number;
  reasoning: string;
  isCapReached: boolean;
  remainingCap?: number;
}

export interface SavingsStats {
  totalSaved: number;
  totalMissed: number;
  monthlyStats: {
    month: string;
    saved: number;
    missed: number;
  }[];
}

export interface StorageData {
  cards: CreditCard[];
  transactions: Transaction[];
  settings: {
    enableNotifications: boolean;
    trackSpending: boolean;
    darkMode: boolean;
  };
}