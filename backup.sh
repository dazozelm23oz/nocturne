#!/bin/bash

PROJECT_DIR="$HOME/.gemini/antigravity/scratch/lirics"
# Your internal NTFS HDD
EXT_DRIVE="/run/media/ziadm/821ACDEF1ACDE071"
BACKUP_ROOT="$EXT_DRIVE/Nocturne_Backups"

cd "$PROJECT_DIR" || exit 1

echo "🔄 Starting automated backup..."

# 1. Local Git Commit
git add .
git commit -m "Auto-backup: $(date +'%Y-%m-%d %H:%M:%S')" > /dev/null 2>&1
echo "✅ Git commit saved locally."

# 2. External HDD Rsync (Timestamped Folder)
if [ -d "$EXT_DRIVE" ]; then
    TIMESTAMP=$(date +'%Y-%m-%d_%H-%M-%S')
    DEST="$BACKUP_ROOT/$TIMESTAMP"
    
    mkdir -p "$DEST"
    echo "📦 Creating snapshot: $TIMESTAMP"
    
    # Use -rlt for NTFS compatibility
    rsync -rlt \
      --exclude 'node_modules' \
      --exclude '.next' \
      --exclude 'target' \
      --exclude '.git' \
      --exclude '.cache' \
      --exclude '.chrome-kiosk' \
      "$PROJECT_DIR/" "$DEST/"
    
    echo "✅ Snapshot saved to: $DEST"
    
    # 3. Cleanup: Delete backups older than 7 days
    echo "🧹 Cleaning up backups older than 7 days..."
    find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf {} +
    
else
    echo "⚠️ HDD not mounted. Skipped external backup."
fi

echo "🎉 Backup finished!"
