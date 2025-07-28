import type { CreditCard, Transaction, MerchantCategory } from "~types";

export const mockCreditCards: CreditCard[] = [
  {
    id: "card1",
    name: "Chase Freedom Flex",
    rewardStructure: [
      {
        category: "groceries",
        rewardRate: 0.05, // 5%
        cap: {
          amount: 1500,
          period: "quarterly",
          currentUsage: 800
        }
      },
      {
        category: "general",
        rewardRate: 0.01 // 1%
      }
    ],
    isActive: true,
    createdAt: new Date("2024-01-01")
  },
  {
    id: "card2",
    name: "Citi Double Cash",
    rewardStructure: [
      {
        category: "general",
        rewardRate: 0.02 // 2%
      }
    ],
    isActive: true,
    createdAt: new Date("2024-01-15")
  },
  {
    id: "card3",
    name: "Capital One Savor",
    rewardStructure: [
      {
        category: "dining",
        rewardRate: 0.04 // 4%
      },
      {
        category: "groceries",
        rewardRate: 0.02 // 2%
      }
    ],
    isActive: true,
    createdAt: new Date("2024-02-01")
  },
  {
    id: "card4",
    name: "Inactive Card",
    rewardStructure: [
      {
        category: "gas",
        rewardRate: 0.03
      }
    ],
    isActive: false,
    createdAt: new Date("2023-12-01")
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: "txn1",
    merchantName: "Whole Foods",
    category: "groceries",
    amount: 85.50,
    cardUsed: "card1",
    recommendedCard: "card1",
    potentialSavings: 3.42, // 4% vs 1%
    timestamp: new Date("2024-03-01")
  },
  {
    id: "txn2",
    merchantName: "McDonald's",
    category: "dining",
    amount: 12.50,
    cardUsed: "card2",
    recommendedCard: "card3",
    potentialSavings: 0.25, // 4% vs 2%
    timestamp: new Date("2024-03-02")
  },
  {
    id: "txn3",
    merchantName: "Amazon",
    category: "online",
    amount: 45.99,
    cardUsed: "card2",
    recommendedCard: "card2",
    potentialSavings: 0.46,
    timestamp: new Date("2024-03-03")
  },
  {
    id: "txn4",
    merchantName: "Shell Gas Station",
    category: "gas",
    amount: 60.00,
    cardUsed: "card2",
    recommendedCard: "card2",
    potentialSavings: 1.20,
    timestamp: new Date("2024-02-28")
  }
];

export const mockMerchants = [
  {
    name: "Amazon",
    domain: "amazon.com",
    category: "online" as MerchantCategory,
    checkoutSelectors: [
      "#placeYourOrder",
      "[name='placeYourOrder']",
      ".a-button-primary"
    ]
  },
  {
    name: "Whole Foods",
    domain: "wholefoodsmarket.com",
    category: "groceries" as MerchantCategory,
    checkoutSelectors: [
      ".checkout-button",
      "#checkout",
      "[data-testid='checkout-button']"
    ]
  },
  {
    name: "McDonald's",
    domain: "mcdonalds.com",
    category: "dining" as MerchantCategory,
    checkoutSelectors: [
      ".checkout-btn",
      "#place-order",
      ".order-button"
    ]
  },
  {
    name: "Netflix",
    domain: "netflix.com",
    category: "online" as MerchantCategory,
    checkoutSelectors: [
      ".btn-blue",
      "[data-uia='action-continue']",
      ".nf-btn-primary"
    ]
  },
  {
    name: "Shell",
    domain: "shell.com",
    category: "gas" as MerchantCategory,
    checkoutSelectors: [
      ".pay-button",
      "#complete-payment",
      ".fuel-payment-btn"
    ]
  }
];

export const mockSettings = {
  enableNotifications: true,
  trackSpending: true,
  darkMode: false
};

export const mockStorageData = {
  cards: mockCreditCards.filter(c => c.isActive),
  transactions: mockTransactions,
  settings: mockSettings
};

// Test scenarios for different websites
export const testScenarios = [
  {
    name: "Amazon Checkout",
    url: "https://www.amazon.com/gp/buy/spc/handlers/display.html",
    hostname: "amazon.com",
    expectedMerchant: "Amazon",
    expectedCategory: "online",
    amount: 49.99,
    expectedCard: "card2", // Citi Double Cash 2%
    hasCheckoutButton: true,
    checkoutSelector: "#placeYourOrder"
  },
  {
    name: "Whole Foods Grocery",
    url: "https://www.wholefoodsmarket.com/checkout",
    hostname: "wholefoodsmarket.com",
    expectedMerchant: "Whole Foods",
    expectedCategory: "groceries",
    amount: 120.00,
    expectedCard: "card1", // Chase Freedom Flex 5% on groceries
    hasCheckoutButton: true,
    checkoutSelector: ".checkout-button"
  },
  {
    name: "McDonald's Mobile Order",
    url: "https://www.mcdonalds.com/us/en-us/order.html",
    hostname: "mcdonalds.com",
    expectedMerchant: "McDonald's",
    expectedCategory: "dining",
    amount: 15.75,
    expectedCard: "card3", // Capital One Savor 4% on dining
    hasCheckoutButton: true,
    checkoutSelector: "#place-order"
  },
  {
    name: "Netflix Subscription",
    url: "https://www.netflix.com/signup/payment",
    hostname: "netflix.com",
    expectedMerchant: "Netflix",
    expectedCategory: "online",
    amount: 15.49,
    expectedCard: "card2", // Citi Double Cash 2%
    hasCheckoutButton: true,
    checkoutSelector: ".btn-blue"
  },
  {
    name: "Shell Gas Payment",
    url: "https://www.shell.com/motorist/payment",
    hostname: "shell.com",
    expectedMerchant: "Shell",
    expectedCategory: "gas",
    amount: 45.00,
    expectedCard: "card2", // Best available since gas card is inactive
    hasCheckoutButton: true,
    checkoutSelector: ".pay-button"
  },
  {
    name: "Unknown Website",
    url: "https://unknown-store.com/checkout",
    hostname: "unknown-store.com",
    expectedMerchant: "Unknown Store",
    expectedCategory: "general",
    amount: 25.00,
    expectedCard: "card2", // Citi Double Cash 2% general
    hasCheckoutButton: false,
    checkoutSelector: null
  }
];