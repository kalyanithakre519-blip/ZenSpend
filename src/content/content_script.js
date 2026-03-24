/**
 * ZenSpend: AI-Driven Spending Control Tool
 * Content Script Logic
 */

const PLATFORMS = {
  AMAZON: {
    selectors: ['#buy-now-button', '#add-to-cart-button', 'input[name="submit.buy-now"]'],
    priceSelector: '#corePrice_feature_div .a-offscreen, #priceblock_ourprice, #priceblock_dealprice',
    name: 'Amazon'
  },
  SHOPIFY: {
    selectors: ['button[name="add"]', 'button[type="submit"][class*="product-form"]', '.shopify-payment-button'],
    priceSelector: '[data-price], .price-item--regular',
    name: 'Shopify Store'
  },
  WALMART: {
    selectors: ['button[data-automation-id="add-to-cart"]', 'button[aria-label="Add to cart"]'],
    priceSelector: '[data-automation-id="item-price"] .w_iB',
    name: 'Walmart'
  }
};

let currentSettings = {
  hourlyWage: 45,
  isFrictionEnabled: true,
  coolingOffPeriod: 60, // seconds for demo
  antiFomoEnabled: true,
  currentGoal: "Financial Freedom",
  goalTarget: 10000
};

// State
let isOverlayActive = false;
let countdownTimer = null;
let remainingSeconds = 0;
let lastDetectedUrgency = null;

// Behavioral Analysis State
let scrollSpeeds = [];
let lastScrollY = window.scrollY;
let lastScrollTime = Date.now();
let isImpulseBehaviorDetected = false;

/**
 * Initialize Settings
 */
chrome.storage.local.get(['hourlyWage', 'isFrictionEnabled', 'currentGoal', 'goalTarget'], (data) => {
  if (data.hourlyWage) currentSettings.hourlyWage = data.hourlyWage;
  if (data.isFrictionEnabled !== undefined) currentSettings.isFrictionEnabled = data.isFrictionEnabled;
  if (data.currentGoal) currentSettings.currentGoal = data.currentGoal;
  if (data.goalTarget) currentSettings.goalTarget = data.goalTarget;
  console.log('ZenSpend initialized with goals:', currentSettings);
});

/**
 * Detect Platform
 */
const getActivePlatform = () => {
  const host = window.location.hostname;
  if (host.includes('amazon')) return PLATFORMS.AMAZON;
  if (host.includes('walmart')) return PLATFORMS.WALMART;
  // Default to Shopify-style detection if metadata exists
  if (document.querySelector('.shopify-payment-button') || window.Shopify) return PLATFORMS.SHOPIFY;
  return null;
};

/**
 * Extract Price
 */
