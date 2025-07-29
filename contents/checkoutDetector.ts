import type { PlasmoCSConfig } from "plasmo"

declare global {
  interface Window {
    creditCardExtensionLoaded?: boolean
  }
}

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

// Prevent multiple instances of this script
if (window.creditCardExtensionLoaded) {
  console.log("SAFEWAY DEBUG: Extension already loaded, exiting")
  return
}
window.creditCardExtensionLoaded = true

console.log("SAFEWAY DEBUG: Content script loaded on", window.location.hostname, "URL:", window.location.href)

// Debug utilities
function runDiagnostic() {
  console.log("=== EXTENSION DIAGNOSTIC ===")
  console.log("Current URL:", window.location.href)
  console.log("Hostname:", window.location.hostname)
  console.log("Is checkout page:", isCheckoutPage())
  console.log("Extension context valid:", isExtensionContextValid())
  console.log("Overlay exists:", !!checkoutOverlay)
  
  if (checkoutOverlay) {
    console.log("Current recommendation:", currentRecommendation)
  }
  
  // Test amount detection
  const detectedAmount = estimateTransactionAmount()
  console.log("Detected amount:", detectedAmount)
  
  console.log("=== END DIAGNOSTIC ===")
}

// Comprehensive test suite
function runTestSuite() {
  console.log("🧪 === COMPREHENSIVE TEST SUITE ===")
  
  // Test 1: Checkout Page Detection
  console.log("\n📋 TEST 1: Checkout Page Detection")
  testCheckoutPageDetection()
  
  // Test 2: Amount Detection
  console.log("\n💰 TEST 2: Amount Detection")
  testAmountDetection()
  
  // Test 3: Merchant Recognition
  console.log("\n🏪 TEST 3: Merchant Recognition") 
  testMerchantRecognition()
  
  // Test 4: Extension Context
  console.log("\n⚙️ TEST 4: Extension Context")
  testExtensionContext()
  
  // Test 5: DOM Analysis
  console.log("\n🔍 TEST 5: DOM Analysis")
  testDOMAnalysis()
  
  console.log("\n✅ === TEST SUITE COMPLETE ===")
}

function testCheckoutPageDetection() {
  const url = window.location.href.toLowerCase()
  const hostname = window.location.hostname.toLowerCase()
  
  console.log(`Current URL: ${url}`)
  console.log(`Hostname: ${hostname}`)
  
  // Test exclusion patterns
  const excludePatterns = [
    'signin', 'sign-in', 'login', 'auth', 'register', 'signup', 'sign-up',
    'forgot-password', 'reset-password', 'verify', 'confirmation',
    'oauth', 'sso', 'account', 'profile', 'settings'
  ]
  
  const isExcluded = excludePatterns.some(pattern => 
    hostname.includes(pattern) || url.includes(`/${pattern}`) || url.includes(`${pattern}.`)
  )
  
  console.log(`❌ Is excluded page: ${isExcluded}`)
  if (isExcluded) {
    console.log(`   Excluded by patterns: ${excludePatterns.filter(p => hostname.includes(p) || url.includes(`/${p}`) || url.includes(`${p}.`)).join(', ')}`)
  }
  
  // Test site-specific rules
  const siteCheckoutRules = {
    'costco.com': () => url.includes('/checkout') && !url.includes('/cart') && !url.includes('signin'),
    'safeway.com': () => url.includes('/checkout') || url.includes('/payment'),
    'walmart.com': () => url.includes('/checkout') || url.includes('/pay'),
    'target.com': () => url.includes('/checkout') || url.includes('/payment'),
    'amazon.com': () => {
      return url.includes('/gp/buy/spc/') || url.includes('/checkout/p/') ||
             (url.includes('/checkout/') && !url.includes('/gp/cart/')) ||
             url.includes('pipelinetype=chewbacca')
    }
  }
  
  const siteRule = Object.entries(siteCheckoutRules).find(([domain]) => hostname.includes(domain))
  if (siteRule) {
    const siteResult = siteRule[1]()
    console.log(`🏪 Site-specific rule (${siteRule[0]}): ${siteResult}`)
  } else {
    console.log(`🏪 No site-specific rule found`)
  }
  
  // Final result
  const finalResult = isCheckoutPage()
  console.log(`🎯 Final checkout detection result: ${finalResult}`)
}

function testAmountDetection() {
  console.log("Testing different amount detection methods...")
  
  // Test text pattern detection
  const textAmount = detectCheckoutPageAmount()
  console.log(`📝 Text pattern detection: $${textAmount}`)
  
  // Test selector-based detection
  const selectorAmount = estimateTransactionAmount()
  console.log(`🎯 Selector-based detection: $${selectorAmount}`)
  
  // Analyze page content for potential amounts
  const potentialAmounts = findPotentialAmounts()
  console.log(`💵 All potential amounts found:`, potentialAmounts)
}

