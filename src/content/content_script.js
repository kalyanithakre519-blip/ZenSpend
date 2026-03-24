/**
 * ZenSpend: AI-Driven Spending Control Tool
 * Content Script Logic - Optimized for Amazon.in
 */

const PLATFORMS = {
  AMAZON: {
    selectors: [
        '#buy-now-button', 
        '#add-to-cart-button', 
        'input[name*="submit.buy-now"]',
        'input[name*="submit.add-to-cart"]',
        'button[name*="submit.add-to-cart"]',
        '#sw-atc-view-cart-button', 
        '.a-button-inner input', // Broad match for Amazon buttons
        '#nav-cart' 
    ],
    priceSelector: '#corePrice_feature_div .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .a-price-whole, #sc-subtotal-amount-buybox, #sw-subtotal span.a-offscreen, .a-size-medium.a-color-price, .p13n-sc-price',
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
  hourlyWage: 500, // Default for demo: 500 INR/hr
  isFrictionEnabled: true,
  coolingOffPeriod: 20, 
  antiFomoEnabled: true,
  currentGoal: "Financial Freedom",
  goalTarget: 10000,
  currency: '₹',
  isSensorEnabled: true
};

// State
let isOverlayActive = false;
let countdownTimer = null;
let remainingSeconds = 0;
const pageLoadTime = Date.now();

// Behavioral Analysis State
let scrollSpeeds = [];
let lastScrollY = window.scrollY;
let lastScrollTime = Date.now();
let isImpulseBehaviorDetected = false;
let impulseBadgeTimer = null;

// New Sensor State
let clickCount = 0;
let lastClickTime = 0;
let activeTabCount = 0;
let lastScrollBeepTime = 0;
let audioCtx = null;

/**
 * Audio Context Initializer
 */
const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

window.addEventListener('mousedown', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

/**
 * Audio Alert (Voice Response)
 */
const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
};

/**
 * Literal Beep Sound (Bajna)
 */
const playBeep = (freq = 440, duration = 0.2, volume = 0.5) => {
    try {
        if (!audioCtx) initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.error("Resume failed:", e));
            console.warn("Audio Context is suspended. Please click anywhere on the page to enable sensor sound.");
            return;
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // 'square' oscillator is much more 'alarm-like' than 'sine'
        oscillator.type = 'square'; 
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
        console.log(`[Sensor] Beep played at ${freq}Hz`);
    } catch (e) {
        console.error("Audio error:", e);
    }
};

/**
 * Pulsed Siren Alarm (Intensity Sensor)
 */
const playAlarm = (repeats = 3) => {
    console.log("[Sensor] Alarm Triggered!");
    let count = 0;
    const interval = setInterval(() => {
        // Harsh buzzer sound (Square wave at alternating frequencies)
        playBeep(count % 2 === 0 ? 800 : 500, 0.15, 0.4);
        count++;
        if (count >= repeats * 2) clearInterval(interval);
    }, 200);
};

/**
 * Initialize Settings
 */
chrome.storage.local.get(['hourlyWage', 'isFrictionEnabled', 'currentGoal', 'goalTarget'], (data) => {
  if (data.hourlyWage) currentSettings.hourlyWage = data.hourlyWage;
  if (data.isFrictionEnabled !== undefined) currentSettings.isFrictionEnabled = data.isFrictionEnabled;
  if (data.currentGoal) currentSettings.currentGoal = data.currentGoal;
  if (data.goalTarget) currentSettings.goalTarget = data.goalTarget;
  if (data.isSensorEnabled !== undefined) currentSettings.isSensorEnabled = data.isSensorEnabled;
  
  if (document.body.innerText.includes('₹')) currentSettings.currency = '₹';
  else if (document.body.innerText.includes('$')) currentSettings.currency = '$';
  
  console.log('ZenSpend storage settings loaded:', currentSettings);
  updateStatusBadgeUI(); 
  
  // Tab Overload Sensor: Check tab count on start
  chrome.runtime.sendMessage({ type: 'GET_TAB_COUNT' }, (response) => {
    if (response && response.count) {
        activeTabCount = response.count;
        if (activeTabCount >= 5) {
            speak(`Warning! You have ${activeTabCount} shopping tabs open. You are on a shopping spree!`);
        }
    }
  });
});

// Update settings when changed in popup
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.isSensorEnabled) {
            currentSettings.isSensorEnabled = changes.isSensorEnabled.newValue;
            updateStatusBadgeUI();
        }
        if (changes.hourlyWage) currentSettings.hourlyWage = changes.hourlyWage.newValue;
        if (changes.isFrictionEnabled) currentSettings.isFrictionEnabled = changes.isFrictionEnabled.newValue;
        if (changes.currentGoal) currentSettings.currentGoal = changes.currentGoal.newValue;
    }
});

