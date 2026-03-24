# ZenSpend: AI-Driven Impulse Spending Control Tool - Project Report 🧘🧠

## 1. Project Vision
ZenSpend aims to bridge the gap between "Instant Impulse" and "Rational Decision" in online retail. By introducing temporal friction (cooling-off periods) and psychological friction (life-hour costs), it empowers users to take control of their financial health.

## 2. Technical Stack
- **Framework**: Chrome Extension Manifest V3.
- **Languages**: HTML5, CSS3, JavaScript (ES6+).
- **APIs**: Chrome Storage, Scripting, MutationObserver.
- **Design Language**: Glassmorphism with 'Outfit' Typography.

## 3. System Architecture

### A. The Core Scraper (`Content Script`)
The `content_script.js` is injected into supported domains. It uses a `MutationObserver` to watch for dynamically added DOM elements (like AJAX-loaded Buy buttons) without polling the CPU.

### B. The Interception Engine
When a targeted button is clicked, the script:
1. Stops the default navigation event.
2. Extracts the `price` using regex from the page's currency elements.
3. Retrieves the user's `hourlyWage` from `chrome.storage.local`.
4. Calculates `investmentHours = price / hourlyWage`.

### C. Mindfulness UI (`The Overlay`)
The overlay is built with:
- `backdrop-filter: blur(20px)` to emphasize the "Pause."
- A CSS-based timer bar that visually counts down the required friction period.
- High-level "AI Analysis" tier logic that changes messaging based on spending amount.

## 4. Key Logic (The Algorithm)
```javascript
const getAIReflection = (price) => {
  if (price > 1000) return "This is a serious commitment. Consider waiting 24 hours.";
  if (price > 100) return "Is this a want or a need? You worked hard for this.";
  return "Small change adds up. Be mindful!";
};
```

## 5. Security & Privacy
ZenSpend operates entirely on-device. No shopping data or price logs are sent to a server. The configuration is stored locally within the Chrome profile.

---
*Developed for financial professionals who value mindful consumption.*
