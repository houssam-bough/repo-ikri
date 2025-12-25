"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { AppView, SetAppView } from "@/types"

interface NavigationContextType {
  currentView: AppView
  setView: SetAppView
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<AppView>("dashboard")

  // Broadcast view changes via custom event for cross-component communication
  useEffect(() => {
    const handler = (e: CustomEvent<{ view: AppView }>) => {
      if (e.detail?.view) {
        setCurrentView(e.detail.view)
      }
    }
    window.addEventListener("ikri:viewChange" as any, handler as EventListener)
    return () => window.removeEventListener("ikri:viewChange" as any, handler as EventListener)
  }, [])

  const setView: SetAppView = (view: AppView) => {
    setCurrentView(view)
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent("ikri:viewChange", { detail: { view } }))
  }

  return (
    <NavigationContext.Provider value={{ currentView, setView }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider")
  }
  return context
}
