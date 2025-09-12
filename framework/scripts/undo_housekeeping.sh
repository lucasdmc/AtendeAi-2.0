#!/usr/bin/env bash
set -euo pipefail
ARCHIVE_DIR="${1:-archive}"
echo "Restoring files from $ARCHIVE_DIR ..."
rsync -av "$ARCHIVE_DIR"/ ./ || true
echo "Restore completed."
