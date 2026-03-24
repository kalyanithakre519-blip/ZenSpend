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
  const saveBtn = document.getElementById('save-settings');
  const reflectionText = document.getElementById('reflection-text');
  const hoursSavedEl = document.getElementById('hours-saved');
  const moneySavedEl = document.getElementById('money-saved');
  const goalBar = document.getElementById('goal-bar');
  const currentGoalInput = document.getElementById('current-goal');
  const goalSummary = document.getElementById('goal-summary');

  // Load settings
  chrome.storage.local.get(['hourlyWage', 'isFrictionEnabled', 'hoursSaved', 'moneySaved', 'isFomoEnabled', 'currentGoal'], (data) => {
    if (data.hourlyWage) hourlyWageInput.value = data.hourlyWage;
    if (data.isFrictionEnabled !== undefined) frictionToggle.checked = data.isFrictionEnabled;
    if (data.isFomoEnabled !== undefined) fomoToggle.checked = data.isFomoEnabled;
    if (data.currentGoal) currentGoalInput.value = data.currentGoal;
    
    const hSaved = data.hoursSaved || 0;
    const mSaved = data.moneySaved || 0;
    
    hoursSavedEl.textContent = hSaved.toFixed(1);
    moneySavedEl.textContent = `$${mSaved.toLocaleString()}`;
    
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
    const currentGoal = currentGoalInput.value;

    chrome.storage.local.set({ 
      hourlyWage, 
      isFrictionEnabled,
      isFomoEnabled,
      currentGoal
    }, () => {
      saveBtn.innerText = 'Settings Saved!';
      saveBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      
      setTimeout(() => {
        saveBtn.innerText = 'Save Preferences';
        saveBtn.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
      }, 2000);
    });
  });
});