function findPotentialAmounts() {
  const amounts = []
  const allElements = document.querySelectorAll('*:not(script):not(style):not(noscript)')
  
  for (const element of allElements) {
    const text = element.textContent || ''
    if (text.length > 1000 || text.includes('function')) continue
    
    const matches = text.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)
    if (matches) {
      matches.forEach(match => {
        const amount = parseFloat(match.replace('$', '').replace(/,/g, ''))
        if (amount > 0 && amount < 10000) {
          amounts.push({
            amount: amount,
            text: text.trim().substring(0, 100) + '...',
            element: element.tagName
          })
        }
      })
    }
  }
  
  return amounts.sort((a, b) => b.amount - a.amount).slice(0, 10)
}

function testMerchantRecognition() {
  const hostname = window.location.hostname.toLowerCase()
  
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
    'walgreens.com': { name: 'Walgreens', category: 'pharmacy' },
    'doordash.com': { name: 'DoorDash', category: 'dining' },
    'ubereats.com': { name: 'Uber Eats', category: 'dining' },
    'expedia.com': { name: 'Expedia', category: 'travel' },
    'southwest.com': { name: 'Southwest', category: 'travel' },
    'shell.com': { name: 'Shell', category: 'gas' },
    'newegg.com': { name: 'Newegg', category: 'electronics' }
  }
  
  const merchant = Object.entries(merchantMap).find(([domain]) => 
    hostname.includes(domain)
  )?.[1] || { name: hostname, category: 'general' }
  
  console.log(`🏪 Recognized merchant: ${merchant.name}`)
  console.log(`📂 Category: ${merchant.category}`)
  console.log(`🌐 Hostname match: ${Object.keys(merchantMap).find(domain => hostname.includes(domain)) || 'none'}`)
}

function testExtensionContext() {
  console.log(`⚙️ Extension context valid: ${isExtensionContextValid()}`)
  console.log(`💾 Chrome storage available: ${!!(chrome && chrome.storage && chrome.storage.local)}`)
  console.log(`📨 Chrome runtime available: ${!!(chrome && chrome.runtime && chrome.runtime.sendMessage)}`)
  console.log(`🆔 Runtime ID: ${chrome?.runtime?.id || 'undefined'}`)
}

function testDOMAnalysis() {
  const totalElements = document.querySelectorAll('*').length
  const scriptElements = document.querySelectorAll('script').length
  const styleElements = document.querySelectorAll('style').length
  const visibleElements = document.querySelectorAll('*:not(script):not(style):not(noscript)').length
  
  console.log(`📊 Total DOM elements: ${totalElements}`)
  console.log(`📜 Script elements: ${scriptElements}`)
  console.log(`🎨 Style elements: ${styleElements}`)
  console.log(`👁️ Visible elements analyzed: ${visibleElements}`)
  
  // Check for common checkout indicators
  const checkoutIndicators = [
    '.checkout-button', '.place-order', '.complete-order', '.payment-section',
    '[data-testid*="checkout"]', '[data-testid*="payment"]', '.order-summary',
    '.billing-section', '.shipping-section'
  ]
  
  console.log("🔍 Checkout indicators found:")
  checkoutIndicators.forEach(selector => {
    const elements = document.querySelectorAll(selector)
    if (elements.length > 0) {
      console.log(`   ${selector}: ${elements.length} elements`)
    }
  })
}

// Interactive testing functions
function testSpecificAmount(testAmount) {
  console.log(`🧪 Testing with mock amount: $${testAmount}`)
  // This would simulate finding a specific amount
  return testAmount
}

function simulateCheckout() {
  console.log("🎭 Simulating checkout scenario...")
  if (!checkoutOverlay) {
    console.log("📱 No overlay present, triggering show...")
    showRecommendationOverlay()
  } else {
    console.log("📱 Overlay already present")
  }
}

function forceHideOverlay() {
  console.log("🚫 Force hiding overlay...")
  hideRecommendationOverlay()
}

// Make all test functions available globally
window.ccDiagnostic = runDiagnostic
window.ccTestSuite = runTestSuite
window.ccTestCheckout = testCheckoutPageDetection
window.ccTestAmount = testAmountDetection
window.ccTestMerchant = testMerchantRecognition
window.ccTestExtension = testExtensionContext
window.ccTestDOM = testDOMAnalysis
window.ccSimulateCheckout = simulateCheckout
window.ccForceHide = forceHideOverlay
window.ccTestSpecificAmount = testSpecificAmount

// Helper function to check if extension context is still valid
function isExtensionContextValid(): boolean {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id)
  } catch (error) {
    console.log("SAFEWAY DEBUG: Extension context invalidated")
    return false
  }
}

// Helper function to safely access chrome.storage
async function safeStorageGet(key: string): Promise<any> {
  try {
    console.log(`SAFEWAY DEBUG: Attempting to get storage key: ${key}`)
    
    if (!isExtensionContextValid()) {
      console.log("SAFEWAY DEBUG: Extension context invalid, cannot access storage")
      return {}
    }
    
    if (!chrome.storage || !chrome.storage.local) {
      console.log("SAFEWAY DEBUG: chrome.storage.local not available")
      return {}
    }
    
    console.log("SAFEWAY DEBUG: Chrome storage available, getting data...")
    const result = await chrome.storage.local.get(key)
    console.log(`SAFEWAY DEBUG: Storage get result for ${key}:`, result)
    return result
  } catch (error) {
    console.log("SAFEWAY DEBUG: Error accessing storage:", error)
    return {}
  }
}

