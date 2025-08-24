# Auto-Sync Feature Guide

## Overview

The auto-sync feature allows you to automatically synchronize your todo data across multiple devices. When enabled, changes made on one device are automatically backed up and can be synced to other devices.

## How to Use

### 1. Enable Auto-Sync
1. Go to **Settings** page
2. Find the **Auto-Sync** section
3. Toggle the switch to **ON**
4. The system will automatically start syncing your data

### 2. Automatic Sync
- When auto-sync is enabled, your todos are automatically backed up after any changes
- The sync happens 2 seconds after you make changes (debounced to avoid excessive API calls)
- You'll see sync status indicators in the main page header

### 3. Cross-Device Sync
- When you open the app on another device, you'll see a "Sync Now" button if there's new data
- Click "Sync Now" to download and merge the latest changes
- Your data will be automatically merged with any local changes

### 4. Sync Status Indicators
- **Syncing...** - Data is being uploaded/downloaded
- **Sync Error** - There was an error during sync
- **Sync Now** - New data is available to download

## Technical Details

### How It Works
1. **Device Identification**: Each device gets a unique ID stored in localStorage
2. **Automatic Backup**: Changes are automatically uploaded to the cloud as backup files
3. **Change Detection**: The system detects when data has actually changed before syncing
4. **Conflict Resolution**: Uses timestamp-based conflict resolution (latest wins)
5. **Debounced Sync**: Waits 2 seconds after changes before syncing to avoid excessive API calls

### Data Flow
```
Device A: Make changes → Auto-backup → Cloud storage
Device B: Check for updates → Download changes → Merge with local data
```

### Security
- All sync operations require user authentication
- Data is isolated per user
- Device IDs are generated locally and stored securely
- Uses existing UploadThing infrastructure for file storage

## Troubleshooting

### Sync Not Working
1. Check if auto-sync is enabled in Settings
2. Ensure you're logged in
3. Check your internet connection
4. Look for sync error indicators

### Data Conflicts
- The system uses "latest wins" conflict resolution
- If you have conflicting changes, the most recent change will be used
- You can manually restore from backup files if needed

### Performance
- Sync is debounced to avoid excessive API calls
- Only changed data is synced
- Large datasets are handled efficiently through the backup system

## Future Enhancements
- Real-time sync notifications
- Manual conflict resolution UI
- Sync history and rollback options
- Offline sync queue
- Selective sync (sync specific todos only)
