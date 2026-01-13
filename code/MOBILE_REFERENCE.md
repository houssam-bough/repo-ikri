# Quick Reference: Mobile Download & Permission Functions

## Import and Use

```typescript
// Import the utilities
import { downloadFile, requestMicrophonePermission, isMobileApp } from '@/lib/mobileUtils'

// Check if mobile
if (isMobileApp()) {
  console.log('Running on mobile')
}

// Download a file (works on both web and mobile)
await downloadFile(fileUrl, 'my-file.pdf')

// Download with blob data
const response = await fetch('/api/file')
const blob = await response.blob()
await downloadFile(blobUrl, 'file.pdf', blob)

// Request microphone permission
const hasPermission = await requestMicrophonePermission()
if (hasPermission) {
  // Start recording
}
```

## File Download Flow

### Web (Browser)
1. Create `<a>` tag with download attribute
2. Click programmatically
3. Browser handles download

### Mobile (Capacitor)
1. Convert file to base64
2. Use `Filesystem.writeFile()` with Directory.Documents
3. Show alert with file path
4. File accessible in device file manager

## Permissions

### Required Android Permissions (Already Added)
- ✅ RECORD_AUDIO - Voice messages
- ✅ WRITE_EXTERNAL_STORAGE - Downloads (Android ≤ 28)
- ✅ READ_EXTERNAL_STORAGE - File access (Android ≤ 32)
- ✅ READ_MEDIA_IMAGES/VIDEO/AUDIO - Media access (Android 33+)

### Permission Prompts
- **Audio Recording:** Automatic on first use
- **File Downloads:** Handled by Capacitor Filesystem (no prompt needed for Documents directory)

## Common Patterns

### Pattern 1: API Contract Download
```typescript
const handleDownloadContract = async (id: string) => {
  try {
    const response = await fetch(`/api/contracts/${id}`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const { downloadFile } = await import('@/lib/mobileUtils')
    await downloadFile(url, `contract-${id}.pdf`, blob)
    
    window.URL.revokeObjectURL(url)
  } catch (error) {
    alert('Download failed')
  }
}
```

### Pattern 2: Direct URL Download
```typescript
const handleDownload = async () => {
  const { downloadFile } = await import('@/lib/mobileUtils')
  await downloadFile('/api/file/123', 'document.pdf')
}
```

### Pattern 3: Voice Recording with Permission
```typescript
const startRecording = async () => {
  const { requestMicrophonePermission } = await import('@/lib/mobileUtils')
  
  if (!await requestMicrophonePermission()) {
    alert('Microphone permission required')
    return
  }
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  // ... recording logic
}
```

## Updated Components

All these components now support mobile downloads:
- ✅ MyReservations - Contract downloads
- ✅ MyProposals - Contract downloads
- ✅ MyDemands - Contract downloads
- ✅ MyOffers - Reservation contract downloads
- ✅ VoiceRecorder - Audio recording with permissions
- ✅ FilePreview - File/image downloads in messages

## Build & Test

```bash
# Install dependencies and sync
npm install
npx cap sync

# Build for production
npm run build

# Open in Android Studio
npx cap open android

# Run on device/emulator from Android Studio
```

## Debugging Tips

### Check if mobile detection works
```typescript
console.log('Is mobile?', isMobileApp())
console.log('Has Capacitor?', !!window.Capacitor)
```

### Check download errors
```typescript
try {
  await downloadFile(url, filename)
} catch (error) {
  console.error('Download error:', error)
}
```

### Check file system permissions
```javascript
// In browser console or Android logcat
import { Filesystem, Directory } from '@capacitor/filesystem'

// Test write permission
await Filesystem.writeFile({
  path: 'test.txt',
  data: btoa('Hello World'),
  directory: Directory.Documents
})
```

## File Locations

### Android
- **Documents:** `/storage/emulated/0/Documents/`
- Accessible via: Device Settings → Storage → Files → Documents

### Alternative: Use Share Instead
If you want users to choose where to save:
```typescript
import { shareFile } from '@/lib/mobileUtils'
await shareFile(fileUrl, filename, 'Share Contract')
// Opens native share dialog
```
