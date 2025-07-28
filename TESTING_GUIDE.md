# Smart Card Extension - Testing Guide

This guide provides comprehensive testing procedures to debug and validate the extension's behavior across different scenarios.

## 🧪 Available Test Functions

After installing the extension, open the browser console (F12) on any page and use these commands:

### Basic Diagnostic
```javascript
ccDiagnostic()  // Quick overview of current page status
```

### Comprehensive Test Suite
```javascript
ccTestSuite()   // Runs all tests below in sequence
```

### Individual Tests
```javascript
ccTestCheckout()     // Test checkout page detection logic
ccTestAmount()       // Test amount detection methods
ccTestMerchant()     // Test merchant recognition
ccTestExtension()    // Test extension context and APIs
ccTestDOM()          // Analyze DOM structure
```

### Interactive Testing
```javascript
ccSimulateCheckout()     // Force show overlay for testing
ccForceHide()            // Force hide overlay
ccTestSpecificAmount(50) // Test with mock amount ($50)
```

## 📋 Test Scenarios by Website

### 🏪 Costco Testing

#### Test Case 1: Cart Page (Should NOT show overlay)
1. Go to `https://www.costco.com/cart`
2. Run `ccTestCheckout()` in console
3. Expected: `Final checkout detection result: false`

#### Test Case 2: Signin Page (Should NOT show overlay)
1. Go to any Costco signin URL
2. Run `ccTestCheckout()` in console
3. Expected: `Is excluded page: true`

#### Test Case 3: Actual Checkout Page (Should show overlay)
1. Go to actual checkout URL with `/checkout` in path
2. Run `ccTestCheckout()` in console
3. Expected: `Final checkout detection result: true`

### 🛒 Amazon Testing

#### Test Case 1: Cart Page (Should NOT show overlay)
1. Go to `https://www.amazon.com/gp/cart/view.html`
2. Run `ccTestCheckout()` in console
3. Expected: `Final checkout detection result: false`

#### Test Case 2: Checkout Page (Should show overlay)
1. Go to actual Amazon checkout page
2. Run `ccTestAmount()` in console
3. Expected: Correct amount detection

### 🥬 Safeway Testing

#### Test Case 1: Regular Page (Should NOT show overlay)
1. Go to `https://www.safeway.com/`
2. Run `ccTestCheckout()` in console
3. Expected: `Final checkout detection result: false`

#### Test Case 2: Checkout Page (Should show overlay)
1. Go to Safeway checkout page
2. Run `ccTestAmount()` in console
3. Expected: Should detect "Estimated total" correctly

## 🔍 Debugging Common Issues

### Issue: Extension shows on wrong pages
```javascript
ccTestCheckout()  // Check why page is considered checkout
```
Look for:
- `Is excluded page: true/false`
- `Site-specific rule: true/false`
- Check exclusion patterns

### Issue: Wrong amount detected
```javascript
ccTestAmount()    // See all amount detection methods
```
Look for:
- `Text pattern detection: $X`
- `Selector-based detection: $X`
- `All potential amounts found: [...]`

### Issue: Extension not working at all
```javascript
ccTestExtension() // Check extension context
```
Look for:
- `Extension context valid: true/false`
- `Chrome storage available: true/false`
- `Runtime ID: xyz`

### Issue: Overlay disappears unexpectedly
```javascript
ccDiagnostic()    // Check current state
ccSimulateCheckout() // Force show overlay
```

## 📊 Understanding Test Results

### Checkout Detection Results
- `❌ Is excluded page: true` → Page correctly excluded (signin, auth, etc.)
- `🏪 Site-specific rule: true` → Site has custom detection rule
- `🎯 Final checkout detection result: true` → Extension should show

### Amount Detection Results
- `📝 Text pattern detection: $17.23` → Found via text search
- `🎯 Selector-based detection: $17.23` → Found via CSS selectors
- `💵 All potential amounts found: [...]` → All dollar amounts on page

### Merchant Recognition Results
- `🏪 Recognized merchant: Costco` → Correctly identified
- `📂 Category: warehouse_clubs` → Correct category for card matching
- `🌐 Hostname match: costco.com` → Domain match found

## 🚨 Testing Edge Cases

### Test 1: JavaScript Pollution
```javascript
ccTestAmount()
```
Check that `All potential amounts found` doesn't include amounts from JavaScript code.

### Test 2: Multiple Dollar Amounts
Visit a page with many prices and run:
```javascript
ccTestAmount()
```
Verify it prioritizes checkout totals over individual item prices.

### Test 3: Dynamic Content Loading
On pages with dynamic content:
```javascript
// Test immediately
ccTestAmount()
// Wait 5 seconds, test again
setTimeout(() => ccTestAmount(), 5000)
```

### Test 4: Extension Context Loss
Reload extension, then on existing tab:
```javascript
ccTestExtension()
```
Should show context invalid, extension should not crash.

## 📋 Systematic Testing Checklist

### For Each Website:
- [ ] Homepage (should NOT trigger)
- [ ] Product pages (should NOT trigger)
- [ ] Cart page (should NOT trigger overlay, may cache amount)
- [ ] Signin/login page (should NOT trigger)
- [ ] Actual checkout page (should trigger with correct amount)

### For Amount Detection:
- [ ] Small amounts ($1-10) detected correctly
- [ ] Medium amounts ($10-100) detected correctly  
- [ ] Large amounts ($100+) detected correctly
- [ ] Multiple amounts prioritized correctly
- [ ] JavaScript amounts ignored

### For Overlay Behavior:
- [ ] Appears on correct pages
- [ ] Shows correct amount
- [ ] Shows correct merchant
- [ ] Timeout works (30 seconds)
- [ ] Mouse interaction cancels timeout
- [ ] Close button works
- [ ] Manage cards button works

## 🎯 Success Criteria

✅ **Perfect Score:**
- No false positives (overlay on wrong pages)
- No false negatives (missing on checkout pages)  
- Accurate amount detection (±$0.01)
- Proper merchant recognition
- Stable overlay behavior

⚠️ **Acceptable Score:**
- <5% false positive rate
- <10% false negative rate
- Amount accuracy within 10%
- 90%+ merchant recognition

❌ **Needs Fix:**
- >10% false positive rate
- >20% false negative rate
- Frequent crashes or errors
- Poor amount accuracy

## 📝 Reporting Issues

When reporting issues, include:
1. Website URL
2. Expected behavior
3. Actual behavior
4. Console output from `ccTestSuite()`
5. Screenshots if relevant

Example issue report:
```
Website: https://signin.costco.com/...
Expected: No overlay (signin page)
Actual: Overlay appears
Console: ccTestCheckout() shows "Is excluded page: false"
```