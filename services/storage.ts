import type { CreditCard, Transaction, StorageData } from "~types";

const STORAGE_KEYS = {
  CARDS: 'cards',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings'
} as const;

class StorageService {
  async getCards(): Promise<CreditCard[]> {
    try {
      // First check for cards under the new key
      let result = await chrome.storage.local.get(STORAGE_KEYS.CARDS);
      let cards = result[STORAGE_KEYS.CARDS];
      
      // If no cards found under new key, check old key and migrate
      if (!cards || cards.length === 0) {
        const oldResult = await chrome.storage.local.get('creditCards');
        const oldCards = oldResult['creditCards'];
        
        if (oldCards && oldCards.length > 0) {
          // Migrate old cards to new key
          await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: oldCards });
          // Remove old key to clean up
          await chrome.storage.local.remove('creditCards');
          cards = oldCards;
        }
      }
      
      return cards || [];
    } catch (error) {
      console.error('Error getting cards:', error);
      return [];
    }
  }

  async saveCard(card: CreditCard): Promise<void> {
    const cards = await this.getCards();
    const existingIndex = cards.findIndex(c => c.id === card.id);
    
    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: cards });
  }

  async deleteCard(cardId: string): Promise<void> {
    const cards = await this.getCards();
    const filteredCards = cards.filter(c => c.id !== cardId);
    await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: filteredCards });
  }

  async getTransactions(): Promise<Transaction[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TRANSACTIONS);
    return result[STORAGE_KEYS.TRANSACTIONS] || [];
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.push(transaction);
    
    // Keep only last 1000 transactions to avoid storage bloat
    if (transactions.length > 1000) {
      transactions.splice(0, transactions.length - 1000);
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.TRANSACTIONS]: transactions });
  }

  async getSettings(): Promise<StorageData['settings']> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || {
      enableNotifications: true,
      trackSpending: true,
      darkMode: false
    };
  }

  async saveSettings(settings: StorageData['settings']): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  }

  async updateSettings(settings: StorageData['settings']): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  }

  async addCard(card: CreditCard): Promise<void> {
    await this.saveCard(card);
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    await this.saveTransaction(transaction);
  }

  async updateCardCapUsage(cardId: string, category: string, amount: number): Promise<void> {
    const cards = await this.getCards();
    const card = cards.find(c => c.id === cardId);
    
    if (!card) return;
    
    const rewardRule = card.rewardStructure.find(rule => rule.category === category);
    if (!rewardRule?.cap) return;
    
    rewardRule.cap.currentUsage += amount;
    await this.saveCard(card);
  }

  async resetCapUsage(period: 'monthly' | 'quarterly' | 'yearly'): Promise<void> {
    const cards = await this.getCards();
    
    for (const card of cards) {
      for (const rule of card.rewardStructure) {
        if (rule.cap && rule.cap.period === period) {
          rule.cap.currentUsage = 0;
        }
      }
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.CARDS]: cards });
  }

  async clearAllData(): Promise<void> {
    await chrome.storage.local.clear();
  }
}

export const storageService = new StorageService();