const updateStatusBadgeUI = () => {
    const badge = document.getElementById('zenspend-status-badge');
    if (!badge) return;
    badge.innerText = `ZenSpend Sensor: ${currentSettings.isSensorEnabled ? 'ON 🔊' : 'OFF 🔇'}`; 
    badge.style.background = currentSettings.isSensorEnabled ? 'rgba(34, 197, 94, 0.9)' : 'rgba(100, 116, 139, 0.9)'; 
    badge.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
};

/**
 * Inject Status Badge to confirm it's running
 */
const injectStatusBadge = () => {
    if (document.getElementById('zenspend-status-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'zenspend-status-badge';
    badge.style.cssText = `
        position: fixed; top: 10px; right: 10px; z-index: 999999;
        background: rgba(99, 102, 241, 0.9); color: white;
        padding: 8px 15px; border-radius: 20px; font-size: 11px;
        font-family: sans-serif; cursor: pointer; border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    badge.innerText = `ZenSpend Sensor: ${currentSettings.isSensorEnabled ? 'ON 🔊' : 'OFF 🔇'}`;
    document.body.appendChild(badge);

    // Toggle Sensor 
    badge.addEventListener('click', (e) => {
        initAudio();
        currentSettings.isSensorEnabled = !currentSettings.isSensorEnabled;
        chrome.storage.local.set({ isSensorEnabled: currentSettings.isSensorEnabled });
        updateStatusBadgeUI();
        if (currentSettings.isSensorEnabled) {
            playAlarm(1);
        }
        e.stopPropagation();
    });
    
    // Auto-dim after 10s
    setTimeout(() => { badge.style.opacity = '0.6'; }, 10000);

    // Audio Activation handler (removed wake text, integrated into toggle)
    const activateAudio = () => {
        initAudio();
    };

    window.addEventListener('mousedown', activateAudio);
    window.addEventListener('keydown', activateAudio);
};

/**
 * Detect Platform
 */
const getActivePlatform = () => {
  const host = window.location.hostname;
  if (host.includes('amazon')) return PLATFORMS.AMAZON;
  if (host.includes('walmart')) return PLATFORMS.WALMART;
  if (document.querySelector('.shopify-payment-button') || window.Shopify) return PLATFORMS.SHOPIFY;
  return null;
};

/**
 * Extract Price
 */
const getPrice = (platform, targetElement) => {
  const parsePriceText = (text) => {
    if (!text) return 0;
    const cleaned = text.replace(/[^\d.]/g, '');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  };

  // 1. Try to find price near the button
  if (targetElement) {
      const container = targetElement.closest('.s-result-item, .puis-card-container, .a-box, .sw-atc-buy-box-container, .centerCol');
      if (container) {
          const priceSelectors = platform.priceSelector.split(', ');
          for (const s of priceSelectors) {
              const el = container.querySelector(s);
              if (el) return parsePriceText(el.innerText || el.textContent);
          }
      }
  }

  // 2. Fallback to global
  const priceSelectors = platform.priceSelector.split(', ');
  for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el) {
          const price = parsePriceText(el.innerText || el.textContent);
          if (price > 0) return price;
      }
  }
  return 0;
};

/**
 * Calculate Life Hours
 */
const calculateLifeHours = (price) => {
  const hourlyWage = currentSettings.hourlyWage || 500;
  const adjustedWage = hourlyWage * 0.7; // Factor in taxes/expenses
  return (price / adjustedWage).toFixed(1);
};

/**
 * Inject Life-Hour Tags
 */
const injectLifeHourTags = () => {
    const platform = getActivePlatform();
    if (!platform) return;

    const priceSelectors = platform.priceSelector.split(', ');
    priceSelectors.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
            if (el.dataset.zenspendTagged || el.offsetParent === null) return;
            const text = (el.innerText || el.textContent).trim();
            if (text.length < 2) return;
            
            const price = parseFloat(text.replace(/[^\d.]/g, ''));
            if (price > 0) {
                const lifeHours = calculateLifeHours(price);
                const tag = document.createElement('span');
                tag.className = 'zenspend-life-tag';
                tag.innerHTML = ` (⌛ ${lifeHours}h Life)`;
                tag.title = `Costs ${lifeHours} work hours @ ₹${currentSettings.hourlyWage}/hr`;
                el.dataset.zenspendTagged = 'true';
                el.parentElement.appendChild(tag);
            }
        });
    });
};

/**
 * Hectic Scroll Detection
 */
const updateImpulseBadge = (isActive) => {
    let badge = document.getElementById('zenspend-impulse-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'zenspend-impulse-badge';
        badge.className = 'zenspend-impulse-badge';
        badge.innerHTML = 'Hectic Browsing Detected ⚠️';
        document.body.appendChild(badge);
    }
    
    if (isActive) {
        badge.classList.add('active');
        document.body.classList.add('zenspend-vibrate'); // Visual Vibration Alert
        playAlarm(2); // Sensor Ringing
        
        if (impulseBadgeTimer) clearTimeout(impulseBadgeTimer);
        impulseBadgeTimer = setTimeout(() => { 
            badge.classList.remove('active'); 
            document.body.classList.remove('zenspend-vibrate'); 
        }, 3000);
    }
};

const startBehavioralTracking = () => {
    window.addEventListener('scroll', () => {
        const currentTime = Date.now();
        const currentScrollY = window.scrollY;
        
        // Every-time beep on scroll if sensor is on
        if (currentSettings.isSensorEnabled && currentTime - lastScrollBeepTime > 150) {
            playBeep(300, 0.05, 0.1); // Subtle tick sound
            lastScrollBeepTime = currentTime;
        }

        // Reset tracking if user hasn't scrolled in a while to avoid huge timeDiff
        if (currentTime - lastScrollTime > 300) {
            lastScrollTime = currentTime;
            lastScrollY = currentScrollY;
            return;
        }

        const timeDiff = currentTime - lastScrollTime;
        const distDiff = Math.abs(currentScrollY - lastScrollY);
        
        if (timeDiff > 0) {
            const speed = distDiff / timeDiff;
            scrollSpeeds.push(speed);
            if (scrollSpeeds.length > 10) scrollSpeeds.shift(); 
            
            const avgSpeed = scrollSpeeds.reduce((a, b) => a + b, 0) / scrollSpeeds.length;
            
            if (avgSpeed > 4) { 
                if (!isImpulseBehaviorDetected) {
                    updateImpulseBadge(true);
                } else {
                    if (currentTime - lastScrollBeepTime > 250) { 
                        playBeep(1200, 0.2, 0.4); 
                        lastScrollBeepTime = currentTime;
                    }
                }
                isImpulseBehaviorDetected = true;
            } else {
                isImpulseBehaviorDetected = false;
            }
        }
        lastScrollY = currentScrollY;
        lastScrollTime = currentTime;
    }, { passive: true });

    // Every-time beep on clicks if sensor is on
    window.addEventListener('mousedown', () => {
        if (currentSettings.isSensorEnabled) {
            playBeep(200, 0.05, 0.15); // Subtle click feedback
        }
    }, true);
};

/**
 * Overlay Management
 */
const createOverlay = (lifeHours, price, platformName) => {
  if (document.getElementById('zenspend-overlay')) return;

  const symbol = currentSettings.currency || '₹';
  const fomoCount = (document.body.innerText.match(/limited time|only|left in stock|ending|hurry|best seller/gi) || []).length;
  const fomoWarning = fomoCount > 0 ? `Site is using ${fomoCount} urgency tactics to rush you.` : null;

  const overlay = document.createElement('div');
  overlay.id = 'zenspend-overlay';
  overlay.className = 'zenspend-overlay';
  
  const isDecisionTooFast = (Date.now() - pageLoadTime) < 15000;
  const isTabOverload = activeTabCount >= 5;

  overlay.innerHTML = `
    <div class="zenspend-card">
      <div class="zenspend-icon">🧠</div>
      <h2 class="zenspend-title">AI Mindful Pause</h2>
      <p class="zenspend-subtitle">
        Detected a <strong>${symbol}${price.toFixed(2)}</strong> purchase.<br>
        ${isImpulseBehaviorDetected ? "<span style='color:#f87171'>AI Warning: Hectic browsing detected.</span>" : (isDecisionTooFast ? "<span style='color:#f87171'>AI Sensor: Mindless shopping detected. You didn't even look at the product properly.</span>" : "Your goal: " + currentSettings.currentGoal)}
      </p>
      
      ${isTabOverload ? `<div style="color: #ef4444; font-size: 0.9rem; margin-top: 10px; font-weight: bold;">⚠️ TAB OVERLOAD: You have ${activeTabCount} shopping tabs open. Stop the madness!</div>` : ''}
      ${fomoWarning ? `<div style="color: #fbbf24; font-size: 0.8rem; margin: 10px 0; border: 1px solid #fbbf24; border-radius: 8px; padding: 5px;">🚨 ${fomoWarning}</div>` : ''}

      <div class="zenspend-price-insight">
        <span class="zenspend-stat-label">Life-Hour Cost</span>
        <span class="zenspend-stat-value">${lifeHours} Hours</span>
      </div>

      <div class="zenspend-timer-container">
        <div id="zenspend-timer-bar" class="zenspend-timer-bar"></div>
      </div>

      <div class="zenspend-actions">
        <button id="zenspend-cancel" class="zenspend-btn zenspend-btn-secondary">I'll pass for now</button>
        <button id="zenspend-proceed" class="zenspend-btn zenspend-btn-primary">Proceed (<span id="zenspend-timer">60</span>s)</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('zenspend-cancel').addEventListener('click', () => {
    // Save stats before hiding overlay
    chrome.storage.local.get(['hoursSaved', 'moneySaved'], (data) => {
        const hSaved = (data.hoursSaved || 0) + parseFloat(lifeHours);
        const mSaved = (data.moneySaved || 0) + parseFloat(price);
        
        chrome.storage.local.set({ 
            hoursSaved: hSaved, 
            moneySaved: mSaved 
        }, () => {
            console.log(`[ZenSpend] Saved: $${price} and ${lifeHours} hours!`);
            hideOverlay();
            window.history.back();
        });
    });
  });

  document.getElementById('zenspend-proceed').addEventListener('click', () => {
    if (remainingSeconds <= 0) hideOverlay();
  });

  return overlay;
};

const showOverlay = (lifeHours, price, platformName) => {
  const overlay = createOverlay(lifeHours, price, platformName);
  if (!overlay) return;
  setTimeout(() => overlay.classList.add('active'), 10);
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
    if (timerText) timerText.innerText = remainingSeconds;
    if (timerBar) timerBar.style.width = `${(remainingSeconds / total) * 100}%`;

    if (remainingSeconds <= 0) {
      clearInterval(countdownTimer);
      if (proceedBtn) {
          proceedBtn.classList.add('ready');
          proceedBtn.innerText = 'Buy Anyway';
      }
    }
  }, 1000);
};