// Helper function to safely send runtime messages
function safeSendMessage(message: any): void {
  try {
    if (!isExtensionContextValid()) {
      console.log("SAFEWAY DEBUG: Extension context invalid, cannot send message")
      return
    }
    
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      console.log("SAFEWAY DEBUG: chrome.runtime.sendMessage not available")
      return
    }
    
    chrome.runtime.sendMessage(message)
  } catch (error) {
    console.log("SAFEWAY DEBUG: Error sending message:", error)
  }
}

// Simple checkout detection based on URL and basic page elements
let checkoutOverlay: HTMLElement | null = null
let lastOverlayShown = 0 // Timestamp of last overlay shown
const OVERLAY_COOLDOWN = 30000 // 30 seconds cooldown between overlays
let currentRecommendation: any = null // Store current recommendation for updates
let isCreatingOverlay = false // Prevent concurrent overlay creation

// Global cleanup function to remove ALL overlays
function globalOverlayCleanup() {
  console.log("SAFEWAY DEBUG: Global overlay cleanup started")
  
  // Remove all elements with the overlay ID
  const allOverlays = document.querySelectorAll('#credit-card-recommendation-overlay')
  console.log(`SAFEWAY DEBUG: Found ${allOverlays.length} overlays to remove`)
  allOverlays.forEach((overlay, index) => {
    console.log(`SAFEWAY DEBUG: Removing overlay ${index + 1}`)
    overlay.remove()
  })
  
  // Also check for any elements with similar classes or content
  const similarOverlays = document.querySelectorAll('[id*="credit-card"], [class*="credit-card-overlay"]')
  similarOverlays.forEach(overlay => {
    if (overlay.textContent?.includes('Credit Card Assistant') || 
        overlay.textContent?.includes('Best Card')) {
      console.log("SAFEWAY DEBUG: Removing similar overlay")
      overlay.remove()
    }
  })
  
  // Reset all tracking
  checkoutOverlay = null
  currentRecommendation = null
  isCreatingOverlay = false
  
  console.log("SAFEWAY DEBUG: Global cleanup completed")
}

function isCheckoutPage(): boolean {
  const url = window.location.href.toLowerCase()
  const hostname = window.location.hostname.toLowerCase()
  
  console.log("SAFEWAY DEBUG: Checking if checkout page...", hostname, url)
  
  // First, exclude pages that are definitely NOT checkout pages
  const excludePatterns = [
    'signin', 'sign-in', 'login', 'auth', 'register', 'signup', 'sign-up',
    'forgot-password', 'reset-password', 'verify', 'confirmation',
    'oauth', 'sso', 'account', 'profile', 'settings'
  ]
  
  const isExcludedPage = excludePatterns.some(pattern => 
    hostname.includes(pattern) || url.includes(`/${pattern}`) || url.includes(`${pattern}.`)
  )
  
  if (isExcludedPage) {
    console.log("SAFEWAY DEBUG: Excluded page type (signin/auth/etc), returning false")
    return false
  }
  
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
      console.log("SAFEWAY DEBUG: Amazon checkout page detected")
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
  
  // Site-specific checkout detection
  const siteCheckoutRules = {
    'costco.com': () => {
      // Only actual checkout pages, not cart or signin
      return url.includes('/checkout') && !url.includes('/cart') && !url.includes('signin')
    },
    'safeway.com': () => {
      return url.includes('/checkout') || url.includes('/payment')
    },
    'walmart.com': () => {
      return url.includes('/checkout') || url.includes('/pay')
    },
    'target.com': () => {
      return url.includes('/checkout') || url.includes('/payment')
    }
  }
  
  // Check site-specific rules first
  const siteRule = Object.entries(siteCheckoutRules).find(([domain]) => hostname.includes(domain))
  if (siteRule) {
    const isCheckout = siteRule[1]()
    console.log(`SAFEWAY DEBUG: Site-specific rule for ${siteRule[0]}:`, isCheckout)
    return isCheckout
  }
  
  // For other sites, be more restrictive - require multiple indicators
  const strictCheckoutKeywords = ['checkout', 'payment', 'billing']
  const hasStrictCheckoutUrl = strictCheckoutKeywords.some(keyword => 
    url.includes(`/${keyword}`) || url.includes(`${keyword}/`) // More specific path matching
  )
  
  console.log("SAFEWAY DEBUG: URL has strict checkout keywords:", hasStrictCheckoutUrl)
  
  // Only check cart if combined with other indicators
  const hasCartUrl = url.includes('/cart') && (
    document.querySelector('.checkout-button') ||
    document.querySelector('[data-testid*="checkout"]') ||
    document.querySelector('.payment-section') ||
    document.querySelector('.place-order') ||
    document.querySelector('.complete-order')
  )
  
  console.log("SAFEWAY DEBUG: URL has cart with checkout elements:", hasCartUrl)
  
  if (hasStrictCheckoutUrl || hasCartUrl) {
    console.log("SAFEWAY DEBUG: IS CHECKOUT PAGE - returning true")
    return true
  }
  
  console.log("SAFEWAY DEBUG: NOT checkout page - returning false")
  return false
}

