Write-Host "Starting SmartStay Development Environment..." -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "SmartStay-backend"
$frontendPath = Join-Path $PSScriptRoot "SmartStay-frontend"

if ((Test-Path $backendPath) -and (Test-Path $frontendPath)) {
    Write-Host "Starting Backend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start"
    
    Write-Host "Starting Frontend Server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"
    
    Write-Host "Servers launched in new windows. Please check for any errors there." -ForegroundColor Yellow
} else {
    Write-Host "Error: Could not find SmartStay-backend or SmartStay-frontend directories." -ForegroundColor Red
}
