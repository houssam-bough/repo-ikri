"use client"

import React from "react"
import { Home, Map, List, MessageSquare, User } from "lucide-react"
import { AppView, SetAppView } from "@/types"

interface MobileNavProps {
  currentView: AppView
  setView: SetAppView
}

/**
 * Mobile-only bottom navigation bar.
 * Rendered only when the Capacitor app is running (body has `mobile-app`).
 */
export default function MobileNav({ currentView, setView }: MobileNavProps) {
  const navItems = [
    { view: "dashboard" as AppView, icon: Home, label: "Accueil" },
    { view: "demandsFeed" as AppView, icon: List, label: "Demandes" },
    { view: "offersFeed" as AppView, icon: Map, label: "Machines" },
    { view: "messages" as AppView, icon: MessageSquare, label: "Messages" },
    { view: "profile" as AppView, icon: User, label: "Profil" },
  ]

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg safe-area-bottom">
      <div className="mx-auto max-w-7xl">
        <ul className="grid grid-cols-5">
          {navItems.map(({ view, icon: Icon, label }) => {
            const isActive = currentView === view
            return (
              <li key={view} className="relative">
                <button
                  onClick={() => setView(view)}
                  className={`flex flex-col items-center justify-center py-2.5 w-full transition-colors ${
                    isActive
                      ? "text-emerald-700 font-semibold"
                      : "text-slate-600 hover:text-emerald-600"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-700 rounded-t-full" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
