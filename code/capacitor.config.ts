import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ikri.ma',
  appName: 'IKRI',
  // For production with static export, set to 'out'
  // For server URL (SSR), webDir can stay 'build' and use server.url
  webDir: 'out',
  server: {
    // During development, point to your LAN URL where Next.js runs
    // Example: http://192.168.1.50:3000
    url: process.env.CAP_SERVER_URL || '',
    cleartext: true,
    androidScheme: 'http'
  }
}

export default config
