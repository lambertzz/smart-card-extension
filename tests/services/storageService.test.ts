import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { storageService } from '../../services/storage';
import { mockChrome } from '../setup';
import { mockCreditCards, mockTransactions, mockSettings } from '../testData';

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCards', () => {
    it('should return empty array when no cards stored', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      
      const result = await storageService.getCards();
      
      expect(result).toEqual([]);
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('cards');
    });

    it('should return stored cards', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ cards: mockCreditCards });
      
      const result = await storageService.getCards();
      
      expect(result).toEqual(mockCreditCards);
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('cards');
    });

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));
      
      const result = await storageService.getCards();
      
      expect(result).toEqual([]);
    });
  });

  describe('addCard', () => {
    it('should add a new card', async () => {
      const existingCards = [mockCreditCards[0]];
      const newCard = mockCreditCards[1];
      
      mockChrome.storage.local.get.mockResolvedValue({ cards: existingCards });
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      
      await storageService.addCard(newCard);
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        cards: [...existingCards, newCard]
      });
    });

    it('should create cards array if none exists', async () => {
      const newCard = mockCreditCards[0];
      
      mockChrome.storage.local.get.mockResolvedValue({});
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      
      await storageService.addCard(newCard);
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        cards: [newCard]
      });
    });
  });

  describe('deleteCard', () => {
    it('should remove card by id', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ cards: mockCreditCards });
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      
      await storageService.deleteCard('card2');
      
      const expectedCards = mockCreditCards.filter(c => c.id !== 'card2');
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        cards: expectedCards
      });
    });

    it('should handle non-existent card id', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ cards: mockCreditCards });
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      
      await storageService.deleteCard('nonexistent');
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        cards: mockCreditCards
      });
    });
  });

  describe('getTransactions', () => {
    it('should return stored transactions', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ transactions: mockTransactions });
      
      const result = await storageService.getTransactions();
      
      expect(result).toEqual(mockTransactions);
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('transactions');
    });

    it('should return empty array when no transactions', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      
      const result = await storageService.getTransactions();
      
      expect(result).toEqual([]);
    });
  });

  describe('addTransaction', () => {
    it('should add new transaction', async () => {
      const existingTransactions = [mockTransactions[0]];
      const newTransaction = mockTransactions[1];
      
      mockChrome.storage.local.get.mockResolvedValue({ transactions: existingTransactions });
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      
      await storageService.addTransaction(newTransaction);
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        transactions: [...existingTransactions, newTransaction]
      });
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none stored', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});
      
      const result = await storageService.getSettings();
      
      expect(result).toEqual({
        enableNotifications: true,
        trackSpending: true,
        darkMode: false
      });
    });

    it('should return stored settings', async () => {
      mockChrome.storage.local.get.mockResolvedValue({ settings: mockSettings });
      
      const result = await storageService.getSettings();
      
      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const newSettings = { ...mockSettings, darkMode: true };
      mockChrome.storage.local.set.mockResolvedValue(undefined);
      
      await storageService.updateSettings(newSettings);
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        settings: newSettings
      });
    });
  });
});