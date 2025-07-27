import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://*.amazon.com/*",
    "https://*.walmart.com/*", 
    "https://*.target.com/*",
    "https://*.bestbuy.com/*",
    "https://*.safeway.com/*",
    "https://*.kroger.com/*",
    "https://*.wholefoodsmarket.com/*",
    "https://*.costco.com/*",
    "https://*.macys.com/*",
    "https://*.newegg.com/*",
    "https://*.cvs.com/*",
    "https://*.walgreens.com/*",
    "https://*.doordash.com/*",
    "https://*.ubereats.com/*",
    "https://*.expedia.com/*",
    "https://*.southwest.com/*",
    "https://*.shell.com/*"
  ]
}


// Simple checkout detection based on URL and basic page elements
let checkoutOverlay: HTMLElement | null = null
let lastOverlayShown = 0 // Timestamp of last overlay shown
const OVERLAY_COOLDOWN = 30000 // 30 seconds cooldown between overlays

function isCheckoutPage(): boolean {
  const url = window.location.href.toLowerCase()
  const hostname = window.location.hostname.toLowerCase()
  
  // Amazon specific checkout detection - be more precise
  if (hostname.includes('amazon.com')) {
    // Only trigger on actual FINAL checkout pages, NOT cart pages
    const isAmazonFinalCheckout = url.includes('/gp/buy/spc/') || 
                                 url.includes('/checkout/p/') ||
                                 (url.includes('/checkout/') && !url.includes('/gp/cart/')) ||
                                 url.includes('pipelinetype=chewbacca')
    
    // Explicitly exclude cart pages
    const isCartPage = url.includes('/gp/cart/view') || url.includes('/gp/cart/')
    
    if (isAmazonFinalCheckout && !isCartPage) {
      return true
    }
    
    if (isCartPage) {
      // Cache the amount but don't show overlay
      const amount = estimateTransactionAmount()
      if (amount > 100) {
        cacheCartAmount(amount)
      }
    }
    
    return false // Don't check other conditions for Amazon
  }
  
  // For other sites, be more restrictive
  const strictCheckoutKeywords = ['checkout', 'payment', 'billing']
  const hasStrictCheckoutUrl = strictCheckoutKeywords.some(keyword => url.includes(keyword))
  
  // Only check cart if combined with other indicators
  const hasCartUrl = url.includes('/cart') && (
    document.querySelector('.checkout-button') ||
    document.querySelector('[data-testid*="checkout"]') ||
    document.querySelector('.payment-section')
  )
  
  if (hasStrictCheckoutUrl || hasCartUrl) {
    return true
  }
  
  return false
}

async function showRecommendationOverlay() {
  if (checkoutOverlay) return
  
  // Check cooldown to prevent spam
  const now = Date.now()
  if (now - lastOverlayShown < OVERLAY_COOLDOWN) {
    return
  }
  
  lastOverlayShown = now
  
  try {
    // Get user's cards from storage
    const result = await chrome.storage.local.get('creditCards')
    const cards = result.creditCards || []
    
    if (cards.length === 0) {
      showAddCardsOverlay()
      return
    }
    
    // Get recommendation
    const recommendation = await getBestRecommendation(cards)
    
    if (recommendation) {
      showCardRecommendationOverlay(recommendation)
    } else {
      showAddCardsOverlay()
    }
  } catch (error) {
    showAddCardsOverlay()
  }
}

function showAddCardsOverlay() {
  checkoutOverlay = document.createElement('div')
  checkoutOverlay.id = 'credit-card-recommendation-overlay'
  checkoutOverlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div style="font-weight: 600; font-size: 16px;">💳 Credit Card Assistant</div>
        <button id="cc-overlay-close" style="
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
        ">×</button>
      </div>
      
      <div style="margin-bottom: 12px;">
        <div style="opacity: 0.9; margin-bottom: 8px;">
          Add your credit cards to get personalized recommendations for the best rewards!
        </div>
      </div>
      
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
        <button id="cc-overlay-manage" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          width: 100%;
        ">Add Credit Cards</button>
      </div>
    </div>
  `
  addOverlayToPage()
}

function showCardRecommendationOverlay(recommendation) {
  checkoutOverlay = document.createElement('div')
  checkoutOverlay.id = 'credit-card-recommendation-overlay'
  checkoutOverlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div style="font-weight: 600; font-size: 16px;">💳 Best Card</div>
        <button id="cc-overlay-close" style="
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
        ">×</button>
      </div>
      
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">${recommendation.cardName}</div>
        <div style="opacity: 0.9; margin-bottom: 8px; font-size: 13px;">
          ${recommendation.reasoning}
        </div>
        <div style="font-size: 12px; opacity: 0.8; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px;">
          💰 Earn $${recommendation.rewardAmount.toFixed(2)} cashback on $${recommendation.estimatedAmount.toFixed(2)} at ${recommendation.merchantName}
        </div>
      </div>
      
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.2); display: flex; gap: 8px;">
        <button id="cc-overlay-manage" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          flex: 1;
        ">Manage Cards</button>
        <button id="cc-overlay-used" style="
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #059669;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          flex: 1;
          font-weight: 600;
        ">Used This Card</button>
      </div>
    </div>
  `
  addOverlayToPage()
}