/**
 * Click Interception
 */
const interceptAction = (e) => {
  if (!currentSettings.isFrictionEnabled || isOverlayActive) return;

  const platform = getActivePlatform();
  if (!platform) return;

  const price = getPrice(platform, e.target);
  if (price === 0) return; 

  // --- Rapid Click Sensor (Ghabrahat Sensor) ---
  const currentTime = Date.now();
  if (currentTime - lastClickTime < 2000) {
      clickCount++;
  } else {
      clickCount = 1;
  }
  lastClickTime = currentTime;

  if (clickCount >= 3) {
      playAlarm(3); // Nervousness/Impulse Sensor Alarm
      speak("Wait! You seem excited or nervous. Calm down before buying.");
      clickCount = 0; // Reset
      // Continue to overlay anyway to enforce friction
  }

  // --- Decision Speed Sensor (Jaldbaazi Sensor) ---
  const timeOnPage = (currentTime - pageLoadTime) / 1000;
  if (timeOnPage < 15) {
      playAlarm(2); // Fast Decision Sensor Alarm
      speak("You are shopping too fast! You haven't even looked at the details properly.");
  }

  e.preventDefault();
  e.stopPropagation();

  showOverlay(calculateLifeHours(price), price, platform.name);
};

/**
 * Main Observer
 */
