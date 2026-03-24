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
    // Potentially use an AI API here to generate reflection?
    // For now, return a generic mindfulness prompt
    sendResponse({ 
      reflection: "Take a deep breath. Is this a want or a need?" 
    });
  }
});