function addOverlayToPage() {
  document.body.appendChild(checkoutOverlay)

  const closeBtn = checkoutOverlay.querySelector('#cc-overlay-close')
  closeBtn?.addEventListener('click', hideRecommendationOverlay)

  const manageBtn = checkoutOverlay.querySelector('#cc-overlay-manage')
  manageBtn?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' })
  })

  const usedBtn = checkoutOverlay.querySelector('#cc-overlay-used')
  usedBtn?.addEventListener('click', () => {
    hideRecommendationOverlay()
  })

  setTimeout(() => {
    if (checkoutOverlay) {
      hideRecommendationOverlay()
    }
  }, 12000) // Longer timeout for recommendations
}

async function getBestRecommendation(cards) {
  const hostname = window.location.hostname.toLowerCase()
  
  // Merchant detection
  const merchantMap = {
    'amazon.com': { name: 'Amazon', category: 'online' },
    'walmart.com': { name: 'Walmart', category: 'general' },
    'target.com': { name: 'Target', category: 'department_stores' },
    'bestbuy.com': { name: 'Best Buy', category: 'electronics' },
    'safeway.com': { name: 'Safeway', category: 'groceries' },
    'kroger.com': { name: 'Kroger', category: 'groceries' },
    'wholefoodsmarket.com': { name: 'Whole Foods', category: 'groceries' },
    'costco.com': { name: 'Costco', category: 'warehouse_clubs' },
    'macys.com': { name: "Macy's", category: 'department_stores' },
    'cvs.com': { name: 'CVS', category: 'pharmacy' },
    'doordash.com': { name: 'DoorDash', category: 'dining' },
    'ubereats.com': { name: 'Uber Eats', category: 'dining' },
    'expedia.com': { name: 'Expedia', category: 'travel' },
    'southwest.com': { name: 'Southwest', category: 'travel' }
  }
  
  const merchant = Object.entries(merchantMap).find(([domain]) => 
    hostname.includes(domain)
  )?.[1] || { name: hostname, category: 'general' }
  
  // Estimate transaction amount with retry for dynamic pages
  const estimatedAmount = await estimateTransactionAmountWithRetry()
  
  // Find best card
  let bestCard = null
  let bestReward = 0
  
  for (const card of cards) {
    // Try exact category match first, then general fallback
    let matchingRule = card.rewardStructure.find(rule => rule.category === merchant.category)
    if (!matchingRule) {
      matchingRule = card.rewardStructure.find(rule => rule.category === 'general')
    }
    
    if (matchingRule) {
      let effectiveAmount = estimatedAmount
      let rewardRate = matchingRule.rewardRate
      
      // Check cap limitations
      if (matchingRule.cap) {
        const remaining = matchingRule.cap.amount - (matchingRule.cap.currentUsage || 0)
        if (remaining <= 0) {
          effectiveAmount = 0 // Cap reached
        } else if (effectiveAmount > remaining) {
          effectiveAmount = remaining // Partial reward
        }
      }
      
      const rewardAmount = effectiveAmount * rewardRate
      
      if (rewardAmount > bestReward) {
        bestReward = rewardAmount
        bestCard = {
          card,
          rule: matchingRule,
          rewardAmount,
          effectiveAmount
        }
      }
    }
  }
  
  if (!bestCard) {
    return null
  }
  
  // Create reasoning
  let reasoning = `${(bestCard.rule.rewardRate * 100).toFixed(1)}% back on ${bestCard.rule.category}`
  if (bestCard.rule.cap) {
    const used = bestCard.rule.cap.currentUsage || 0
    const remaining = bestCard.rule.cap.amount - used
    if (remaining <= 0) {
      reasoning += ` (cap reached)`
    } else {
      reasoning += ` ($${remaining.toFixed(0)} left of $${bestCard.rule.cap.amount} ${bestCard.rule.cap.period} cap)`
    }
  }
  
  return {
    cardName: bestCard.card.name,
    reasoning,
    rewardAmount: bestCard.rewardAmount,
    estimatedAmount,
    merchantName: merchant.name,
    category: merchant.category
  }
}