async function showRecommendationOverlay() {
  console.log("SAFEWAY DEBUG: showRecommendationOverlay called")
  
  // Prevent concurrent overlay creation
  if (isCreatingOverlay) {
    console.log("SAFEWAY DEBUG: Already creating overlay, aborting")
    return
  }
  
  // Global cleanup first - this removes ALL overlays
  globalOverlayCleanup()
  
  isCreatingOverlay = true
  
  try {
    
    // Check if overlay was just removed and still exists somehow
    if (document.querySelector('#credit-card-recommendation-overlay')) {
      console.log("SAFEWAY DEBUG: Overlay still exists after cleanup, aborting")
      return
    }
    
    // Check cooldown to prevent spam
    const now = Date.now()
    if (now - lastOverlayShown < OVERLAY_COOLDOWN) {
      console.log("SAFEWAY DEBUG: On cooldown, returning")
      return
    }
    
    lastOverlayShown = now
    console.log("SAFEWAY DEBUG: Getting cards from storage...")
    
    // Get user's cards from storage using safe method - check both keys
    let cards = []
    
    // First try the new key 'cards'
    let result = await safeStorageGet('cards')
    cards = result.cards || []
    
    // If no cards found, try the old key 'creditCards' and migrate
    if (cards.length === 0) {
      const oldResult = await safeStorageGet('creditCards')
      const oldCards = oldResult.creditCards || []
      
      if (oldCards.length > 0) {
        console.log("SAFEWAY DEBUG: Found cards in old key, migrating...")
        // Migrate to new key
        try {
          await chrome.storage.local.set({ 'cards': oldCards })
          await chrome.storage.local.remove('creditCards')
          cards = oldCards
        } catch (error) {
          console.log("SAFEWAY DEBUG: Migration failed:", error)
          cards = oldCards // Use old cards anyway
        }
      }
    }
    
    console.log("SAFEWAY DEBUG: Storage result:", result)
    console.log("SAFEWAY DEBUG: Found", cards.length, "cards")
    console.log("SAFEWAY DEBUG: Cards array:", cards)
    
    if (cards.length === 0) {
      console.log("SAFEWAY DEBUG: No cards, showing add cards overlay")
      showAddCardsOverlay()
      return
    }
    
    // Get recommendation
    console.log("SAFEWAY DEBUG: Getting recommendation...")
    const recommendation = await getBestRecommendation(cards)
    console.log("SAFEWAY DEBUG: Recommendation result:", recommendation)
    
    if (recommendation) {
      console.log("SAFEWAY DEBUG: Showing card recommendation overlay")
      currentRecommendation = recommendation
      showCardRecommendationOverlay(recommendation)
    } else {
      console.log("SAFEWAY DEBUG: No recommendation, showing add cards overlay")
      showAddCardsOverlay()
    }
  } catch (error) {
    console.log("SAFEWAY DEBUG: Error:", error)
    showAddCardsOverlay()
  } finally {
    isCreatingOverlay = false
  }
}

