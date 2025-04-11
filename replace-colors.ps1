# PowerShell script to replace colors in styles.css
$filePath = "frontend/src/styles.css"
$content = Get-Content -Path $filePath -Raw

# Brown to Black replacements
$content = $content -replace '#8B5A2B', '#222222'
$content = $content -replace '#A67C52', '#444444'
$content = $content -replace '#D2B48C', '#555555'
$content = $content -replace '#6D4C33', '#333333'
$content = $content -replace '#4C3824', '#222222'

# Light brown/beige backgrounds to light gray
$content = $content -replace '#f5f2ea', '#f5f5f5'
$content = $content -replace '#f8f4eb', '#f8f8f8'
$content = $content -replace '#ebe5d9', '#eeeeee'
$content = $content -replace '#e5dfd2', '#e6e6e6'
$content = $content -replace '#f0ece3', '#f0f0f0'

# Orange to Blue conversions
$content = $content -replace '#FF8C00', '#0066cc'
$content = $content -replace '#FFD700', '#3399ff'

# Special cases for rgba colors
$content = $content -replace 'rgba\(139, 90, 43,', 'rgba(34, 34, 34,'

# Save the changes back to the file
$content | Set-Content -Path $filePath

Write-Output "Color replacement completed successfully!" 