async function estimateTransactionAmountWithRetry() {
  const hostname = window.location.hostname.toLowerCase()
  
  // For Amazon, use DOM observer approach since content loads dynamically
  if (hostname.includes('amazon.com')) {
    return await waitForAmazonPriceElements()
  }
  
  // For other sites, use the original retry approach
  const maxRetries = 3
  const delays = [0, 1000, 2000] // 0ms, 1s, 2s
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, delays[attempt]))
    }
    
    const amount = estimateTransactionAmount()
    if (amount > 100) {
      return amount
    }
  }
  return 100
}

async function waitForAmazonPriceElements(): Promise<number> {
  const cachedAmount = await getCachedCartAmount()
  
  return new Promise((resolve) => {
    let attempts = 0
    const maxAttempts = 10
    const checkInterval = 500 // Check every 500ms
    
    const checkForPrices = () => {
      attempts++
      
      // Check for dollar elements
      const allElements = document.querySelectorAll('*')
      let foundDollarElements = 0
      
      for (const element of allElements) {
        const text = element.textContent || ''
        if (text.includes('$') && text.length < 100) {
          foundDollarElements++
        }
      }
      
      if (foundDollarElements > 0) {
        const amount = estimateTransactionAmount()
        if (amount > 100) {
          cacheCartAmount(amount)
          resolve(amount)
          return
        }
      }
      
      // Try text pattern detection
      const textAmount = detectCheckoutPageAmount()
      if (textAmount > 100) {
        resolve(textAmount)
        return
      }
      
      if (attempts >= maxAttempts) {
        if (cachedAmount && cachedAmount > 100) {
          resolve(cachedAmount)
        } else {
          resolve(100)
        }
        return
      }
      
      setTimeout(checkForPrices, checkInterval)
    }
    
    // Start checking immediately
    checkForPrices()
    
    // Set up MutationObserver for dynamic content
    const observer = new MutationObserver(() => {
      // Content changed, let the interval handle checking
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    setTimeout(() => {
      observer.disconnect()
    }, maxAttempts * checkInterval + 1000)
  })
}

async function getCachedCartAmount(): Promise<number | null> {
  try {
    const result = await chrome.storage.local.get('lastCartAmount')
    const cached = result.lastCartAmount
    if (cached && cached.timestamp && Date.now() - cached.timestamp < 600000) {
      return cached.amount
    }
  } catch (error) {
    // Silent error handling
  }
  return null
}

async function cacheCartAmount(amount: number): Promise<void> {
  try {
    const url = window.location.href
    if (url.includes('/gp/cart/') && amount > 100) {
      await chrome.storage.local.set({
        lastCartAmount: {
          amount,
          timestamp: Date.now(),
          url
        }
      })
    }
  } catch (error) {
    // Silent error handling
  }
}

function detectCheckoutPageAmount(): number {
  const textPatterns = [
    /order total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /grand total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /amount due[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ]
  
  const allText = document.body.textContent || document.body.innerText || ''
  
  for (const pattern of textPatterns) {
    const match = allText.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      if (amount > 5 && amount < 10000) {
        return amount
      }
    }
  }
  
  // Look for elements containing "Order total"
  const allElements = document.querySelectorAll('*')
  for (const element of allElements) {
    const text = element.textContent || ''
    if (text.toLowerCase().includes('order total') && text.includes('$')) {
      const match = text.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/)
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''))
        if (amount > 50) {
          return amount
        }
      }
    }
  }
  
  return 0
}

