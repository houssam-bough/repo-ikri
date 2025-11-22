"use client"

import type React from "react"
import { useState } from "react"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import AdminDashboard from "@/components/AdminDashboard"
import VIPDashboard from "@/components/VIPDashboard"
import AuthScreen from "@/components/AuthScreen"
import Landing from "@/components/Landing"
import Header from "@/components/Header"
import Profile from "@/components/Profile"
import PostDemand from "@/components/PostDemand"
import PostOffer from "@/components/PostOffer"
import OffersFeed from "@/components/OffersFeed"
import DemandsFeed from "@/components/DemandsFeed"
import UserSearch from "@/components/UserSearch"
import MyReservations from "@/components/MyReservations"
import Messages from "@/components/Messages"
import AdminMachineTemplates from "@/components/AdminMachineTemplates"
import { UserRole, AppView } from "@/types"

type View =
  | "dashboard"
  | "profile"
  | "postDemand"
  | "postOffer"
  | "offersFeed"
  | "demandsFeed"
  | "auth:login"
  | "auth:register"

const AppContent: React.FC = () => {
  const { currentUser } = useAuth()
  const [view, setView] = useState<AppView>("dashboard")

  // Listen for header clicks (robust open from Header)
  useEffect(() => {
    const handler = (e: any) => {
      const tab = e?.detail?.tab
      if (tab === 'register') setView('auth:register')
      if (tab === 'login') setView('auth:login')
    }

    window.addEventListener('ikri:openAuth', handler as EventListener)
    return () => window.removeEventListener('ikri:openAuth', handler as EventListener)
  }, [])

  const renderContent = () => {
    if (!currentUser) {
      // If view indicates an auth screen with a specific tab, show AuthScreen with that tab.
      if (view === 'auth:register') return <AuthScreen initialTab="register" />
      if (view === 'auth:login') return <AuthScreen initialTab="login" />
      // Otherwise show the public landing page which can route to auth via setView
      return <Landing setView={setView} />
    }

    // Approval gating removed: all non-admin users proceed directly

    if (view === "profile") {
      return <Profile setView={setView} />
    }

    if (view === "postDemand") {
      return <PostDemand setView={setView} />
    }

    if (view === "postOffer") {
      return <PostOffer setView={setView} />
    }

    if (view === "offersFeed") {
      return <OffersFeed setView={setView} />
    }

    if (view === "demandsFeed") {
      return <DemandsFeed setView={setView} />
    }

    if (view === "userSearch") {
      return <UserSearch currentUser={currentUser} onBack={() => setView("dashboard")} />
    }

    if (view === "myReservations") {
      return <MyReservations setView={setView} />
    }

    if (view === "messages") {
      return <Messages setView={setView} />
    }

    if (view === "machineTemplates") {
      if (currentUser.role !== UserRole.Admin) {
        return <div>Access denied</div>
      }
      return <AdminMachineTemplates setView={setView} />
    }

    // Unified role routing: Admin vs User
    if (currentUser.role === UserRole.Admin) {
      return <AdminDashboard setView={setView} />
    }
    // All non-admin users get the unified dashboard
    return <VIPDashboard setView={setView} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-amber-50/30 font-sans text-slate-800">
      <Header setView={setView} />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">{renderContent()}</main>
    </div>
  )
}

const Page: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  )
}

export default Page
