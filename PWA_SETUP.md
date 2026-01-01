# PWA Setup Documentation

## Overview

PWA (Progressive Web App) support has been added to SOS SEATS. This enables the application to be installed on users' devices and work offline.

## What Has Been Configured

### 1. Package Installation
- ✅ Installed `@vite-pwa/sveltekit` package (SvelteKit-specific PWA plugin)

### 2. Vite Configuration (`vite.config.js`)
- ✅ Added `SvelteKitPWA` plugin configuration
- ✅ Configured manifest with:
  - App name: "SOS SEATS - Event Ticketing Platform"
  - Short name: "SOS SEATS"
  - Theme color: #18122B (matches dark theme)
  - Background color: #0A0A0A
  - Display mode: standalone
  - Orientation: portrait
  - Icons: Using existing favicon.png (192x192 and 512x512)
- ✅ Configured service worker with:
  - Caching strategy: GenerateSW
  - Caches Supabase API requests (NetworkFirst strategy)
  - Caches images (CacheFirst strategy)
  - Development mode enabled

### 3. HTML Meta Tags (`src/app.html`)
- ✅ Added theme-color meta tag
- ✅ Added Apple iOS PWA meta tags (apple-mobile-web-app-capable, etc.)
- ✅ Added Microsoft Windows PWA meta tags
- ✅ Enhanced viewport meta tag for mobile optimization

## Features Enabled

1. **Installable**: Users can install the app on their home screen
2. **Offline Support**: Basic offline functionality via service worker
3. **Caching**: Smart caching of API calls and images
4. **App-like Experience**: Standalone display mode removes browser UI

## Next Steps (Optional Improvements)

### Icon Optimization
Currently using `favicon.png` for all icon sizes. For better PWA experience, consider creating:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels for iOS)

These should be placed in the `static/` directory and the manifest should be updated accordingly.

### Testing

To test PWA functionality:

1. **Build the project:**
   ```bash
   npm run build
   npm run preview
   ```

2. **In Chrome/Edge:**
   - Open DevTools → Application tab
   - Check "Service Workers" section
   - Check "Manifest" section
   - Use "Add to Home Screen" button

3. **On Mobile:**
   - Visit the site in a mobile browser
   - Use browser's "Add to Home Screen" option
   - The app should appear as a standalone app

### Notes

- Service worker is enabled in development mode (`devOptions.enabled: true`)
- Production builds will automatically generate and register the service worker
- The PWA requires HTTPS (or localhost) to work properly
- Supabase API calls are cached with NetworkFirst strategy (checks network first, falls back to cache)
- Images are cached with CacheFirst strategy (serves from cache if available)

## Configuration Files Modified

1. `vite.config.js` - Added PWA plugin configuration
2. `src/app.html` - Added PWA meta tags
3. `package.json` - Added @vite-pwa/sveltekit dependency

## Browser Support

PWA features are supported in:
- Chrome/Edge (Android, Windows, macOS, Linux)
- Safari (iOS 11.3+, macOS)
- Firefox (Android, Windows, macOS, Linux)
- Samsung Internet (Android)

## Resources

- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