function estimateTransactionAmount() {
  const hostname = window.location.hostname.toLowerCase()
  
  // Site-specific selectors for better accuracy
  const siteSpecificSelectors = {
    'amazon.com': [
      // Cart page selectors
      '#subtotals-marketplace .a-price .a-offscreen',
      '#subtotals-marketplace .a-price-whole',
      '.grand-total-price .a-price .a-offscreen',
      '.order-total .a-price .a-offscreen',
      '.pmts-summary-preview-single-item-amount .a-price .a-offscreen',
      '.a-price.a-text-price.a-size-medium.a-color-price .a-offscreen',
      
      // Checkout page selectors
      '.order-summary-content .a-price .a-offscreen',
      '.pmts-order-summary .a-price .a-offscreen', 
      '.pmts-summary-preview .a-price .a-offscreen',
      '.order-summary .grand-total-price .a-offscreen',
      '.payment-summary .grand-total .a-offscreen',
      '.pmts-widget-section .a-price .a-offscreen',
      '.pmts-summary .a-price .a-offscreen',
      '.order-total-container .a-price .a-offscreen',
      
      // Additional patterns for different checkout flows
      '[data-testid="order-total"] .a-price .a-offscreen',
      '.checkout-order-summary .a-price .a-offscreen',
      '.payment-widget .a-price .a-offscreen',
      '.order-summary-widget .a-price .a-offscreen'
    ],
    'walmart.com': [
      '[data-automation-id="order-total"] .w_iUH7',
      '.order-total-line .price-display',
      '[data-testid="subtotal-value"]',
      '.subtotal-amount'
    ],
    'target.com': [
      '[data-test="order-summary-total"]',
      '[data-test="total-price"]',
      '.order-total .h-text-lg'
    ],
    'safeway.com': [
      '.order-total .price',
      '.total-amount .price',
      '.checkout-total .amount',
      '.grand-total'
    ],
    'bestbuy.com': [
      '.order-summary__total .sr-only',
      '.pricing-price__range .sr-only',
      '.order-total .amount'
    ]
  }

  // Get site-specific selectors or use general ones
  const selectors = siteSpecificSelectors[Object.keys(siteSpecificSelectors).find(domain => hostname.includes(domain))] || [
    '.total', '.grand-total', '.final-total', '.order-total', '.checkout-total',
    '[data-testid*="total"]', '[data-test*="total"]', 
    '.price-total', '.cart-summary .total', '.payment-summary .total',
    '.subtotal', '.cart-total', '.summary-total'
  ]

  // Try each selector
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector)
    
    for (const element of elements) {
      if (!element) continue
      
      const text = element.textContent || element.innerText || element.getAttribute('aria-label') || ''
      
      const patterns = [
        /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
        /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$/,
        /total[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
        /(\d{1,3}(?:,\d{3})*\.\d{2})/
      ]
      
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''))
          
          if (amount > 0 && amount < 50000) {
            return amount
          }
        }
      }
    }
  }

  // Additional search for Amazon specifically
  if (hostname.includes('amazon.com')) {
    const amazonSelectors = [
      '.a-price .a-offscreen', '.a-price-whole', '.a-price-fraction',
      '.pmts-summary .a-price', '.order-summary .a-price', 
      '.payment-summary .a-price', '.checkout-summary .a-price',
      '.grand-total .a-price', '.order-total .a-price'
    ]
    
    for (const selector of amazonSelectors) {
      const amazonElements = document.querySelectorAll(selector)
      
      for (const element of amazonElements) {
        const text = element.textContent || ''
        const match = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/)
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''))
          if (amount > 5 && amount < 50000) {
            return amount
          }
        }
      }
    }
  }

  // Last resort: search for any element containing dollar signs
  const allElements = document.querySelectorAll('*')
  let bestAmount = 0
  
  for (const element of allElements) {
    const text = element.textContent || ''
    if (text.includes('$') && text.length < 200) {
      const patterns = [
        /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
        /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[ ]*\$/,
        /(\d{1,3}(?:,\d{3})*\.\d{2})/,
        /\$(\d+\.?\d*)/
      ]
      
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''))
          
          if (amount > 5 && amount < 10000) {
            const isTotal = text.toLowerCase().includes('total') || 
                           text.toLowerCase().includes('order') ||
                           text.toLowerCase().includes('grand') ||
                           amount > 50
            
            if (isTotal || amount > bestAmount) {
              bestAmount = amount
            }
          }
        }
      }
    }
  }
  
  if (bestAmount > 0) {
    return bestAmount
  }
  return 100 // Default fallback
}

function hideRecommendationOverlay() {
  if (checkoutOverlay) {
    checkoutOverlay.remove()
    checkoutOverlay = null
  }
}

function checkForCheckout() {
  if (isCheckoutPage() && !checkoutOverlay) {
    showRecommendationOverlay()
  } else if (!isCheckoutPage() && checkoutOverlay) {
    hideRecommendationOverlay()
  }
}

// Initialize monitoring - check less frequently to reduce CPU usage
setInterval(checkForCheckout, 3000)

// Also check on URL changes (for SPAs like Amazon)
let currentUrl = window.location.href
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href
    setTimeout(checkForCheckout, 1000) // Delay to let page load
  }
}, 1000)

// Check immediately and after DOM loads
checkForCheckout()
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkForCheckout, 1000)
  })
} else {
  setTimeout(checkForCheckout, 1000)
}