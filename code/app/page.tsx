"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/hooks/useLanguage"
import AdminDashboard from "@/components/AdminDashboard"
// Mobile-only new components
import FarmerHome from "@/components/FarmerHome"
import ProviderHome from "@/components/ProviderHome"
import NewHeader from "@/components/NewHeader"
import BottomNav from "@/components/BottomNav"
// Web-only old components
import FarmerDashboard from "@/components/FarmerDashboard"
import ProviderDashboard from "@/components/ProviderDashboard"
import MobileHeader from "@/components/MobileHeader"
import MobileNav from "@/components/MobileNav"

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
import Image from "next/image"

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
  const [isMobileApp, setIsMobileApp] = useState(false)

  // Detect native shell (Capacitor)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const maybeCapacitor = (window as any).Capacitor
      const native = !!(
        maybeCapacitor?.isNativePlatform?.() ||
        (maybeCapacitor?.getPlatform && maybeCapacitor.getPlatform() !== "web")
      )
      setIsMobileApp(native || document.body.classList.contains("mobile-app"))
    } catch {
      setIsMobileApp(document.body.classList.contains("mobile-app"))
    }
  }, [])

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
      <div className="min-h-screen font-sans flex items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F9F2 25%, #EAF4E2 50%, #FFF7ED 75%, #FFFDF8 100%)' }}
      >
        {/* Subtle decorative circles */}
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #4C9A2A, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #FF8C1A, transparent 70%)' }} />

        <div className="text-center flex flex-col items-center relative z-10">
          {/* Logo */}
          <div className="w-48 h-48 mb-6">
            <Image 
              src="/Logo YKRI.png" 
              alt="YKRI" 
              width={192} 
              height={192} 
              className="w-full h-full object-contain" 
              priority 
            />
          </div>
          {/* Slogan */}
          <p className="text-[#4C9A2A] text-xl font-bold font-body tracking-wide mb-8">
            Le Bon Matériel, au Bon Moment
          </p>
          {/* Spinner */}
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#4C9A2A]/20 border-t-[#4C9A2A] mx-auto"></div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (!currentUser) {
      // Aller directement à la page d'authentification
      return <AuthScreen />
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
      return isMobileApp 
        ? <FarmerHome setView={setView} />
        : <FarmerDashboard setView={setView} />
    }
    
    // Provider Dashboard
    if (currentUser.role === UserRole.Provider) {
      return isMobileApp
        ? <ProviderHome setView={setView} />
        : <ProviderDashboard setView={setView} />
    }
    
    // Both role - switch based on activeMode
    if (currentUser.role === UserRole.Both) {
      if (isMobileApp) {
        return currentUser.activeMode === 'Farmer' 
          ? <FarmerHome setView={setView} />
          : <ProviderHome setView={setView} />
      }
      return currentUser.activeMode === 'Farmer' 
        ? <FarmerDashboard setView={setView} />
        : <ProviderDashboard setView={setView} />
    }
    
    // Fallback
    return isMobileApp 
      ? <FarmerHome setView={setView} />
      : <FarmerDashboard setView={setView} />
  }

  const isAdmin = currentUser?.role === UserRole.Admin

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin always gets Sidebar */}
      {currentUser && isAdmin && (
        <Sidebar currentView={view} setView={setView} unreadMessages={0} />
      )}

      {/* Non-admin: mobile app gets new header, web gets sidebar only */}
      {currentUser && !isAdmin && isMobileApp && (
        <NewHeader setView={setView} currentView={view} />
      )}
      {currentUser && !isAdmin && !isMobileApp && (
        <Sidebar currentView={view} setView={setView} unreadMessages={0} />
      )}

      <main
        className={
          currentUser && isAdmin
            ? "lg:ml-64 min-h-screen"
            : currentUser && !isAdmin && isMobileApp
            ? "min-h-screen"
            : currentUser && !isAdmin && !isMobileApp
            ? "lg:ml-64 min-h-screen"
            : "bg-gray-50"
        }
      >
        {currentUser && !isAdmin && isMobileApp ? (
          <div 
            className="pb-24"
            style={{
              paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))',
            }}
          >
            {renderContent()}
          </div>
        ) : (
          renderContent()
        )}
      </main>

      {/* Non-admin: mobile app gets bottom nav, web has no bottom nav */}
      {currentUser && !isAdmin && isMobileApp && (
        <BottomNav currentView={view} setView={setView} />
      )}
    </div>
  )
}

export default AppContent
