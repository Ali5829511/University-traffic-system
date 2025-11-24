#!/bin/bash

# Branch Status Checker Script
# This script helps verify that branches are properly connected to main

echo "=================================================="
echo "Branch Status Checker"
echo "Repository: University-traffic-system"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

echo -e "${BLUE}1. Checking repository status...${NC}"
echo ""

# Check if repository is shallow
if [ -f .git/shallow ]; then
    echo -e "${YELLOW}⚠ Repository is shallow (limited history)${NC}"
    echo "  Run: git fetch --unshallow"
else
    echo -e "${GREEN}✓ Repository has complete history${NC}"
fi

echo ""
echo -e "${BLUE}2. Checking fetch configuration...${NC}"
echo ""

FETCH_CONFIG=$(git config remote.origin.fetch)
if [[ "$FETCH_CONFIG" == "+refs/heads/*:refs/remotes/origin/*" ]]; then
    echo -e "${GREEN}✓ Fetch configuration is correct (tracks all branches)${NC}"
else
    echo -e "${YELLOW}⚠ Fetch configuration is limited${NC}"
    echo "  Current: $FETCH_CONFIG"
    echo "  Expected: +refs/heads/*:refs/remotes/origin/*"
    echo "  Run: git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'"
fi

echo ""
echo -e "${BLUE}3. Remote branches...${NC}"
echo ""

REMOTE_COUNT=$(git branch -r | wc -l)
echo "Total remote branches: $REMOTE_COUNT"

echo ""
echo -e "${BLUE}4. Analyzing branch relationships...${NC}"
echo ""

# Count merged and unmerged branches
MERGED_COUNT=$(git branch -r --merged origin/main | grep -v "origin/main" | wc -l)
UNMERGED_COUNT=$(git branch -r --no-merged origin/main | grep -v "origin/main" | wc -l)

echo -e "${GREEN}✓ Merged into main: $MERGED_COUNT branches${NC}"
echo -e "${YELLOW}⚠ Not yet merged: $UNMERGED_COUNT branches${NC}"

if [ $UNMERGED_COUNT -gt 0 ]; then
    echo ""
    echo "Unmerged branches:"
    git branch -r --no-merged origin/main | grep -v "origin/main" | sed 's/^/  - /'
fi

echo ""
echo -e "${BLUE}5. Current branch status...${NC}"
echo ""

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Check if current branch is up to date with its remote
if git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    BASE=$(git merge-base @ @{u})
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}✓ Branch is up to date with remote${NC}"
    elif [ "$LOCAL" = "$BASE" ]; then
        echo -e "${YELLOW}⚠ Branch is behind remote (need to pull)${NC}"
    elif [ "$REMOTE" = "$BASE" ]; then
        echo -e "${YELLOW}⚠ Branch is ahead of remote (need to push)${NC}"
    else
        echo -e "${RED}⚠ Branch has diverged from remote${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Branch has no upstream tracking${NC}"
fi

# Check if current branch is based on main
if git merge-base --is-ancestor origin/main HEAD; then
    echo -e "${GREEN}✓ Branch is based on main${NC}"
else
    echo -e "${RED}✗ Branch is NOT based on main${NC}"
    echo "  Consider rebasing: git rebase origin/main"
fi

echo ""
echo -e "${BLUE}6. Recommendations...${NC}"
echo ""

# Provide recommendations based on findings
if [ -f .git/shallow ]; then
    echo "• Unshallow the repository: git fetch --unshallow"
fi

if [[ "$FETCH_CONFIG" != "+refs/heads/*:refs/remotes/origin/*" ]]; then
    echo "• Fix fetch configuration: git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'"
fi

if [ $UNMERGED_COUNT -gt 5 ]; then
    echo "• Consider reviewing and merging pending branches"
fi

echo ""
echo "=================================================="
echo "Check complete!"
echo "=================================================="
