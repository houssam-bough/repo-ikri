# Mobile App Fixes - Contract Downloads, Audio Recording & File Downloads

## Summary
Fixed three major issues in the mobile app where features that worked on web didn't work on mobile:
1. Contract PDF downloads
2. Audio message recording (microphone permissions)
3. File/image downloads from conversations

## Changes Made

### 1. Installed Capacitor Plugins
```bash
npm install @capacitor/filesystem @capacitor/share
npx cap sync
```

**Plugins Added:**
- `@capacitor/filesystem` - For native file system access and downloads on mobile
- `@capacitor/share` - For native file sharing capabilities

### 2. Created Mobile Utility Helper (`lib/mobileUtils.ts`)
A new utility file with mobile-aware functions:

**Key Functions:**
- `isMobileApp()` - Detects if running in Capacitor mobile environment
- `downloadFile(url, filename, blob?)` - Smart download that uses:
  - Native Filesystem API on mobile (saves to Documents directory)
  - Standard browser download on web
- `requestMicrophonePermission()` - Handles microphone permission requests for audio recording
- `shareFile(url, filename, title?)` - Native share dialog on mobile, download on web
- `blobToBase64(blob)` - Helper to convert blobs to base64 for Capacitor

**How it works:**
- Automatically detects mobile vs web environment
- On mobile: Converts files to base64 and saves using Capacitor Filesystem
- On web: Uses standard browser download links
- All components now use these utilities transparently

### 3. Updated Contract Download Components

**Files Modified:**
- `components/MyReservations.tsx` - Farmer/Provider reservations
- `components/MyProposals.tsx` - Provider proposals
- `components/MyDemands.tsx` - Farmer demands
- `components/MyOffers.tsx` - Provider offers

**Changes:**
```typescript
// Before (web-only):
const link = document.createElement('a')
link.href = url
link.download = filename
link.click()

// After (mobile-compatible):
const { downloadFile } = await import('@/lib/mobileUtils')
await downloadFile(url, filename, blob)
```

### 4. Fixed Audio Recording (`components/VoiceRecorder.tsx`)

**Added:**
- Explicit microphone permission request before recording
- Mobile-aware permission handling via `requestMicrophonePermission()`

**Changes:**
```typescript
// Added at start of startRecording():
const { requestMicrophonePermission } = await import('@/lib/mobileUtils')
const hasPermission = await requestMicrophonePermission()

if (!hasPermission) {
  alert(t('common.microphoneAccessError'))
  return
}
```

### 5. Fixed File/Image Downloads in Messages (`components/FileAttachment.tsx`)

**Updated FilePreview Component:**
- Changed from `<a>` tag download link to button with click handler
- Button calls `downloadFile()` utility for mobile compatibility

**Changes:**
```typescript
// Before (web-only):
<a href={fileUrl} download={fileName}>
  <Download /> Télécharger
</a>

// After (mobile-compatible):
<button onClick={handleDownload}>
  <Download /> Télécharger
</button>
```

### 6. Android Permissions (`android/app/src/main/AndroidManifest.xml`)

**Added Permissions:**
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

**Why these permissions:**
- `RECORD_AUDIO` - For voice message recording
- `WRITE_EXTERNAL_STORAGE` - For file downloads (Android ≤ 28)
- `READ_EXTERNAL_STORAGE` - For file access (Android ≤ 32)
- `READ_MEDIA_*` - For media access (Android 33+, scoped storage)

## Testing Instructions

### 1. Build and Deploy Mobile App
```bash
npm run build
npx cap sync
npx cap open android
```

### 2. Test Contract Downloads
- Navigate to "Mes Réservations" or "Mes Propositions"
- Click "Télécharger le contrat" on an approved reservation
- **Expected:** PDF saves to device Documents folder, alert shows file path

### 3. Test Audio Recording
- Open Messages/Messagerie
- Click microphone icon
- **Expected:** Permission dialog appears (first time), recording works after grant
- Record and send audio message
- **Expected:** Audio message appears in chat

### 4. Test File Downloads in Messages
- Open a conversation with file attachments
- Click "Télécharger" button on an image or PDF
- **Expected:** File saves to device Documents folder

## Mobile vs Web Behavior

| Feature | Web Behavior | Mobile Behavior |
|---------|--------------|-----------------|
| Contract Download | Browser download prompt | Saves to Documents folder with alert |
| Audio Permission | Browser prompts automatically | Explicit permission request before recording |
| File Download | Browser download | Capacitor Filesystem saves to Documents |

## File Locations on Mobile

Files downloaded through the app are saved to:
- **Android:** `/storage/emulated/0/Documents/` (or equivalent based on device)
- Files can be accessed through the device's file manager

## Notes

- All changes are backward compatible - web version continues to work as before
- No changes to API endpoints or backend
- Downloads use dynamic imports (`await import()`) to avoid bundling issues
- TypeScript types properly declared for `window.Capacitor`

## Troubleshooting

If downloads still don't work on mobile:
1. Check Android permissions are granted in device settings
2. Verify Capacitor plugins installed: Check `package.json` for `@capacitor/filesystem` and `@capacitor/share`
3. Run `npx cap sync` to ensure Android project is up to date
4. Check console logs in Android Studio / Chrome DevTools for error messages
5. Test in Android emulator with API level 30+ for best compatibility

## Next Steps (Optional Enhancements)

- [ ] Add loading spinner during file downloads
- [ ] Show download progress for large files
- [ ] Add option to share files instead of just downloading
- [ ] Implement file preview before download
- [ ] Add download history/manager