function showAddCardsOverlay() {
  // Remove any existing overlay first
  if (checkoutOverlay) {
    hideRecommendationOverlay()
  }
  
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
      z-index: 2147483647;
      max-width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      pointer-events: auto;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
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
  // Remove any existing overlay first
  if (checkoutOverlay) {
    hideRecommendationOverlay()
  }
  
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
      z-index: 2147483647;
      max-width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      pointer-events: auto;
      visibility: visible !important;
      opacity: 1 !important;
      display: block !important;
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
        <div class="reward-amount-text" style="font-size: 12px; opacity: 0.8; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px;">
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
  // Remove any existing overlays from DOM first
  const existingOverlays = document.querySelectorAll('#credit-card-recommendation-overlay')
  existingOverlays.forEach(overlay => overlay.remove())
  
  document.body.appendChild(checkoutOverlay)

  const closeBtn = checkoutOverlay.querySelector('#cc-overlay-close')
  closeBtn?.addEventListener('click', hideRecommendationOverlay)

  const manageBtn = checkoutOverlay.querySelector('#cc-overlay-manage')
  manageBtn?.addEventListener('click', () => {
    safeSendMessage({ action: 'openPopup' })
  })

  const usedBtn = checkoutOverlay.querySelector('#cc-overlay-used')
  usedBtn?.addEventListener('click', () => {
    hideRecommendationOverlay()
  })

  // Handle screen/window changes to keep overlay visible
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Document became hidden, save overlay state
      if (checkoutOverlay) {
        checkoutOverlay.style.display = 'none'
      }
    } else {
      // Document became visible again, restore overlay
      if (checkoutOverlay) {
        checkoutOverlay.style.display = 'block'
        repositionOverlay()
      }
    }
  }

  const handleWindowFocus = () => {
    if (checkoutOverlay) {
      checkoutOverlay.style.display = 'block'
      repositionOverlay()
    }
  }

  const handleWindowBlur = () => {
    // Keep overlay visible even when window loses focus
    if (checkoutOverlay) {
      checkoutOverlay.style.display = 'block'
    }
  }

  // Add event listeners for screen changes
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('blur', handleWindowBlur)
  window.addEventListener('resize', repositionOverlay)

  // Store event listeners for cleanup
  if (checkoutOverlay) {
    checkoutOverlay._eventListeners = {
      handleVisibilityChange,
      handleWindowFocus,
      handleWindowBlur,
      repositionOverlay
    }
  }

  // Longer timeout, but allow user interaction to keep it open
  const timeoutId = setTimeout(() => {
    if (checkoutOverlay) {
      console.log("SAFEWAY DEBUG: Auto-hiding overlay after timeout")
      hideRecommendationOverlay()
    }
  }, 30000) // Increased to 30 seconds
  
  // Cancel timeout if user interacts with overlay
  if (checkoutOverlay) {
    checkoutOverlay.addEventListener('mouseenter', () => {
      clearTimeout(timeoutId)
      console.log("SAFEWAY DEBUG: Overlay timeout cancelled due to mouse interaction")
    })
    
    checkoutOverlay.addEventListener('click', () => {
      clearTimeout(timeoutId)
      console.log("SAFEWAY DEBUG: Overlay timeout cancelled due to click interaction")
    })
  }
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
    'walgreens.com': { name: 'Walgreens', category: 'pharmacy' },
    'doordash.com': { name: 'DoorDash', category: 'dining' },
    'ubereats.com': { name: 'Uber Eats', category: 'dining' },
    'expedia.com': { name: 'Expedia', category: 'travel' },
    'southwest.com': { name: 'Southwest', category: 'travel' },
    'shell.com': { name: 'Shell', category: 'gas' },
    'newegg.com': { name: 'Newegg', category: 'electronics' }
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
  
  // For other sites, use the original retry approach with longer delays for Safeway
  const isSafeway = hostname.includes('safeway.com')
  const maxRetries = isSafeway ? 5 : 3
  const delays = isSafeway ? [0, 1000, 2000, 3000, 4000] : [0, 1000, 2000] // Longer delays for Safeway
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, delays[attempt]))
    }
    
    const amount = estimateTransactionAmount()
    
    // For Safeway, be more selective about what amounts to accept early on
    if (isSafeway && attempt < 2) {
      // In early attempts, only accept amounts that look like totals (> $10)
      if (amount > 10) {
        return amount
      }
    } else {
      // For non-Safeway or later attempts, accept any positive amount
      if (amount > 0) {
        return amount
      }
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
        if (amount > 0) {  // Accept any positive amount
          cacheCartAmount(amount)
          resolve(amount)
          return
        }
      }
      
      // Try text pattern detection
      const textAmount = detectCheckoutPageAmount()
      if (textAmount > 0) {  // Accept any positive amount
        resolve(textAmount)
        return
      }
      
      if (attempts >= maxAttempts) {
        if (cachedAmount && cachedAmount > 0) {  // Accept any positive cached amount
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
    const result = await safeStorageGet('lastCartAmount')
    const cached = result.lastCartAmount
    if (cached && cached.timestamp && Date.now() - cached.timestamp < 600000) {
      return cached.amount
    }
  } catch (error) {
    console.log("SAFEWAY DEBUG: Error getting cached cart amount:", error)
  }
  return null
}

async function cacheCartAmount(amount: number): Promise<void> {
  try {
    if (!isExtensionContextValid()) {
      console.log("SAFEWAY DEBUG: Extension context invalid, cannot cache amount")
      return
    }
    
    if (!chrome.storage || !chrome.storage.local) {
      console.log("SAFEWAY DEBUG: chrome.storage.local not available for caching")
      return
    }
    
    const url = window.location.href
    if (url.includes('/gp/cart/') && amount > 0) {
      await chrome.storage.local.set({
        lastCartAmount: {
          amount,
          timestamp: Date.now(),
          url
        }
      })
    }
  } catch (error) {
    console.log("SAFEWAY DEBUG: Error caching cart amount:", error)
  }
}

