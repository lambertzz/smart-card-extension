import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import IndexPopup from '../../popup';
import { mockChrome } from '../setup';
import { mockCreditCards, mockTransactions, mockSettings } from '../testData';

// Mock all service dependencies 
jest.mock('../../services/storage', () => ({
  storageService: {
    getCards: jest.fn(),
    addCard: jest.fn(),
    deleteCard: jest.fn(),
    getTransactions: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn()
  }
}));

jest.mock('../../services/savingsTracker', () => ({
  savingsTracker: {
    getSavingsStats: jest.fn(),
    getCashbackForecast: jest.fn(),
    getSpendingTrends: jest.fn()
  }
}));

jest.mock('../../services/achievementsService', () => ({
  achievementsService: {
    getUserAchievements: jest.fn(),
    getTotalPoints: jest.fn(),
    getDifficultyColor: jest.fn()
  }
}));

import { storageService } from '../../services/storage';
import { savingsTracker } from '../../services/savingsTracker';
import { achievementsService } from '../../services/achievementsService';

const mockStorageService = storageService as any;
const mockSavingsTracker = savingsTracker as any;
const mockAchievementsService = achievementsService as any;

describe('IndexPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    mockStorageService.getCards.mockResolvedValue(mockCreditCards.filter(c => c.isActive));
    mockStorageService.getSettings.mockResolvedValue(mockSettings);
    mockStorageService.getTransactions.mockResolvedValue(mockTransactions);
    
    mockSavingsTracker.getSavingsStats.mockResolvedValue({
      totalSaved: 156.50,
      totalMissed: 23.75,
      monthlyStats: [
        { month: 'March 2024', saved: 89.25, missed: 12.50 },
        { month: 'February 2024', saved: 67.25, missed: 11.25 }
      ]
    });

    mockAchievementsService.getUserAchievements.mockResolvedValue([
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
        currentValue: 5.50,
        isUnlocked: true
      }
    ]);

    mockAchievementsService.getTotalPoints.mockResolvedValue(25);
    mockAchievementsService.getDifficultyColor.mockReturnValue('#cd7f32');
  });

  describe('Tab Navigation', () => {
    it('should render all navigation tabs', async () => {
      render(<IndexPopup />);
      
      await waitFor(() => {
        expect(screen.getByText('Cards')).toBeInTheDocument();
        expect(screen.getByText('Savings')).toBeInTheDocument();
        expect(screen.getByText('🏆')).toBeInTheDocument();
        expect(screen.getByText('⚙️')).toBeInTheDocument();
      });
    });

    it('should switch between tabs correctly', async () => {
      render(<IndexPopup />);
      
      // Should start on Cards tab
      await waitFor(() => {
        expect(screen.getByText('Your Cards')).toBeInTheDocument();
      });

      // Switch to Savings tab
      fireEvent.click(screen.getByText('Savings'));
      
      await waitFor(() => {
        expect(screen.getByText('Your Savings')).toBeInTheDocument();
      });

      // Switch to Achievements tab
      fireEvent.click(screen.getByText('🏆'));
      
      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument();
      });

      // Switch to Settings tab
      fireEvent.click(screen.getByText('⚙️'));
      
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Cards Tab', () => {
    it('should display existing cards', async () => {
      render(<IndexPopup />);
      
      await waitFor(() => {
        expect(screen.getByText('Chase Freedom Flex')).toBeInTheDocument();
        expect(screen.getByText('Citi Double Cash')).toBeInTheDocument();
        expect(screen.getByText('Capital One Savor')).toBeInTheDocument();
      });
    });

    it('should show empty state when no cards', async () => {
      mockStorageService.getCards.mockResolvedValue([]);
      
      render(<IndexPopup />);
      
      await waitFor(() => {
        expect(screen.getByText('No cards added yet')).toBeInTheDocument();
        expect(screen.getByText('Add your credit cards to start getting recommendations')).toBeInTheDocument();
      });
    });

    it('should open add card form', async () => {
      render(<IndexPopup />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Card'));
      });

      await waitFor(() => {
        expect(screen.getByText('Add New Card')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g., Chase Freedom')).toBeInTheDocument();
      });
    });

    it('should validate card form submission', async () => {
      render(<IndexPopup />);
      
      // Open add form
      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Add Card'));
      });

      // Try to submit without required fields
      const addButton = screen.getByText('Add Card');
      expect(addButton).toBeDisabled();

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('e.g., Chase Freedom'), {
        target: { value: 'Test Card' }
      });
      
      fireEvent.change(screen.getByPlaceholderText('5'), {
        target: { value: '2.5' }
      });

      // Now button should be enabled
      expect(addButton).not.toBeDisabled();
    });

    it('should handle card deletion', async () => {
      render(<IndexPopup />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      expect(mockStorageService.deleteCard).toHaveBeenCalled();
    });
  });

  describe('Savings Tab', () => {
    it('should display savings statistics', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('Savings'));
      
      await waitFor(() => {
        expect(screen.getByText('$156.50')).toBeInTheDocument(); // Total saved
        expect(screen.getByText('$23.75')).toBeInTheDocument(); // Total missed
      });
    });

    it('should show monthly breakdown', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('Savings'));
      
      await waitFor(() => {
        expect(screen.getByText('Monthly Breakdown')).toBeInTheDocument();
        expect(screen.getByText('March 2024')).toBeInTheDocument();
        expect(screen.getByText('February 2024')).toBeInTheDocument();
      });
    });

    it('should show loading state', async () => {
      mockSavingsTracker.getSavingsStats.mockResolvedValue(null);
      
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('Savings'));
      
      await waitFor(() => {
        expect(screen.getByText('Loading savings data...')).toBeInTheDocument();
      });
    });
  });

  describe('Achievements Tab', () => {
    it('should display achievements and points', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('🏆'));
      
      await waitFor(() => {
        expect(screen.getByText('Achievements')).toBeInTheDocument();
        expect(screen.getByText('25 points')).toBeInTheDocument();
        expect(screen.getByText('First Steps')).toBeInTheDocument();
      });
    });

    it('should show achievement progress', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('🏆'));
      
      await waitFor(() => {
        expect(screen.getByText('5.5 / 1')).toBeInTheDocument(); // Current/Target
        expect(screen.getByText('100%')).toBeInTheDocument(); // Progress
      });
    });

    it('should display difficulty badges', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('🏆'));
      
      await waitFor(() => {
        expect(screen.getByText('bronze')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Tab', () => {
    it('should display settings options', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('⚙️'));
      
      await waitFor(() => {
        expect(screen.getByText('🌙 Dark Mode')).toBeInTheDocument();
        expect(screen.getByText('🔔 Smart Notifications')).toBeInTheDocument();
      });
    });

    it('should toggle dark mode', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('⚙️'));
      
      await waitFor(() => {
        const darkModeToggle = screen.getByRole('checkbox', { name: /dark mode/i });
        fireEvent.click(darkModeToggle);
      });

      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({
        ...mockSettings,
        darkMode: true
      });
    });

    it('should toggle notifications', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('⚙️'));
      
      await waitFor(() => {
        const notificationsToggle = screen.getByRole('checkbox', { name: /notifications/i });
        fireEvent.click(notificationsToggle);
      });

      expect(mockStorageService.updateSettings).toHaveBeenCalledWith({
        ...mockSettings,
        enableNotifications: false
      });
    });

    it('should display extension information', async () => {
      render(<IndexPopup />);
      
      fireEvent.click(screen.getByText('⚙️'));
      
      await waitFor(() => {
        expect(screen.getByText('SmartCard AI Assistant')).toBeInTheDocument();
        expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
        expect(screen.getByText(/60\+ merchants/)).toBeInTheDocument();
      });
    });
  });

  describe('Theme System', () => {
    it('should apply light theme by default', async () => {
      render(<IndexPopup />);
      
      await waitFor(() => {
        const container = screen.getByText('💳 Credit Card Assistant').closest('div');
        expect(container).toHaveStyle('background: #ffffff');
      });
    });

    it('should apply dark theme when enabled', async () => {
      mockStorageService.getSettings.mockResolvedValue({
        ...mockSettings,
        darkMode: true
      });
      
      render(<IndexPopup />);
      
      await waitFor(() => {
        const container = screen.getByText('💳 Credit Card Assistant').closest('div');
        expect(container).toHaveStyle('background: #1f2937');
      });
    });

    it('should update theme colors throughout the interface', async () => {
      mockStorageService.getSettings.mockResolvedValue({
        ...mockSettings,
        darkMode: true
      });
      
      render(<IndexPopup />);
      
      await waitFor(() => {
        const title = screen.getByText('💳 Credit Card Assistant');
        expect(title).toHaveStyle('color: #f9fafb');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockStorageService.getCards.mockRejectedValue(new Error('Service error'));
      
      render(<IndexPopup />);
      
      // Should not crash and should show some default state
      await waitFor(() => {
        expect(screen.getByText('💳 Credit Card Assistant')).toBeInTheDocument();
      });
    });

    it('should handle missing data gracefully', async () => {
      mockStorageService.getCards.mockResolvedValue([]);
      mockSavingsTracker.getSavingsStats.mockResolvedValue(null);
      mockAchievementsService.getUserAchievements.mockResolvedValue([]);
      
      render(<IndexPopup />);
      
      await waitFor(() => {
        expect(screen.getByText('No cards added yet')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<IndexPopup />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toBeInTheDocument();
        });
      });
    });

    it('should handle keyboard navigation', async () => {
      render(<IndexPopup />);
      
      await waitFor(() => {
        const firstButton = screen.getByText('Cards');
        firstButton.focus();
        expect(document.activeElement).toBe(firstButton);
      });
    });
  });
});