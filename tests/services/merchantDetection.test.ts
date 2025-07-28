import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { merchantDetection } from '../../services/merchantDetection';
import { testScenarios } from '../testData';

describe('MerchantDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectMerchant', () => {
    it('should detect known merchants correctly', () => {
      const testCases = [
        { hostname: 'amazon.com', expected: 'Amazon' },
        { hostname: 'www.amazon.com', expected: 'Amazon' },
        { hostname: 'smile.amazon.com', expected: 'Amazon' },
        { hostname: 'wholefoodsmarket.com', expected: 'Whole Foods Market' },
        { hostname: 'www.mcdonalds.com', expected: "McDonald's" },
        { hostname: 'netflix.com', expected: 'Netflix' },
        { hostname: 'shell.com', expected: 'Shell' }
      ];

      testCases.forEach(({ hostname, expected }) => {
        const result = merchantDetection.detectMerchant(hostname);
        expect(result?.name).toBe(expected);
      });
    });

    it('should return null for unknown merchants', () => {
      const result = merchantDetection.detectMerchant('unknown-website.com');
      expect(result).toBeNull();
    });

    it('should handle subdomains correctly', () => {
      const testCases = [
        'www.amazon.com',
        'smile.amazon.com',
        'prime.amazon.com',
        'music.amazon.com'
      ];

      testCases.forEach(hostname => {
        const result = merchantDetection.detectMerchant(hostname);
        expect(result?.name).toBe('Amazon');
        expect(result?.category).toBe('online');
      });
    });

    it('should be case insensitive', () => {
      const result = merchantDetection.detectMerchant('AMAZON.COM');
      expect(result?.name).toBe('Amazon');
    });
  });

  describe('getCategory', () => {
    it('should return correct categories for known merchants', () => {
      const testCases = [
        { hostname: 'amazon.com', expected: 'online' },
        { hostname: 'wholefoodsmarket.com', expected: 'groceries' },
        { hostname: 'mcdonalds.com', expected: 'dining' },
        { hostname: 'shell.com', expected: 'gas' },
        { hostname: 'target.com', expected: 'department_stores' }
      ];

      testCases.forEach(({ hostname, expected }) => {
        const category = merchantDetection.getCategory(hostname);
        expect(category).toBe(expected);
      });
    });

    it('should return general category for unknown merchants', () => {
      const category = merchantDetection.getCategory('unknown-site.com');
      expect(category).toBe('general');
    });
  });

  describe('isCheckoutPage', () => {
    beforeEach(() => {
      // Mock DOM methods
      document.querySelector = jest.fn();
      document.querySelectorAll = jest.fn();
    });

    it('should detect checkout pages by URL patterns', () => {
      const checkoutUrls = [
        'https://amazon.com/checkout',
        'https://amazon.com/gp/buy/spc',
        'https://target.com/cart',
        'https://walmart.com/checkout',
        'https://example.com/payment',
        'https://shop.com/order-review'
      ];

      checkoutUrls.forEach(url => {
        // Mock window.location
        Object.defineProperty(window, 'location', {
          value: { href: url, pathname: new URL(url).pathname },
          writable: true
        });

        const result = merchantDetection.isCheckoutPage();
        expect(result).toBe(true);
      });
    });

    it('should detect checkout pages by DOM selectors', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/shop', pathname: '/shop' },
        writable: true
      });

      // Mock finding checkout button
      (document.querySelector as jest.Mock).mockReturnValue(document.createElement('button'));

      const result = merchantDetection.isCheckoutPage();
      expect(result).toBe(true);
    });

    it('should return false for non-checkout pages', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/home', pathname: '/home' },
        writable: true
      });

      (document.querySelector as jest.Mock).mockReturnValue(null);

      const result = merchantDetection.isCheckoutPage();
      expect(result).toBe(false);
    });
  });

  describe('extractAmount', () => {
    beforeEach(() => {
      document.querySelector = jest.fn();
      document.querySelectorAll = jest.fn();
    });

    it('should extract amounts from common selectors', () => {
      const testCases = [
        { text: '$49.99', expected: 49.99 },
        { text: '$1,234.56', expected: 1234.56 },
        { text: 'Total: $25.00', expected: 25.00 },
        { text: '€15.50', expected: 15.50 },
        { text: '£8.99', expected: 8.99 }
      ];

      testCases.forEach(({ text, expected }) => {
        const mockElement = { textContent: text };
        (document.querySelector as jest.Mock).mockReturnValue(mockElement);

        const result = merchantDetection.extractAmount();
        expect(result).toBe(expected);
      });
    });

    it('should return null when no amount found', () => {
      (document.querySelector as jest.Mock).mockReturnValue(null);
      (document.querySelectorAll as jest.Mock).mockReturnValue([]);

      const result = merchantDetection.extractAmount();
      expect(result).toBeNull();
    });

    it('should handle multiple price elements', () => {
      const mockElements = [
        { textContent: 'Subtotal: $10.00' },
        { textContent: 'Tax: $2.00' },
        { textContent: 'Total: $12.00' }
      ];

      (document.querySelector as jest.Mock).mockReturnValue(null);
      (document.querySelectorAll as jest.Mock).mockReturnValue(mockElements);

      const result = merchantDetection.extractAmount();
      expect(result).toBe(12.00); // Should pick the highest amount
    });
  });

  describe('getAllMerchants', () => {
    it('should return all supported merchants', () => {
      const merchants = merchantDetection.getAllMerchants();
      
      expect(merchants).toBeDefined();
      expect(merchants.length).toBeGreaterThan(50); // Should have 60+ merchants
      
      // Verify structure
      merchants.forEach(merchant => {
        expect(merchant).toHaveProperty('name');
        expect(merchant).toHaveProperty('domain');
        expect(merchant).toHaveProperty('category');
        expect(typeof merchant.name).toBe('string');
        expect(typeof merchant.domain).toBe('string');
        expect(typeof merchant.category).toBe('string');
      });
    });

    it('should include major merchant categories', () => {
      const merchants = merchantDetection.getAllMerchants();
      const categories = new Set(merchants.map(m => m.category));
      
      const expectedCategories = [
        'groceries', 'dining', 'gas', 'travel', 
        'online', 'department_stores', 'electronics'
      ];
      
      expectedCategories.forEach(category => {
        expect(categories.has(category)).toBe(true);
      });
    });
  });

  describe('integration with test scenarios', () => {
    it('should handle all test scenarios correctly', () => {
      testScenarios.forEach(scenario => {
        const merchant = merchantDetection.detectMerchant(scenario.hostname);
        
        if (scenario.expectedMerchant !== 'Unknown Store') {
          expect(merchant).toBeDefined();
          expect(merchant?.name).toBe(scenario.expectedMerchant);
          expect(merchant?.category).toBe(scenario.expectedCategory);
        } else {
          expect(merchant).toBeNull();
        }
      });
    });
  });
});