const initObserver = () => {
  const platform = getActivePlatform();
  if (!platform) return;

  const observer = new MutationObserver(() => {
    platform.selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(btn => {
        if (!btn.dataset.zenspendInitialized) {
            btn.dataset.zenspendInitialized = 'true';
            btn.addEventListener('click', interceptAction, true);
        }
      });
    });
    injectLifeHourTags();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  // Dynamic call for immediate tags
  injectLifeHourTags();
};

/**
 * Cart Alarm Sensor
 */
const checkCartSensor = () => {
    const url = window.location.href.toLowerCase();
    const isCart = url.includes('/cart') || 
                  url.includes('/checkout') || 
                  url.includes('/basket') || 
                  url.includes('gp/cart/view.html');
                  
    if (isCart && currentSettings.isSensorEnabled) {
        console.log("[Sensor] Cart detected! Triggering alarm.");
        // Short delay to ensure audio context is ready (if was interaction before)
        setTimeout(() => {
            playAlarm(5); // Intense alarm for cart
            speak("Zen Spend Alert! You are about to spend money. Are you sure you need these items? Think of your goal: " + currentSettings.currentGoal);
        }, 1000);
    }
};

// Start everything
console.log('ZenSpend: Content script loaded and initializing...');
injectStatusBadge(); // Inject immediately so user sees it

setTimeout(() => {
    initObserver();
    startBehavioralTracking();
    checkCartSensor();
    console.log('ZenSpend: Observer, behavioral tracking, and cart sensor started.');
}, 500);

