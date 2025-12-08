#!/bin/bash

# Release Script for Algorithm Practice
# Usage: ./scripts/release.sh [patch|minor|major] [--dry-run]
#
# Examples:
#   ./scripts/release.sh patch      # 0.0.9 -> 0.0.10
#   ./scripts/release.sh minor      # 0.0.9 -> 0.1.0
#   ./scripts/release.sh major      # 0.0.9 -> 1.0.0
#   ./scripts/release.sh patch --dry-run  # Preview changes without committing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
BUMP_TYPE=${1:-patch}
DRY_RUN=false

if [[ "$2" == "--dry-run" ]] || [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    if [[ "$1" == "--dry-run" ]]; then
        BUMP_TYPE="patch"
    fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Algorithm Practice Release Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
    if [ "$DRY_RUN" = false ]; then
        read -p "Do you want to continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}v${CURRENT_VERSION}${NC}"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $BUMP_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo -e "${RED}Invalid bump type: $BUMP_TYPE${NC}"
        echo "Usage: $0 [patch|minor|major] [--dry-run]"
        exit 1
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo -e "New version: ${GREEN}v${NEW_VERSION}${NC}"
echo -e "Bump type: ${BLUE}${BUMP_TYPE}${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN - No changes will be made${NC}"
    echo ""
    echo "Would perform the following actions:"
    echo "  1. Update version in package.json to ${NEW_VERSION}"
    echo "  2. Update version in electron-builder.config.js"
    echo "  3. Git commit with message: 'chore: release v${NEW_VERSION}'"
    echo "  4. Create git tag: v${NEW_VERSION}"
    echo "  5. Push commit and tag to origin"
    echo ""
    echo -e "${BLUE}To actually release, run without --dry-run:${NC}"
    echo "  ./scripts/release.sh ${BUMP_TYPE}"
    exit 0
fi

# Confirm release
echo -e "${YELLOW}This will:${NC}"
echo "  1. Update version in package.json"
echo "  2. Update version in electron-builder.config.js"
echo "  3. Commit changes"
echo "  4. Create a git tag"
echo "  5. Push to origin (triggers GitHub Actions build)"
echo ""
read -p "Continue with release? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release cancelled."
    exit 1
fi

echo ""
echo -e "${BLUE}Updating versions...${NC}"

# Update package.json version
npm version $NEW_VERSION --no-git-tag-version

# Update electron-builder.config.js if it contains version
if grep -q "bundleShortVersion" electron-builder.config.js; then
    sed -i.bak "s/bundleShortVersion: '[^']*'/bundleShortVersion: '${NEW_VERSION}'/" electron-builder.config.js
    rm -f electron-builder.config.js.bak
fi

echo -e "${GREEN}✓ Version updated to ${NEW_VERSION}${NC}"

# Git operations
echo ""
echo -e "${BLUE}Creating git commit and tag...${NC}"

git add package.json package-lock.json electron-builder.config.js
git commit -m "chore: release v${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

echo -e "${GREEN}✓ Git commit and tag created${NC}"

# Push to origin
echo ""
echo -e "${BLUE}Pushing to origin...${NC}"

git push origin main
git push origin "v${NEW_VERSION}"

echo -e "${GREEN}✓ Pushed to origin${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Release v${NEW_VERSION} initiated!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "GitHub Actions will now:"
echo "  1. Build desktop apps for Windows, macOS, and Linux"
echo "  2. Generate changelog"
echo "  3. Create GitHub Release with all artifacts"
echo ""
echo -e "Track progress: ${BLUE}https://github.com/zxypro1/OfflineLeetPractice/actions${NC}"
echo -e "Release page: ${BLUE}https://github.com/zxypro1/OfflineLeetPractice/releases/tag/v${NEW_VERSION}${NC}"

