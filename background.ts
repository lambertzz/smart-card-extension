chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    // Open the extension popup
    chrome.action.openPopup();
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Credit Card Assistant installed');
});