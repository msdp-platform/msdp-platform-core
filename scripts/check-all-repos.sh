#!/bin/bash

echo "🔍 MSDP Platform - Repository Status Check"
echo "=========================================="
echo ""

# Define repositories
repos=(
  "/Users/santanu/github/msdp-platform-core:Platform Core"
  "/Users/santanu/github/msdp-customer-frontends:Customer Frontends"
  "/Users/santanu/github/msdp-admin-frontends:Admin Frontends"
  "/Users/santanu/github/msdp-merchant-frontends:Merchant Frontends"
  "/Users/santanu/github/msdp-location-service:Location Service"
  "/Users/santanu/github/msdp-shared-libs:Shared Libraries"
  "/Users/santanu/github/msdp-testing:Testing"
  "/Users/santanu/github/msdp-devops-infrastructure:DevOps Infrastructure"
  "/Users/santanu/github/msdp-documentation:Documentation"
)

for repo_info in "${repos[@]}"; do
  IFS=':' read -r repo_path repo_name <<< "$repo_info"
  
  if [ -d "$repo_path" ]; then
    echo "📁 $repo_name:"
    cd "$repo_path"
    
    # Check current branch
    current_branch=$(git branch --show-current)
    echo "   Current Branch: $current_branch"
    
    # Check if remote exists
    if git remote get-url origin >/dev/null 2>&1; then
      remote_url=$(git remote get-url origin)
      echo "   Remote: $remote_url"
      
      # Check if there are unpushed commits
      if git status --porcelain | grep -q .; then
        echo "   Status: ⚠️  Uncommitted changes"
      else
        # Check if ahead of remote
        if git rev-list --count origin/$current_branch..$current_branch >/dev/null 2>&1; then
          ahead=$(git rev-list --count origin/$current_branch..$current_branch 2>/dev/null || echo "unknown")
          if [ "$ahead" != "0" ] && [ "$ahead" != "unknown" ]; then
            echo "   Status: ⚠️  $ahead commits ahead of remote"
          else
            echo "   Status: ✅ Up to date"
          fi
        else
          echo "   Status: ⚠️  Remote branch not found"
        fi
      fi
    else
      echo "   Remote: ❌ No remote configured"
      echo "   Status: ⚠️  Needs remote setup"
    fi
    echo ""
  else
    echo "📁 $repo_name: ❌ Repository not found at $repo_path"
    echo ""
  fi
done

echo "🎯 Next Steps:"
echo "1. Create private repositories in your GitHub organization"
echo "2. Set default branch to 'dev' for each repository"
echo "3. Add remotes using the REPOSITORY_SETUP_GUIDE.md"
echo "4. Push all branches to the new remotes"
echo ""
echo "📋 See REPOSITORY_SETUP_GUIDE.md for detailed instructions"
