"use client"

import type React from "react"
import { useState } from "react"
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/hooks/useLanguage"
import AdminDashboard from "@/components/AdminDashboard"
import FarmerDashboard from "@/components/FarmerDashboard"
import ProviderDashboard from "@/components/ProviderDashboard"
import AuthScreen from "@/components/AuthScreen"
import Landing from "@/components/Landing"
import Sidebar from "@/components/Sidebar"
import Profile from "@/components/Profile"
import PostDemand from "@/components/PostDemand"
import PostOffer from "@/components/PostOffer"
import OffersFeed from "@/components/OffersFeed"
import DemandsFeed from "@/components/DemandsFeed"
import MyDemands from "@/components/MyDemands"
import MyOffers from "@/components/MyOffers"
import UserSearch from "@/components/UserSearch"
import MyReservations from "@/components/MyReservations"
import Messages from "@/components/Messages"
import MyProposals from "@/components/MyProposals"
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
  const { currentUser, isLoading } = useAuth()
  const [view, setView] = useState<AppView>("dashboard")

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const viewParam = params.get('view') as AppView | null
    if (viewParam) {
      setView(viewParam)
    }
  }, [])

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

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 via-blue-50 to-amber-50/30 font-sans text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (!currentUser) {
      // Aller directement à la page d'authentification
      return <AuthScreen setView={setView} />
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

    if (view === "myDemands") {
      return <MyDemands setView={setView} />
    }

    if (view === "myOffers") {
      return <MyOffers setView={setView} />
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

    if (view === "myProposals") {
      return <MyProposals setView={setView} />
    }

    if (view === "machineTemplates") {
      if (currentUser.role !== UserRole.Admin) {
        return <div>Accès refusé</div>
      }
      return <AdminMachineTemplates setView={setView} />
    }

    // Unified role routing: Dashboard based on role
    if (currentUser.role === UserRole.Admin) {
      return <AdminDashboard setView={setView} />
    }
    
    // Farmer Dashboard
    if (currentUser.role === UserRole.Farmer) {
      return <FarmerDashboard setView={setView} />
    }
    
    // Provider Dashboard
    if (currentUser.role === UserRole.Provider) {
      return <ProviderDashboard setView={setView} />
    }
    
    // Both role - switch based on activeMode
    if (currentUser.role === UserRole.Both) {
      return currentUser.activeMode === 'Farmer' 
        ? <FarmerDashboard setView={setView} />
        : <ProviderDashboard setView={setView} />
    }
    
    // Fallback to Farmer dashboard
    return <FarmerDashboard setView={setView} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser && <Sidebar currentView={view} setView={setView} unreadMessages={0} />}
      <main className={currentUser ? "lg:ml-64 min-h-screen" : "min-h-screen"}>{renderContent()}</main>
    </div>
  )
}

export default AppContent
