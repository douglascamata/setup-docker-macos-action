#!/bin/bash

set -e

# Parse arguments
DRY_RUN=false
VERSION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      VERSION=$1
      shift
      ;;
  esac
done

if [[ "$VERSION" == v* ]]; then
  echo "Error: Version should not start with 'v'. Please provide version like '1.2.3' instead of 'v1.2.3'."
  exit 1
fi

if [ -z "$VERSION" ]; then
  echo "Usage: $0 [--dry-run] <version>"
  echo ""
  echo "Options:"
  echo "  --dry-run    Show what would be done without making any changes"
  exit 1
fi

MAJOR_VERSION=$(echo "$VERSION" | cut -d. -f1)

if [ "$DRY_RUN" = true ]; then
  echo "=== DRY RUN MODE ==="
  echo "No changes will be made to files or git repository"
  echo ""
fi

# --- Update CHANGELOG.md ---
CHANGELOG_FILE="CHANGELOG.md"
REPO_URL="https://github.com/douglascamata/setup-docker-macos-action"
# Get the previous version from the [Unreleased] link in the changelog.
PREVIOUS_VERSION=$(grep '\[Unreleased\]:' "$CHANGELOG_FILE" | sed -E 's/.*compare\/(.*)\.\.\.HEAD/\1/')
CURRENT_DATE=$(date +%Y-%m-%d)

if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] Would update CHANGELOG.md:"
  echo "  - Current version: $PREVIOUS_VERSION"
  echo "  - New version: v$VERSION"
  echo "  - Date: $CURRENT_DATE"
  echo "  - Would add: ## [v$VERSION] - $CURRENT_DATE"
  echo "  - Would update [Unreleased] link to compare from v$VERSION"
  echo "  - Would add [v$VERSION] link: $REPO_URL/compare/$PREVIOUS_VERSION...v$VERSION"
else
  echo "Updating CHANGELOG.md for new version v$VERSION..."

  # Use awk to update the changelog in place.
  # It's more robust and readable than sed for this task.
  awk \
    -v version="v$VERSION" \
    -v date="$CURRENT_DATE" \
    -v previous_version="$PREVIOUS_VERSION" \
    -v repo_url="$REPO_URL" \
    '
    # Find the "Unreleased" header and add the new version header below it.
    /## \[Unreleased\]/ {
      print "## [Unreleased]"
      print ""
      printf("## [%s] - %s\n", version, date)
      next
    }
    # Find the "Unreleased" link definition at the bottom of the file.
    /\[Unreleased\]:/ {
      # Update the "Unreleased" link to compare from the new version to HEAD.
      sub(previous_version "...", version "...")
      print
      # Add the link definition for the new version, comparing the last two versions.
      printf("[%s]: %s/compare/%s...%s\n", version, repo_url, previous_version, version)
      next
    }
    # Print all other lines as-is.
    { print }
    ' "$CHANGELOG_FILE" > "$CHANGELOG_FILE.tmp" && mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"

  echo "CHANGELOG.md has been updated."
  echo "Please review the changes before proceeding."
  read -p "Proceed with commit? (y/n) " -n 1 -r
  git add "$CHANGELOG_FILE"
  git commit -m "Prepare changelog for v$VERSION"
fi
echo

# --- Tagging ---
if [ "$DRY_RUN" = true ]; then
  echo "[DRY RUN] Would create the following tags:"
  echo "  - v$VERSION"
  echo "  - v$MAJOR_VERSION (force update)"
  echo "[DRY RUN] Would push tags to remote"
else
  echo "The following tags will be created: v$VERSION, v$MAJOR_VERSION"
  echo "The tags will NOT be pushed automatically."
  read -p "Are you sure? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]
  then
    git tag "v$VERSION"
    git tag -f "v$MAJOR_VERSION"
    echo "Tags v$VERSION, v$MAJOR_VERSION prepared. Don't forget to review tags and commits before pushing them."
    echo "You can push the tags with: git push --tags -f"
  fi
fi
