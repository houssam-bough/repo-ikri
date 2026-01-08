"use client"

import type React from "react"
import { useEffect } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import "./globals.css"
import 'leaflet/dist/leaflet.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Detect Capacitor native container and toggle a body class so we can render
  // mobile-specific chrome (bottom nav, hide sidebar, etc.) without touching web.
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      // Safe-guard: Capacitor is only defined in the native shell.
      const maybeCapacitor = (window as any).Capacitor
      const isNative = !!(
        maybeCapacitor?.isNativePlatform?.() ||
        (maybeCapacitor?.getPlatform && maybeCapacitor.getPlatform() !== "web")
      )
      document.body.classList.toggle("mobile-app", isNative)
    } catch {
      document.body.classList.remove("mobile-app")
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
            {children}
            <Toaster />
          </LanguageProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
