"use client"

import React from "react"
import { Home, FileText, Calendar, Plus, List, Map, MessageSquare, User } from "lucide-react"
import { AppView, SetAppView, UserRole } from "@/types"
import { useAuth } from "@/hooks/useAuth"

interface MobileNavProps {
  currentView: AppView
  setView: SetAppView
}

/**
 * Mobile-only bottom navigation bar.
 * Rendered only when the Capacitor app is running (body has `mobile-app`).
 */
export default function MobileNav({ currentView, setView }: MobileNavProps) {
  const { currentUser } = useAuth()
  
  // Determine if user is in Provider or Farmer mode
  const isProvider = currentUser?.role === UserRole.Provider || currentUser?.activeMode === 'Provider'
  
  // Mode-specific navigation items
  const navItems = isProvider ? [
    { view: "myOffers" as AppView, icon: Map, label: "Mes Machines" },
    { view: "myProposals" as AppView, icon: FileText, label: "Propositions" },
    { view: "postOffer" as AppView, icon: Plus, label: "Publier" },
    { view: "demandsFeed" as AppView, icon: List, label: "Demandes" },
    { view: "messages" as AppView, icon: MessageSquare, label: "Messages" },
  ] : [
    { view: "myDemands" as AppView, icon: List, label: "Mes Demandes" },
    { view: "myReservations" as AppView, icon: Calendar, label: "Réservations" },
    { view: "postDemand" as AppView, icon: Plus, label: "Publier" },
    { view: "offersFeed" as AppView, icon: Map, label: "Machines" },
    { view: "messages" as AppView, icon: MessageSquare, label: "Messages" },
  ]

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(48px + env(safe-area-inset-bottom, 0px))'
      }}
    >
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