function detectCheckoutPageAmount(): number {
  console.log("SAFEWAY DEBUG: Starting amount detection...")
  
  // Enhanced patterns to catch more variations including "Estimated total"
  const textPatterns = [
    // High priority patterns with exact matches
    /estimated total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /order total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /grand total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /final total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    
    // More flexible patterns with whitespace and line breaks
    /estimated\s+total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /order\s+total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    
    // Patterns that handle amounts on separate lines
    /estimated\s+total[\s\n\r]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /order\s+total[\s\n\r]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    
    // Other patterns
    /cart total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /checkout total[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /amount due[:\s]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    
    // More flexible pattern for "total" that handles spacing and formatting
    /total[:\s]+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    
    // Pattern to catch dollar amounts near "total" text (within 50 characters)
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?).{0,50}total/i,
    /total.{0,50}\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i
  ]
  
  const allText = document.body.textContent || document.body.innerText || ''
  console.log("SAFEWAY DEBUG: Page text contains 'Estimated total':", allText.includes('Estimated total'))
  console.log("SAFEWAY DEBUG: Page text contains '$17.23':", allText.includes('$17.23'))
  
  // Debug: Log a snippet of text around "total" or "$17.23" if found
  if (allText.includes('Estimated total') || allText.includes('$17.23')) {
    const totalIndex = allText.toLowerCase().indexOf('estimated total')
    const amountIndex = allText.indexOf('$17.23')
    if (totalIndex >= 0) {
      const snippet = allText.substring(Math.max(0, totalIndex - 50), totalIndex + 100)
      console.log(`SAFEWAY DEBUG: Text around 'estimated total': "${snippet}"`)
    }
    if (amountIndex >= 0) {
      const snippet = allText.substring(Math.max(0, amountIndex - 50), amountIndex + 50)
      console.log(`SAFEWAY DEBUG: Text around '$17.23': "${snippet}"`)
    }
  }
  
  // Try patterns in order of priority
  for (const pattern of textPatterns) {
    const match = allText.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      console.log(`SAFEWAY DEBUG: Pattern ${pattern} found amount: $${amount}`)
      if (amount > 1 && amount < 10000) {
        console.log(`SAFEWAY DEBUG: Using text pattern amount: $${amount}`)
        return amount
      }
    }
  }
  
  // Enhanced element search for various total keywords
  const totalKeywords = [
    'estimated total', 'order total', 'grand total', 'final total', 
    'cart total', 'checkout total', 'total amount', 'amount due',
    'subtotal', 'total'
  ]
  
  // Get only visible, non-script elements to avoid JavaScript pollution
  const allElements = document.querySelectorAll('*:not(script):not(style):not(noscript)')
  let foundEstimatedTotal = false
  let bestAmount = 0
  let bestScore = 0
  
  for (const element of allElements) {
    // Skip elements that are likely to contain code or irrelevant content
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'NOSCRIPT') {
      continue
    }
    
    const text = element.textContent || ''
    const lowerText = text.toLowerCase()
    
    // Skip elements with very long text that might be minified JavaScript
    if (text.length > 1000) {
      continue
    }
    
    // Skip elements that look like minified code (lots of special characters, no spaces)
    const codeIndicators = /[{}();,=&|!]+.*[{}();,=&|!]+/
    if (codeIndicators.test(text) && text.replace(/\s/g, '').length > 100) {
      continue
    }
    
    if (lowerText.includes('estimated total')) {
      foundEstimatedTotal = true
      console.log(`SAFEWAY DEBUG: Found 'estimated total' element: "${text.trim().substring(0, 100)}..."`)
    }
    
    // Check if element contains any total keywords and a dollar amount
    for (const keyword of totalKeywords) {
      if (lowerText.includes(keyword) && text.includes('$')) {
        // Additional filter: skip if this looks like code/script content
        if (text.includes('function') || text.includes('var ') || text.includes('return ') || 
            text.includes('typeof') || text.includes('Object.') || text.includes('prototype')) {
          continue
        }
        
        console.log(`SAFEWAY DEBUG: Found keyword "${keyword}" in element: "${text.trim().substring(0, 100)}..."`)
        
        // Multiple patterns to catch different formatting
        const patterns = [
          /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
          /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[ ]*\$/,
          /(\d{1,3}(?:,\d{3})*\.\d{2})/
        ]
        
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''))
            console.log(`SAFEWAY DEBUG: Extracted amount $${amount} from "${text.trim().substring(0, 100)}..."`)
            
            if (amount > 1 && amount < 10000) {
              // Score amounts based on keyword priority - heavily favor "estimated total"
              let score = 0
              if (keyword === 'estimated total') score = 1000  // Heavily prioritize estimated total
              else if (keyword === 'order total') score = 900
              else if (keyword === 'grand total') score = 850
              else if (keyword === 'final total') score = 800
              else if (keyword === 'total') score = 500
              else score = 300
              
              // Extra bonus for amounts that make sense for checkout totals
              if (amount >= 15) score += 200  // Likely a full order
              else if (amount >= 10) score += 100
              else if (amount >= 5) score += 50
              else if (amount < 3) score -= 500  // Heavily penalize very small amounts (likely fees/items)
              
              console.log(`SAFEWAY DEBUG: Amount $${amount} scored ${score} points`)
              
              if (score > bestScore || (score === bestScore && amount > bestAmount)) {
                bestAmount = amount
                bestScore = score
                console.log(`SAFEWAY DEBUG: New best amount: $${bestAmount} with score ${bestScore}`)
              }
            }
            break // Found an amount for this keyword, move to next keyword
          }
        }
      }
    }
  }
  
  if (bestAmount > 0) {
    console.log(`SAFEWAY DEBUG: Using best scored amount: $${bestAmount}`)
    return bestAmount
  }
  
  console.log(`SAFEWAY DEBUG: Found estimated total element: ${foundEstimatedTotal}`)
  console.log("SAFEWAY DEBUG: No amount found, returning 0")
  return 0
}

