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
  {
    name: "Publix",
    domain: "publix.com",
    category: "groceries",
    checkoutSelectors: [".checkout", "#checkout", ".cart-summary"]
  },
  {
    name: "H-E-B",
    domain: "heb.com",
    category: "groceries",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Wegmans",
    domain: "wegmans.com",
    category: "groceries",
    checkoutSelectors: [".checkout", "#checkout", ".order-summary"]
  },
  {
    name: "Trader Joe's",
    domain: "traderjoes.com",
    category: "groceries",
    checkoutSelectors: [".checkout", "#checkout", ".cart-checkout"]
  },

  // General/Online
  {
    name: "Amazon",
    domain: "amazon.com",
    category: "online",
    checkoutSelectors: ["#checkout", ".checkout-page", "#subtotals-marketplace", ".payment-section"]
  },
  {
    name: "Walmart",
    domain: "walmart.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".payment-methods", ".cart-pos-review-checkout"]
  },
  {
    name: "eBay",
    domain: "ebay.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Etsy",
    domain: "etsy.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-info"]
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
  {
    name: "Apple",
    domain: "apple.com",
    category: "electronics",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Micro Center",
    domain: "microcenter.com",
    category: "electronics",
    checkoutSelectors: [".checkout", "#checkout", ".cart-summary"]
  },
  {
    name: "B&H Photo",
    domain: "bhphotovideo.com",
    category: "electronics",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
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
  {
    name: "Nordstrom",
    domain: "nordstrom.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Kohl's",
    domain: "kohls.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".order-summary"]
  },
  {
    name: "JCPenney",
    domain: "jcpenney.com",
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
  {
    name: "Sam's Club",
    domain: "samsclub.com",
    category: "warehouse_clubs",
    checkoutSelectors: [".checkout", "#checkout", ".cart-summary"]
  },
  {
    name: "BJ's Wholesale",
    domain: "bjs.com",
    category: "warehouse_clubs",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },

  // Gas Stations
  {
    name: "Shell",
    domain: "shell.com",
    category: "gas",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },
  {
    name: "Exxon Mobil",
    domain: "exxon.com",
    category: "gas",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "BP",
    domain: "bp.com",
    category: "gas",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },
  {
    name: "Chevron",
    domain: "chevron.com",
    category: "gas",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
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
  {
    name: "American Airlines",
    domain: "aa.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Delta Air Lines",
    domain: "delta.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },
  {
    name: "United Airlines",
    domain: "united.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Booking.com",
    domain: "booking.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Hotels.com",
    domain: "hotels.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".booking-form"]
  },
  {
    name: "Airbnb",
    domain: "airbnb.com",
    category: "travel",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },

  // Dining & Food Delivery
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
  {
    name: "Grubhub",
    domain: "grubhub.com",
    category: "dining",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Postmates",
    domain: "postmates.com",
    category: "dining",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },
  {
    name: "Seamless",
    domain: "seamless.com",
    category: "dining",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },

  // Pharmacy & Health
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
  },
  {
    name: "Rite Aid",
    domain: "riteaid.com",
    category: "pharmacy",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },

  // Streaming & Entertainment
  {
    name: "Netflix",
    domain: "netflix.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section", ".signup-form"]
  },
  {
    name: "Disney+",
    domain: "disneyplus.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-info"]
  },
  {
    name: "Hulu",
    domain: "hulu.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "HBO Max",
    domain: "hbomax.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },
  {
    name: "Amazon Prime Video",
    domain: "primevideo.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Spotify",
    domain: "spotify.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section", ".subscription-form"]
  },
  {
    name: "Apple Music",
    domain: "music.apple.com",
    category: "online",
    checkoutSelectors: [".checkout", "#checkout", ".payment-info"]
  },

  // Home Improvement
  {
    name: "Home Depot",
    domain: "homedepot.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Lowe's",
    domain: "lowes.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".cart-summary"]
  },
  {
    name: "Menards",
    domain: "menards.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },

  // Fashion & Apparel
  {
    name: "Nike",
    domain: "nike.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Adidas",
    domain: "adidas.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".payment-info"]
  },
  {
    name: "Under Armour",
    domain: "underarmour.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Gap",
    domain: "gap.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".payment-form"]
  },
  {
    name: "Old Navy",
    domain: "oldnavy.com",
    category: "department_stores",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },

  // Office & Business
  {
    name: "Staples",
    domain: "staples.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "Office Depot",
    domain: "officedepot.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".cart-summary"]
  },

  // Pet Supplies
  {
    name: "Petco",
    domain: "petco.com",
    category: "general",
    checkoutSelectors: [".checkout", "#checkout", ".payment-section"]
  },
  {
    name: "PetSmart",
    domain: "petsmart.com",
    category: "general",
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