const reflections = [
  "Is this item worth 3 hours of your life?",
  "You've already saved $240 this month. Keep it up!",
  "Mindful spending is the path to financial freedom.",
  "Your future self will thank you for this pause.",
  "Does this align with your long-term goals?",
  "Wait. Breathe. Reflect. Do you need this today?"
];

document.addEventListener('DOMContentLoaded', () => {
  const frictionToggle = document.getElementById('friction-toggle');
  const fomoToggle = document.getElementById('fomo-toggle');
  const sensorToggle = document.getElementById('sensor-toggle');
  const devModeToggle = document.getElementById('dev-mode-toggle');
  const volumeSlider = document.getElementById('volume-slider');
  const testSoundBtn = document.getElementById('test-sound');
  const saveBtn = document.getElementById('save-settings');
  const reflectionText = document.getElementById('reflection-text');
  const hoursSavedEl = document.getElementById('hours-saved');
  const moneySavedEl = document.getElementById('money-saved');
  const goalBar = document.getElementById('goal-bar');
  const currentGoalInput = document.getElementById('current-goal');
  const goalSummary = document.getElementById('goal-summary');
  const hourlyWageInput = document.getElementById('hourly-wage');

  // Load settings
  chrome.storage.local.get(['hourlyWage', 'isFrictionEnabled', 'hoursSaved', 'moneySaved', 'isFomoEnabled', 'currentGoal', 'isSensorEnabled'], (data) => {
    const hourlyWage = data.hourlyWage || 500;
    hourlyWageInput.value = hourlyWage;
    
    if (data.isFrictionEnabled !== undefined) frictionToggle.checked = data.isFrictionEnabled;
    if (data.isFomoEnabled !== undefined) fomoToggle.checked = data.isFomoEnabled;
    if (data.isSensorEnabled !== undefined) sensorToggle.checked = data.isSensorEnabled;
    if (data.isDevMode !== undefined) devModeToggle.checked = data.isDevMode;
    if (data.volume !== undefined) volumeSlider.value = data.volume;
    if (data.currentGoal) currentGoalInput.value = data.currentGoal;
    
    const hSaved = data.hoursSaved || 0;
    const mSaved = data.moneySaved || 0;
    
    hoursSavedEl.textContent = hSaved.toFixed(1);
    moneySavedEl.textContent = `₹${mSaved.toLocaleString()}`;

    // Update the nuevo life-hour worth section
    const currentWorthEl = document.getElementById('current-worth');
    const worthInsightEl = document.getElementById('worth-insight');
    if (currentWorthEl) currentWorthEl.textContent = `₹${hourlyWage}`;
    if (worthInsightEl) worthInsightEl.textContent = `Every hour of your life is worth ₹${hourlyWage}. This is what we use to calculate the "Life-Hour Cost" of your purchases.`;
    
    // Percentage logic
    const score = Math.min((hSaved * 10), 100);
    if (goalBar) goalBar.style.width = `${score}%`;
    if (goalSummary) goalSummary.innerText = `You've saved ${score}% of your next milestone!`;
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const hourlyWage = parseFloat(hourlyWageInput.value);
    const isFrictionEnabled = frictionToggle.checked;
    const isFomoEnabled = fomoToggle.checked;
    const isSensorEnabled = sensorToggle.checked;
    const currentGoal = currentGoalInput.value;

    chrome.storage.local.set({ 
      hourlyWage, 
      isFrictionEnabled,
      isFomoEnabled,
      isSensorEnabled,
      isDevMode: devModeToggle.checked,
      volume: parseInt(volumeSlider.value),
      currentGoal
    }, () => {
      // Refresh UI values immediately
      const currentWorthEl = document.getElementById('current-worth');
      const worthInsightEl = document.getElementById('worth-insight');
      if (currentWorthEl) currentWorthEl.textContent = `₹${hourlyWage}`;
      if (worthInsightEl) worthInsightEl.textContent = `Every hour of your life is worth ₹${hourlyWage}. This is what we use to calculate the "Life-Hour Cost" of your purchases.`;

      saveBtn.innerText = 'Settings Saved!';
      saveBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      
      setTimeout(() => {
        saveBtn.innerText = 'Save Preferences';
        saveBtn.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
      }, 2000);
    });
  });

  // Test Sound
  testSoundBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    if (typeof playAlarm === 'function') playAlarm(1);
                    else alert("ZenSpend Content Script not loaded on this page.");
                }
            });
        }
    });
  });
});
