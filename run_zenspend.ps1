# ZenSpend Browser Extension: Launcher Script
# This script automates the setup and testing process.

Write-Host "-------------------------------------------" -ForegroundColor Cyan
Write-Host "Launching ZenSpend Extension Environment..." -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Cyan

# 1. Open the Project Folder in Explorer
Write-Host "[1/3] Opening Project Directory..." -ForegroundColor Gray
explorer.exe "C:\Users\ishwa\Ai-Driven Impulse Spending control tools\"

# 2. Open Chrome Extensions Page
Write-Host "[2/3] Launching Chrome Extensions Manager..." -ForegroundColor Gray
Start-Process "chrome.exe" "chrome://extensions/"

# 3. Open Amazon India for Demo Testing
Write-Host "[3/3] Opening Amazon India for Live Test..." -ForegroundColor Gray
Start-Process "chrome.exe" "https://www.amazon.in/dp/B0B1PXM75C"

Write-Host ""
Write-Host "PROJECT READY!" -ForegroundColor Green
Write-Host "Remember to click 'Load unpacked' in Chrome and select this folder." -ForegroundColor White
Write-Host "-------------------------------------------" -ForegroundColor Cyan
