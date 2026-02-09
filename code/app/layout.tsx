"use client"

import type React from "react"
import { useEffect } from "react"
import { Geist, Geist_Mono, Oswald, Nunito_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import "./globals.css"
import 'leaflet/dist/leaflet.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// Brand fonts (substitutes for Bernoru Expanded / Anantason Expanded)
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
})
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
})

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
      <body className={`font-sans antialiased bg-gray-100 ${oswald.variable} ${nunitoSans.variable}`}>
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
