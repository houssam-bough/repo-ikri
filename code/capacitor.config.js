const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000'

module.exports = {
  appId: 'com.ikri.app',
  appName: 'IKRI Platform',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // For sharing an APK: point to your deployed URL (default).
    // For emulator dev: set CAPACITOR_SERVER_URL=http://10.0.2.2:3000
    // For emulator dev: set CAPACITOR_SERVER_URL=https://repo-ikri.vercel.app
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://')
  },
  android: {
    allowMixedContent: true,
    // Enable media capture for audio recording
    captureInput: true
  },
  plugins: {
    StatusBar: {
      style: 'Light',
      backgroundColor: '#4C9A2A'
    }
  }
};
