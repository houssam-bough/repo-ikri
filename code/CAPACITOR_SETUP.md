# Capacitor Mobile App Setup

Your mobile app is now set up using Capacitor! Here's how to build and run it.

## Quick Start

### 1. Start the Web Dev Server (Terminal 1)
```bash
npm run dev
```
This runs the Next.js app on `http://localhost:3000`

### 2. (Optional) Physical device? Set your LAN IP
The emulator works out-of-the-box (uses `http://10.0.2.2:3000`).
Only if you test on a real device:
```bash
ipconfig
```
Take the IPv4 address and temporarily change `url` in `capacitor.config.js` to `http://YOUR_IP:3000`.

### 3. Sync & Open Android Studio
```bash
npm run mobile:sync
npm run mobile:open:android
```

### 4. Run on Android Emulator
In Android Studio:
1. Select a virtual device from the top toolbar
2. Click the **Run** button (green play icon)
3. Wait for the app to build and launch

## Project Structure
- **Web App**: Next.js at root (`npm run dev` to run)
- **Android App**: `android/` folder (Capacitor wrapper)
- **Capacitor Config**: `capacitor.config.js`

## Key Commands
- `npm run dev` - Start web dev server
- `npm run build` - Build Next.js for production
- `npm run mobile:sync` - Sync web assets with Android
- `npm run mobile:open:android` - Open Android Studio
- `npm run mobile:run:android` - Run on emulator

## Important Notes
- The mobile app loads your local web dev server via WebView
- Emulator uses `http://10.0.2.2:3000` automatically; change `url` only for a physical device on WiFi
- Both web and mobile versions work simultaneously during development
- Your web app code is completely separate and unchanged
