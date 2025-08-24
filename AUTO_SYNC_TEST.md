# Auto-Sync Test Guide

## How to Test the Auto-Sync Feature

### Prerequisites
1. Make sure you're logged in to the app
2. The development server is running (`npm run dev`)
3. You have access to multiple devices/browsers

### Test Steps

#### 1. Enable Auto-Sync
1. Go to **Settings** page
2. Find the **Auto-Sync** section
3. Toggle the switch to **ON**
4. You should see "Last sync: Never" initially

#### 2. Create Some Todos
1. Go back to the main page
2. Add a few todo items
3. Mark some as complete
4. You should see a "Sync Now" button in the header when auto-sync is enabled

#### 3. Test Manual Sync
1. Click the **Sync Now** button
2. You should see "Syncing..." briefly
3. The button should disappear after successful sync
4. Check the Settings page - "Last sync" should show the current time

#### 4. Test Cross-Device Sync
1. Open the app in a different browser or incognito window
2. Log in with the same account
3. Enable auto-sync in the new session
4. You should see a "Sync Now" button if there's data from the other device
5. Click "Sync Now" to download the data

#### 5. Test Automatic Sync
1. Make changes to todos in one device
2. Wait 2 seconds (the debounce period)
3. The changes should automatically sync
4. Check the other device - you should see the "Sync Now" button

### Expected Behavior

✅ **Auto-Sync Toggle** - Should work without errors  
✅ **Manual Sync** - Should upload data and show success  
✅ **Cross-Device** - Should detect and download new data  
✅ **Automatic Sync** - Should trigger after 2 seconds of changes  
✅ **Error Handling** - Should show error states if sync fails  
✅ **Status Indicators** - Should show syncing/error states  

### Troubleshooting

#### If sync doesn't work:
1. Check browser console for errors
2. Verify you're logged in
3. Check network connectivity
4. Look for error indicators in the UI

#### If you see foreign key errors:
- This means the user doesn't exist in the database
- Try logging out and back in
- Check if the user was created properly

#### If sync is too frequent:
- The system has a 2-second debounce
- Only changed data is synced
- Check the browser console for sync logs

### Database Verification

You can check if sync is working by:
1. Opening Prisma Studio: `npx prisma studio`
2. Looking at the `BackupFile` table
3. You should see entries with `category: "auto-sync"`
4. Each sync creates a new backup file

### Performance Notes

- Sync is debounced to avoid excessive API calls
- Only changed data is uploaded
- Large datasets are handled efficiently
- Error states are handled gracefully
