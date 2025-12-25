"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { NavigationProvider, useNavigation } from "@/contexts/NavigationContext"
import MobileNav from "@/components/MobileNav"
import "./globals.css"
import 'leaflet/dist/leaflet.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// Wrapper component to access navigation context
function MobileNavWrapper() {
  const { currentView, setView } = useNavigation()
  return <MobileNav currentView={currentView} setView={setView} />
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isMobileApp, setIsMobileApp] = useState(false)

  useEffect(() => {
    try {
      const isNative = Capacitor && typeof Capacitor.isNativePlatform === "function"
        ? Capacitor.isNativePlatform()
        : (Capacitor?.getPlatform?.() !== "web")
      setIsMobileApp(!!isNative)
      if (isNative) {
        document.body.classList.add("mobile-app")
      } else {
        document.body.classList.remove("mobile-app")
      }
    } catch {
      setIsMobileApp(false)
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body className={`font-sans antialiased bg-gray-100`}>
        <AuthProvider>
          <LanguageProvider>
            <NavigationProvider>
              {children}
              <Toaster />
              {isMobileApp && <MobileNavWrapper />}
            </NavigationProvider>
          </LanguageProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
