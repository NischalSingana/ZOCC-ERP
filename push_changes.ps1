$ErrorActionPreference = "Continue"

function Commit-With-Delay {
    param (
        [string]$Files,
        [string]$Message
    )
    
    Write-Host "----------------------------------------"
    Write-Host "Staging: $Files"
    $fileArray = $Files -split " "
    git add $fileArray
    
    Write-Host "Committing: $Message"
    git commit -m "$Message"
    
    $delay = 5
    Write-Host "Waiting for $delay seconds..."
    Start-Sleep -Seconds $delay
}

Write-Host "Starting split commit sequence..."

# 1. Backend Fixes
Commit-With-Delay -Files "server/index.js" -Message "fix backend submission routes and add password reset"

# 2. Submissions Approval Page
Commit-With-Delay -Files "my-app/src/pages/admin/SubmissionsApproval.jsx" -Message "update submission approval page with student details"

# 3. Student Details Page
Commit-With-Delay -Files "my-app/src/pages/admin/StudentDetails.jsx" -Message "fix student details page loading issue"

# 4. Push
Write-Host "----------------------------------------"
Write-Host "Pushing changes to remote..."
git push

Write-Host "✅ All changes pushed successfully!"