function estimateTransactionAmount() {
  const hostname = window.location.hostname.toLowerCase()
  
  // Try text pattern detection first (most reliable)
  const textAmount = detectCheckoutPageAmount()
  if (textAmount > 0) {
    return textAmount
  }
  
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
      '.grand-total',
      '.estimated-total',
      '[data-testid="estimated-total"]',
      '.order-summary .total',
      '.summary-total',
      // Additional Safeway-specific selectors
      '[class*="total"]',
      '[class*="Total"]',
      '[id*="total"]',
      '[id*="Total"]',
      '.price[class*="total"]',
      '[data-automation-id*="total"]'
    ],
    'bestbuy.com': [
      '.order-summary__total .sr-only',
      '.pricing-price__range .sr-only',
      '.order-total .amount'
    ]
  }

  // Get site-specific selectors or use enhanced universal ones
  const selectors = siteSpecificSelectors[Object.keys(siteSpecificSelectors).find(domain => hostname.includes(domain))] || [
    // Common total selectors - enhanced with more variations
    '.total', '.grand-total', '.final-total', '.order-total', '.checkout-total',
    '.estimated-total', '.cart-total', '.summary-total', '.payment-total',
    '.total-amount', '.amount-total', '.price-total', '.total-price',
    
    // Class attribute wildcard selectors for better coverage
    '[class*="total"]', '[class*="Total"]', '[class*="TOTAL"]',
    '[class*="amount"]', '[class*="Amount"]', '[class*="price"]', '[class*="Price"]',
    
    // ID attribute selectors
    '[id*="total"]', '[id*="Total"]', '[id*="amount"]', '[id*="Amount"]',
    
    // Data attribute selectors - expanded
    '[data-testid*="total"]', '[data-test*="total"]', '[data-qa*="total"]',
    '[data-testid*="amount"]', '[data-test*="amount"]', '[data-qa*="amount"]',
    '[data-automation-id*="total"]', '[data-automation-id*="amount"]',
    
    // Summary and container selectors
    '.cart-summary .total', '.payment-summary .total', '.order-summary .total',
    '.checkout-summary .total', '.billing-summary .total',
    '.cart-summary', '.payment-summary', '.order-summary', '.checkout-summary',
    
    // Generic containers that might contain totals
    '.summary', '.subtotal', '.tax-total', '.shipping-total',
    
    // Additional patterns for different sites
    '.price-summary', '.cost-summary', '.amount-summary', '.total-container',
    '.order-container .total', '.payment-container .total'
  ]

  // Try each selector
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector)
    
    for (const element of elements) {
      if (!element) continue
      
      const text = element.textContent || element.innerText || element.getAttribute('aria-label') || ''
      
      // Enhanced patterns for better amount detection
      const patterns = [
        /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
        /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*\$/,
        /total[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
        /(\d{1,3}(?:,\d{3})*\.\d{2})/,
        // Additional patterns for edge cases
        /\$(\d+\.\d{2})/,
        /(\d+\.\d{2})\s*\$/,
        /\$\s*(\d+)/
      ]
      
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''))
          
          if (amount > 0 && amount < 50000) {
            console.log(`SAFEWAY DEBUG: Selector "${selector}" found amount $${amount} from text: "${text.trim()}"`)
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

  // Last resort: comprehensive dollar sign search with smart prioritization
  const allElements = document.querySelectorAll('*')
  let fallbackBestAmount = 0
  let fallbackBestScore = 0
  
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
          
          if (amount > 1 && amount < 10000) {
            // Score amounts based on likelihood of being a total
            let score = 0
            const lowerText = text.toLowerCase()
            
            // High priority keywords (heavily boosted for better detection)
            if (lowerText.includes('estimated total')) score += 2000  // Heavily prioritize estimated total
            if (lowerText.includes('order total')) score += 1200
            if (lowerText.includes('grand total')) score += 1100
            if (lowerText.includes('final total')) score += 1000
            if (lowerText.includes('cart total')) score += 900
            if (lowerText.includes('checkout total')) score += 850
            if (lowerText.includes('total')) score += 600
            
            // Medium priority keywords
            if (lowerText.includes('amount due')) score += 700
            if (lowerText.includes('subtotal')) score += 450
            if (lowerText.includes('summary')) score += 350
            
            // Bonus for reasonable order amounts (adjusted thresholds)
            if (amount >= 15) score += 250  // Likely a full order
            if (amount >= 10) score += 150
            if (amount >= 5) score += 100
            
            // Heavy penalty for very small amounts (likely fees/taxes/individual items)
            if (amount < 3) score -= 1000
            
            console.log(`SAFEWAY DEBUG: Fallback - Amount $${amount} from "${text.trim()}" scored ${score} points`)
            
            if (score > fallbackBestScore || (score === fallbackBestScore && amount > fallbackBestAmount)) {
              fallbackBestAmount = amount
              fallbackBestScore = score
              console.log(`SAFEWAY DEBUG: New fallback best: $${fallbackBestAmount} with score ${fallbackBestScore}`)
            }
          }
        }
      }
    }
  }
  
  if (fallbackBestAmount > 0) {
    console.log(`SAFEWAY DEBUG: Using fallback amount: $${fallbackBestAmount}`)
    return fallbackBestAmount
  }
  return 100 // Default fallback
}

