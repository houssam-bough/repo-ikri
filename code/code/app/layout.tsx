"use client"

import type React from "react"
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
