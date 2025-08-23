# PWA Setup for Laputa

This project has been configured as a Progressive Web App (PWA) using `@ducanh2912/next-pwa`.

## Features

- **Service Worker**: Automatically generated for caching and offline functionality
- **Web App Manifest**: Configured with app metadata and icons
- **Install Prompt**: Custom installation prompt component
- **Offline Support**: Basic offline functionality through service worker caching

## Files Added/Modified

### New Files
- `public/manifest.json` - Web app manifest
- `public/icons/` - PWA icons (SVG format)
- `src/components/PWAInstallPrompt.tsx` - Installation prompt component
- `src/types/next-pwa.d.ts` - TypeScript definitions
- `scripts/generate-pwa-icons.js` - Icon generation script

### Modified Files
- `next.config.js` - Added PWA configuration
- `src/app/layout.tsx` - Added PWA meta tags and install prompt
- `package.json` - Added PWA dependencies and scripts

## Configuration

### PWA Settings (next.config.js)
```javascript
pwa: {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
}
```

### Manifest Settings
- **Name**: Laputa
- **Display**: Standalone (full-screen app experience)
- **Theme Color**: #000000
- **Background Color**: #ffffff
- **Icons**: Multiple sizes from 72x72 to 512x512

## Usage

### Development
PWA features are disabled in development mode to avoid caching issues.

### Production
1. Build the project: `npm run build`
2. The service worker will be automatically generated in `public/sw.js`
3. Users can install the app through the browser's install prompt or the custom install prompt

### Icon Generation
To regenerate PWA icons:
```bash
npm run generate-pwa-icons
```

## Testing PWA Features

1. **Installation**: Look for the install prompt in supported browsers
2. **Offline Mode**: Disconnect from the internet and refresh the page
3. **App-like Experience**: Install the app and launch it from the home screen

## Browser Support

PWA features work best in:
- Chrome/Chromium-based browsers
- Safari (iOS 11.3+)
- Firefox (Android)
- Edge

## Customization

### Icons
Replace the generated SVG icons in `public/icons/` with your own designs. For production, consider using PNG format for better compatibility.

### Manifest
Modify `public/manifest.json` to customize:
- App name and description
- Colors and theme
- Display mode
- Icon paths

### Service Worker
The service worker is automatically generated. For advanced customization, you can create a custom service worker file.

## Troubleshooting

### Build Issues
If you encounter build errors:
1. Clear the `.next` directory: `rm -rf .next`
2. Clear node modules: `rm -rf node_modules && npm install`
3. Rebuild: `npm run build`

### PWA Not Working
1. Ensure you're testing in production mode
2. Check browser console for service worker errors
3. Verify manifest.json is accessible at `/manifest.json`
4. Check that icons are properly linked in the manifest

## Next Steps

For enhanced PWA functionality, consider:
- Adding offline-first data strategies
- Implementing background sync
- Adding push notifications
- Creating custom service worker strategies
