/**
 * ZenSpend: AI-Driven Spending Control Tool
 * Service Worker (Background Script)
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('ZenSpend Extension installed!');
  
  // Set default settings
  chrome.storage.local.set({
    hourlyWage: 50,
    isFrictionEnabled: true,
    hoursSaved: 0,
    moneySaved: 0,
    lastReflections: [
      "Is this item worth 3 hours of your life?",
      "You've already saved $240 this month. Keep it up!",
      "Mindful spending is the path to financial freedom."
    ]
  });
});

// Listener for messages from content or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'REFLECT') {
    sendResponse({ 
      reflection: "Take a deep breath. Is this a want or a need?" 
    });
  }

  if (request.type === 'GET_TAB_COUNT') {
    chrome.tabs.query({}, (tabs) => {
      const shoppingKeywords = ['amazon', 'flipkart', 'shopify', 'walmart', 'target', 'ebay', 'aliexpress', 'myntra', 'ajio'];
      const shoppingTabs = tabs.filter(tab => {
        const url = tab.url ? tab.url.toLowerCase() : '';
        return shoppingKeywords.some(keyword => url.includes(keyword));
      });
      sendResponse({ count: shoppingTabs.length });
    });
    return true; // Keep message channel open for async response
  }
});