const getPrice = (platform) => {
  const priceEl = document.querySelector(platform.priceSelector);
  if (!priceEl) return 0;
  
  const priceText = priceEl.innerText || priceEl.textContent;
  const match = priceText.match(/[\d,.]+/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
};

/**
 * Calculate Life Hours
 */
const calculateLifeHours = (price) => {
  return (price / currentSettings.hourlyWage).toFixed(1);
};

/**
 * Behavioral Impulse Tracking
 */
const startBehavioralTracking = () => {
    window.addEventListener('scroll', () => {
        const currentTime = Date.now();
        const currentScrollY = window.scrollY;
        const timeDiff = currentTime - lastScrollTime;
        const distDiff = Math.abs(currentScrollY - lastScrollY);
        
        if (timeDiff > 0) {
            const speed = distDiff / timeDiff;
            scrollSpeeds.push(speed);
            if (scrollSpeeds.length > 50) scrollSpeeds.shift();
            
            // If average speed is high, flag as impulsive browsing
            const avgSpeed = scrollSpeeds.reduce((a, b) => a + b, 0) / scrollSpeeds.length;
            if (avgSpeed > 15) { // Threshold for "Hectic Browsing"
                isImpulseBehaviorDetected = true;
            } else {
                isImpulseBehaviorDetected = false;
            }
        }
        
        lastScrollY = currentScrollY;
        lastScrollTime = currentTime;
    });
};

/**
 * Get AI Reflection based on Price and Behavioral State
 */
const getAIReflection = (price) => {
  let reflection = `Wait! This $${price} could be putting your goal of <strong>"${currentSettings.currentGoal}"</strong> at risk. Is this worth the delay?`;

  if (isImpulseBehaviorDetected) {
      reflection += " <br><span style='color: #ef4444;'>[AI Critical Alert: High Behavioral Impulse Detected!]</span>";
  }
  return reflection;
};

/**
 * Detect FOMO Tactics
 */
const detectFomoTactics = () => {
  const urgencyKeywords = ['limited time', 'only', 'left in stock', 'ending', 'hurry', 'deal of the day'];
  const pageText = document.body.innerText.toLowerCase();
  
  for (const keyword of urgencyKeywords) {
    if (pageText.includes(keyword)) {
      return `Warning: This site is using urgency tactics like "${keyword}" to rush your decision. Take another breath.`;
    }
  }
  return null;
};

/**
 * Handle Cancellation (Log Savings)
 */
const logSavings = (price, hours) => {
  chrome.storage.local.get(['moneySaved', 'hoursSaved'], (data) => {
    const newMoney = (data.moneySaved || 0) + price;
    const newHours = (data.hoursSaved || 0) + parseFloat(hours);
    
    chrome.storage.local.set({ 
      moneySaved: newMoney, 
      hoursSaved: newHours 
    }, () => {
      console.log('ZenSpend: Savings Logged!', { newMoney, newHours });
    });
  });
};

/**
 * Create Overlay
 */
const createOverlay = (lifeHours, price, platformName) => {
  if (document.getElementById('zenspend-overlay')) return;

  const aiReflection = getAIReflection(price);
  const fomoWarning = detectFomoTactics();

  const overlay = document.createElement('div');
  overlay.id = 'zenspend-overlay';
  overlay.className = 'zenspend-overlay';
  
  overlay.innerHTML = `
    <div class="zenspend-card">
      <div class="zenspend-icon">🧠</div>
      <h2 class="zenspend-title">AI Mindful Pause</h2>
      <p class="zenspend-subtitle">ZenSpend AI detected a <strong>$${price.toFixed(2)}</strong> purchase on ${platformName}.<br><em>"${aiReflection}"</em></p>
      
      ${fomoWarning ? `<div style="color: #fbbf24; font-size: 0.8rem; margin-bottom: 20px; padding: 10px; border: 1px solid #fbbf24; border-radius: 8px;">🚨 ${fomoWarning}</div>` : ''}

      <div class="zenspend-price-insight">
        <span class="zenspend-stat-label">Investment in Life Hours</span>
        <span class="zenspend-stat-value">${lifeHours} Hours</span>
      </div>

      <div class="zenspend-timer-container">
        <div id="zenspend-timer-bar" class="zenspend-timer-bar"></div>
      </div>

      <div class="zenspend-actions">
        <button id="zenspend-cancel" class="zenspend-btn zenspend-btn-secondary">I'll pass for now</button>
        <button id="zenspend-proceed" class="zenspend-btn zenspend-btn-primary">Proceed anyway (<span id="zenspend-timer">60</span>s)</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add event listeners
  document.getElementById('zenspend-cancel').addEventListener('click', () => {
    logSavings(price, lifeHours);
    hideOverlay();
    if (window.location.href.includes('checkout') || window.location.href.includes('cart')) {
        window.history.back();
    }
  });

  document.getElementById('zenspend-proceed').addEventListener('click', (e) => {
    if (remainingSeconds <= 0) {
      hideOverlay();
      // Resume original action (handled in interceptors if possible, 
      // but here we just hide the overlay and let user click again or trigger click)
      // This is a simplified approach.
    }
  });

  return overlay;
};

const showOverlay = (lifeHours, price, platformName) => {
  const overlay = createOverlay(lifeHours, price, platformName);
  setTimeout(() => overlay.classList.add('active'), 50);
  
  isOverlayActive = true;
  remainingSeconds = currentSettings.coolingOffPeriod;
  startTimer();
};

const hideOverlay = () => {
  const overlay = document.getElementById('zenspend-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 400);
  }
  isOverlayActive = false;
  if (countdownTimer) clearInterval(countdownTimer);
};

const startTimer = () => {
  const timerText = document.getElementById('zenspend-timer');
  const timerBar = document.getElementById('zenspend-timer-bar');
  const proceedBtn = document.getElementById('zenspend-proceed');
  
  const total = currentSettings.coolingOffPeriod;
  
  countdownTimer = setInterval(() => {
    remainingSeconds--;
    timerText.innerText = remainingSeconds;
    
    const progress = (remainingSeconds / total) * 100;
    timerBar.style.width = `${progress}%`;

    if (remainingSeconds <= 0) {
      clearInterval(countdownTimer);
      proceedBtn.classList.add('ready');
      proceedBtn.innerText = 'Buy Anyway';
      timerBar.style.backgroundColor = '#6366f1';
    }
  }, 1000);
};

/**
 * Intercept Clicks
 */
const interceptAction = (e) => {
  if (!currentSettings.isFrictionEnabled) return;
  if (isOverlayActive) return;

  const platform = getActivePlatform();
  if (!platform) return;

  const price = getPrice(platform);
  const lifeHours = calculateLifeHours(price);

  // Prevent event
  e.preventDefault();
  e.stopPropagation();

  // Show Mindfulness Overlay
  showOverlay(lifeHours, price, platform.name);
};

/**
 * Main Observer
 */
const initObserver = () => {
  const platform = getActivePlatform();
  if (!platform) return;

  const observer = new MutationObserver(() => {
    platform.selectors.forEach(selector => {
      const btn = document.querySelector(selector);
      if (btn && !btn.dataset.zenspendInitialized) {
        btn.dataset.zenspendInitialized = 'true';
        btn.addEventListener('click', interceptAction, true);
        console.log('ZenSpend: Intercepted button', btn);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

// Logic for Shopify if script loads late
setTimeout(() => {
    initObserver();
    startBehavioralTracking();
}, 1000);
console.log('ZenSpend Advanced Engine Active: Monitoring Behavior & Price.');