function repositionOverlay() {
  if (checkoutOverlay) {
    // Ensure overlay stays in the top-right corner
    const overlayContent = checkoutOverlay.querySelector('div')
    if (overlayContent) {
      overlayContent.style.position = 'fixed'
      overlayContent.style.top = '20px'
      overlayContent.style.right = '20px'
      overlayContent.style.zIndex = '2147483647'
    }
  }
}

async function updateOverlayWithBetterAmount() {
  if (!checkoutOverlay || !currentRecommendation) return
  
  // Get fresh cards and recommendation
  try {
    const result = await safeStorageGet('creditCards')
    const cards = result.creditCards || []
    
    if (cards.length > 0) {
      const newRecommendation = await getBestRecommendation(cards)
      
      if (newRecommendation && newRecommendation.estimatedAmount !== currentRecommendation.estimatedAmount) {
        console.log(`SAFEWAY DEBUG: Updating overlay amount from $${currentRecommendation.estimatedAmount} to $${newRecommendation.estimatedAmount}`)
        
        // Update the overlay content
        const amountElement = checkoutOverlay.querySelector('.reward-amount-text')
        if (amountElement) {
          amountElement.textContent = `💰 Earn $${newRecommendation.rewardAmount.toFixed(2)} cashback on $${newRecommendation.estimatedAmount.toFixed(2)} at ${newRecommendation.merchantName}`
        }
        
        currentRecommendation = newRecommendation
      }
    }
  } catch (error) {
    console.log("SAFEWAY DEBUG: Error updating overlay:", error)
  }
}

function hideRecommendationOverlay() {
  // Clean up our tracked overlay
  if (checkoutOverlay) {
    // Clean up event listeners
    if (checkoutOverlay._eventListeners) {
      document.removeEventListener('visibilitychange', checkoutOverlay._eventListeners.handleVisibilityChange)
      window.removeEventListener('focus', checkoutOverlay._eventListeners.handleWindowFocus)
      window.removeEventListener('blur', checkoutOverlay._eventListeners.handleWindowBlur)
      window.removeEventListener('resize', checkoutOverlay._eventListeners.repositionOverlay)
    }
    
    checkoutOverlay.remove()
    checkoutOverlay = null
    currentRecommendation = null
  }
  
  // Also remove any stray overlays that might exist in the DOM
  const strayOverlays = document.querySelectorAll('#credit-card-recommendation-overlay')
  strayOverlays.forEach(overlay => {
    if (overlay !== checkoutOverlay) {
      overlay.remove()
    }
  })
}

function checkForCheckout() {
  const isCheckout = isCheckoutPage()
  console.log("SAFEWAY DEBUG: checkForCheckout - isCheckout:", isCheckout, "overlay exists:", !!checkoutOverlay)
  
  if (isCheckout && !checkoutOverlay) {
    console.log("SAFEWAY DEBUG: Calling showRecommendationOverlay...")
    
    // Add delay for Safeway to let content load
    const hostname = window.location.hostname.toLowerCase()
    const delay = hostname.includes('safeway.com') ? 2000 : 0
    
    setTimeout(() => {
      if (!checkoutOverlay) { // Check again to avoid duplicate overlays
        showRecommendationOverlay()
      }
    }, delay)
  } else if (!isCheckout && checkoutOverlay) {
    console.log("SAFEWAY DEBUG: Hiding overlay...")
    hideRecommendationOverlay()
  } else if (isCheckout && checkoutOverlay) {
    // Update overlay with better amount if available
    updateOverlayWithBetterAmount()
  }
}

// Listen for storage changes to refresh overlay when cards are added
if (chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.cards || changes.creditCards) && isExtensionContextValid()) {
      console.log("SAFEWAY DEBUG: Credit cards changed, refreshing overlay...")
      // Global cleanup first
      globalOverlayCleanup()
      // Small delay to ensure storage is updated
      setTimeout(() => {
        if (isCheckoutPage()) {
          showRecommendationOverlay() // Show updated overlay
        }
      }, 500)
    }
  })
}

// Only initialize if extension context is valid
if (isExtensionContextValid()) {
  // Initialize monitoring - check less frequently to reduce CPU usage
  setInterval(() => {
    if (isExtensionContextValid()) {
      checkForCheckout()
    }
  }, 3000)

  // Also check on URL changes (for SPAs like Amazon)
  let currentUrl = window.location.href
  setInterval(() => {
    if (isExtensionContextValid() && window.location.href !== currentUrl) {
      currentUrl = window.location.href
      setTimeout(() => {
        if (isExtensionContextValid()) {
          checkForCheckout()
        }
      }, 1000) // Delay to let page load
    }
  }, 1000)

  // Check immediately and after DOM loads
  checkForCheckout()
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (isExtensionContextValid()) {
          checkForCheckout()
        }
      }, 1000)
    })
  } else {
    setTimeout(() => {
      if (isExtensionContextValid()) {
        checkForCheckout()
      }
    }, 1000)
  }
} else {
  console.log("SAFEWAY DEBUG: Extension context invalid at startup, not initializing")
}