import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { testScenarios } from '../testData';

// Mock DOM environment for E2E tests
class MockDOM {
  private elements: Map<string, any> = new Map();
  private document: any;

  constructor() {
    this.document = {
      querySelector: jest.fn((selector: string) => this.elements.get(selector) || null),
      querySelectorAll: jest.fn((selector: string) => {
        const element = this.elements.get(selector);
        return element ? [element] : [];
      }),
      createElement: jest.fn((tag: string) => ({
        tagName: tag.toUpperCase(),
        textContent: '',
        style: {},
        setAttribute: jest.fn(),
        getAttribute: jest.fn()
      }))
    };
  }

  addElement(selector: string, properties: any = {}) {
    this.elements.set(selector, {
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      },
      ...properties
    });
  }

  setLocation(url: string) {
    const urlObj = new URL(url);
    global.window = {
      ...global.window,
      location: {
        href: url,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        search: urlObj.search
      }
    } as any;
  }

  getDocument() {
    return this.document;
  }

  reset() {
    this.elements.clear();
    jest.clearAllMocks();
  }
}

describe('E2E Merchant Detection Tests', () => {
  let mockDOM: MockDOM;

  beforeEach(() => {
    mockDOM = new MockDOM();
    global.document = mockDOM.getDocument();
    
    // Mock Chrome extension APIs
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      runtime: {
        sendMessage: jest.fn()
      }
    } as any;
  });

  afterEach(() => {
    mockDOM.reset();
  });

  describe('Cross-website merchant detection', () => {
    testScenarios.forEach(scenario => {
      it(`should detect ${scenario.name} correctly`, async () => {
        // Set up the test environment
        mockDOM.setLocation(scenario.url);
        
        if (scenario.hasCheckoutButton && scenario.checkoutSelector) {
          mockDOM.addElement(scenario.checkoutSelector, {
            textContent: 'Checkout',
            style: { display: 'block' }
          });
        }

        // Add price elements
        mockDOM.addElement('.price', {
          textContent: `$${scenario.amount.toFixed(2)}`
        });
        
        mockDOM.addElement('[data-testid="total"]', {
          textContent: `Total: $${scenario.amount.toFixed(2)}`
        });

        // Import and test the merchant detection
        const { merchantDetection } = await import('../../services/merchantDetection');
        
        // Test merchant detection
        const detectedMerchant = merchantDetection.detectMerchant(scenario.hostname);
        
        if (scenario.expectedMerchant !== 'Unknown Store') {
          expect(detectedMerchant).toBeDefined();
          expect(detectedMerchant?.name).toBe(scenario.expectedMerchant);
          expect(detectedMerchant?.category).toBe(scenario.expectedCategory);
        } else {
          expect(detectedMerchant).toBeNull();
        }

        // Test checkout detection
        const isCheckout = merchantDetection.isCheckoutPage();
        expect(isCheckout).toBe(scenario.hasCheckoutButton);

        // Test amount extraction
        const extractedAmount = merchantDetection.extractAmount();
        if (scenario.hasCheckoutButton) {
          expect(extractedAmount).toBeCloseTo(scenario.amount, 2);
        }
      });
    });
  });

  describe('Checkout flow simulation', () => {
    it('should handle Amazon checkout flow', async () => {
      const scenario = testScenarios.find(s => s.name === 'Amazon Checkout')!;
      
      // Simulate user navigating to Amazon product page
      mockDOM.setLocation('https://www.amazon.com/product/dp/B08N5WRWNW');
      
      let { merchantDetection } = await import('../../services/merchantDetection');
      
      expect(merchantDetection.detectMerchant('amazon.com')).toBeDefined();
      expect(merchantDetection.isCheckoutPage()).toBe(false);

      // Simulate navigating to checkout
      mockDOM.setLocation(scenario.url);
      mockDOM.addElement(scenario.checkoutSelector!, {
        textContent: 'Place your order',
        style: { display: 'block' }
      });
      
      mockDOM.addElement('#orderTotal', {
        textContent: `$${scenario.amount.toFixed(2)}`
      });

      // Re-import to get fresh state
      jest.resetModules();
      ({ merchantDetection } = await import('../../services/merchantDetection'));

      expect(merchantDetection.isCheckoutPage()).toBe(true);
      expect(merchantDetection.extractAmount()).toBeCloseTo(scenario.amount, 2);
    });

    it('should handle dynamic content loading', async () => {
      mockDOM.setLocation('https://www.netflix.com/signup/payment');
      
      // Initially no checkout button
      const { merchantDetection } = await import('../../services/merchantDetection');
      expect(merchantDetection.isCheckoutPage()).toBe(false);

      // Simulate dynamic content loading
      setTimeout(() => {
        mockDOM.addElement('.btn-blue', {
          textContent: 'Start Membership',
          style: { display: 'block' }
        });
      }, 100);

      // Wait for dynamic content
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(merchantDetection.isCheckoutPage()).toBe(true);
    });
  });

  describe('Real-world edge cases', () => {
    it('should handle subdomain variations', async () => {
      const subdomains = [
        'www.amazon.com',
        'smile.amazon.com',
        'music.amazon.com',
        'prime.amazon.com'
      ];

      const { merchantDetection } = await import('../../services/merchantDetection');

      subdomains.forEach(subdomain => {
        const merchant = merchantDetection.detectMerchant(subdomain);
        expect(merchant?.name).toBe('Amazon');
        expect(merchant?.category).toBe('online');
      });
    });

    it('should handle international domains', async () => {
      const internationalDomains = [
        'amazon.co.uk',
        'amazon.ca',
        'amazon.de',
        'amazon.fr'
      ];

      const { merchantDetection } = await import('../../services/merchantDetection');

      internationalDomains.forEach(domain => {
        const merchant = merchantDetection.detectMerchant(domain);
        // Should still detect as Amazon
        expect(merchant?.name).toBe('Amazon');
      });
    });

    it('should handle multiple price formats', async () => {
      mockDOM.setLocation('https://www.target.com/checkout');
      
      const priceFormats = [
        '$49.99',
        '$1,234.56',
        '€15.50',
        '£8.99',
        'Total: $25.00',
        '$12.34 USD',
        'Price: $67.89'
      ];

      const expectedAmounts = [49.99, 1234.56, 15.50, 8.99, 25.00, 12.34, 67.89];

      const { merchantDetection } = await import('../../services/merchantDetection');

      priceFormats.forEach((priceText, index) => {
        mockDOM.addElement('.price', { textContent: priceText });
        
        const amount = merchantDetection.extractAmount();
        expect(amount).toBeCloseTo(expectedAmounts[index], 2);
      });
    });

    it('should prioritize total amounts over subtotals', async () => {
      mockDOM.setLocation('https://www.walmart.com/checkout');
      
      // Add multiple price elements
      mockDOM.addElement('.subtotal', { textContent: 'Subtotal: $45.00' });
      mockDOM.addElement('.tax', { textContent: 'Tax: $3.60' });
      mockDOM.addElement('.total', { textContent: 'Total: $48.60' });
      
      const { merchantDetection } = await import('../../services/merchantDetection');

      // Should extract the total amount, not subtotal
      const amount = merchantDetection.extractAmount();
      expect(amount).toBeCloseTo(48.60, 2);
    });
  });

  describe('Performance and reliability', () => {
    it('should handle rapid page navigation', async () => {
      const urls = [
        'https://www.amazon.com/checkout',
        'https://www.target.com/cart',
        'https://www.walmart.com/checkout',
        'https://www.bestbuy.com/cart',
        'https://www.costco.com/checkout'
      ];

      const { merchantDetection } = await import('../../services/merchantDetection');

      // Simulate rapid navigation between sites
      for (const url of urls) {
        mockDOM.setLocation(url);
        const hostname = new URL(url).hostname;
        
        const merchant = merchantDetection.detectMerchant(hostname);
        expect(merchant).toBeDefined();
        
        // Each detection should be consistent
        const secondDetection = merchantDetection.detectMerchant(hostname);
        expect(secondDetection).toEqual(merchant);
      }
    });

    it('should handle malformed HTML gracefully', async () => {
      mockDOM.setLocation('https://www.amazon.com/checkout');
      
      // Simulate malformed DOM
      mockDOM.getDocument().querySelector.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const { merchantDetection } = await import('../../services/merchantDetection');

      // Should not crash
      expect(() => {
        merchantDetection.isCheckoutPage();
        merchantDetection.extractAmount();
      }).not.toThrow();
    });

    it('should cache merchant data efficiently', async () => {
      const { merchantDetection } = await import('../../services/merchantDetection');
      
      // First call
      const start1 = performance.now();
      merchantDetection.detectMerchant('amazon.com');
      const time1 = performance.now() - start1;

      // Second call should be faster (cached)
      const start2 = performance.now();
      merchantDetection.detectMerchant('amazon.com');
      const time2 = performance.now() - start2;

      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Cross-browser compatibility', () => {
    it('should work with different querySelector implementations', async () => {
      // Mock different browser behaviors
      const alternativeQuerySelector = jest.fn((selector: string) => {
        if (selector === '#placeYourOrder') {
          return { textContent: 'Place Order', style: { display: 'block' } };
        }
        return null;
      });

      mockDOM.getDocument().querySelector = alternativeQuerySelector;
      mockDOM.setLocation('https://www.amazon.com/checkout');

      const { merchantDetection } = await import('../../services/merchantDetection');
      
      expect(merchantDetection.isCheckoutPage()).toBe(true);
      expect(alternativeQuerySelector).toHaveBeenCalled();
    });

    it('should handle missing browser APIs gracefully', async () => {
      // Simulate missing APIs
      delete (global as any).chrome;
      
      const { merchantDetection } = await import('../../services/merchantDetection');
      
      // Should still work for basic detection
      expect(() => {
        merchantDetection.detectMerchant('amazon.com');
        merchantDetection.getCategory('amazon.com');
      }).not.toThrow();
    });
  });

  describe('Security considerations', () => {
    it('should sanitize extracted data', async () => {
      mockDOM.setLocation('https://www.target.com/checkout');
      
      // Malicious content in price element
      mockDOM.addElement('.price', {
        textContent: '<script>alert("xss")</script>$49.99'
      });

      const { merchantDetection } = await import('../../services/merchantDetection');
      
      const amount = merchantDetection.extractAmount();
      expect(amount).toBe(49.99); // Should extract only the price
    });

    it('should not expose sensitive information', async () => {
      mockDOM.setLocation('https://www.amazon.com/checkout');
      mockDOM.addElement('.credit-card', {
        textContent: 'Card ending in 1234'
      });

      const { merchantDetection } = await import('../../services/merchantDetection');
      
      // Should not extract credit card information
      const amount = merchantDetection.extractAmount();
      expect(amount).toBeNull(); // No valid price found
    });
  });
});