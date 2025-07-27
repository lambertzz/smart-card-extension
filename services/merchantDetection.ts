import type { Merchant, MerchantCategory } from "~types";

const MERCHANTS: Merchant[] = [
  // Groceries
  {
    name: "Safeway",
    domain: "safeway.com",
    category: "groceries",
    checkoutSelectors: [".checkout", "#checkout", "[data-testid*='checkout']", ".cart-summary"]
  },
  {
    name: "Kroger",
    domain: "kroger.com", 
    category: "groceries",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Whole Foods",
    domain: "wholefoodsmarket.com",
    category: "groceries", 
    checkoutSelectors: [".checkout", "#checkout", ".cart-checkout"]
  },

  // General/Online
  {
    name: "Amazon",
    domain: "amazon.com",
    category: "general",
    checkoutSelectors: ["#checkout", ".checkout-page", "#subtotals-marketplace", ".payment-section"]
  },
  {
    name: "Walmart",
    domain: "walmart.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".payment-methods", ".cart-pos-review-checkout"]
  },
  
  // Electronics
  {
    name: "Best Buy",
    domain: "bestbuy.com",
    category: "electronics",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section", ".order-summary"]
  },
  {
    name: "Newegg",
    domain: "newegg.com",
    category: "electronics",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },

  // Department Stores
  {
    name: "Target",
    domain: "target.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", "[data-test='checkout-page']", ".payment-section"]
  },
  {
    name: "Macy's",
    domain: "macys.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".payment-methods"]
  },

  // Warehouse Clubs
  {
    name: "Costco",
    domain: "costco.com",
    category: "warehouse_clubs",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },

  // Gas
  {
    name: "Shell",
    domain: "shell.com",
    category: "gas",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },

  // Travel
  {
    name: "Expedia",
    domain: "expedia.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section", ".booking-form"]
  },
  {
    name: "Southwest Airlines",
    domain: "southwest.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },

  // Dining
  {
    name: "DoorDash",
    domain: "doordash.com",
    category: "dining",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section", "[data-testid*='checkout']"]
  },
  {
    name: "Uber Eats",
    domain: "ubereats.com",
    category: "dining",
    checkoutSelectors: [".checkout", "#checkout", ".payment-methods"]
  },

  // Pharmacy
  {
    name: "CVS",
    domain: "cvs.com",
    category: "pharmacy",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Walgreens",
    domain: "walgreens.com",
    category: "pharmacy",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  }
];

class MerchantDetectionService {
  getCurrentMerchant(): Merchant | null {
    const hostname = window.location.hostname.replace('www.', '');
    
    return MERCHANTS.find(merchant => 
      hostname.includes(merchant.domain) || 
      merchant.domain.includes(hostname)
    ) || null;
  }

  isOnCheckoutPage(): boolean {
    const merchant = this.getCurrentMerchant();
    if (!merchant) return false;

    // Check URL patterns
    const checkoutUrlPatterns = [
      '/checkout',
      '/cart',
      '/payment',
      '/billing',
      '/order-review',
      '/place-order'
    ];

    const currentPath = window.location.pathname.toLowerCase();
    const hasCheckoutUrl = checkoutUrlPatterns.some(pattern => 
      currentPath.includes(pattern)
    );

    if (hasCheckoutUrl) return true;

    // Check for checkout elements on page
    return merchant.checkoutSelectors.some(selector => {
      const elements = document.querySelectorAll(selector);
      return elements.length > 0;
    });
  }

  getMerchantCategory(domain?: string): MerchantCategory {
    const targetDomain = domain || window.location.hostname.replace('www.', '');
    const merchant = MERCHANTS.find(m => 
      targetDomain.includes(m.domain) || m.domain.includes(targetDomain)
    );
    
    return merchant?.category || 'general';
  }

  getAllMerchants(): Merchant[] {
    return [...MERCHANTS];
  }

  addCustomMerchant(merchant: Merchant): void {
    MERCHANTS.push(merchant);
  }
}

export const merchantDetectionService = new MerchantDetectionService();