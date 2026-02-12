"use client"

import React from "react"
import { Home, User } from "lucide-react"
import { AppView, SetAppView } from "@/types"

interface MobileHeaderProps {
  currentView: AppView
  setView: SetAppView
}

/**
 * Mobile-only top header with Accueil and Profil buttons.
 * Rendered only when the Capacitor app is running (body has `mobile-app`).
 */
export default function MobileHeader({ currentView, setView }: MobileHeaderProps) {
  return (
    <header className="mobile-top-header mobile-header-height fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm flex items-center" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto max-w-7xl w-full px-4 py-3 flex items-center justify-between">
        {/* Accueil button - Left */}
        <button
          onClick={() => setView("dashboard")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentView === "dashboard"
              ? "bg-[#4C9A2A] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium text-sm font-body">Accueil</span>
        </button>

        {/* Profil button - Right */}
        <button
          onClick={() => setView("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentView === "profile"
              ? "bg-[#4C9A2A] text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="font-medium text-sm font-body">Profil</span>
        </button>
      </div>
    </header>
  )
}
