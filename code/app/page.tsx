"use client"

import type React from "react"
import { useState } from "react"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import AdminDashboard from "@/components/AdminDashboard"
import FarmerDashboard from "@/components/FarmerDashboard"
import ProviderDashboard from "@/components/ProviderDashboard"
import AuthScreen from "@/components/AuthScreen"
import Header from "@/components/Header"
import PendingApproval from "@/components/PendingApproval"
import Profile from "@/components/Profile"
import PostDemand from "@/components/PostDemand"
import PostOffer from "@/components/PostOffer"
import OffersFeed from "@/components/OffersFeed"
import DemandsFeed from "@/components/DemandsFeed"
import { UserRole } from "@/types"

type View = "dashboard" | "profile" | "postDemand" | "postOffer" | "offersFeed" | "demandsFeed"

const AppContent: React.FC = () => {
  const { currentUser } = useAuth()
  const [view, setView] = useState<View>("dashboard")

  const renderContent = () => {
    if (!currentUser) {
      return <AuthScreen />
    }

    if (currentUser.approvalStatus !== "approved") {
      if (currentUser.role !== UserRole.Admin) {
        return <PendingApproval />
      }
    }

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

    switch (currentUser.role) {
      case UserRole.Admin:
        return <AdminDashboard />
      case UserRole.Farmer:
        return <FarmerDashboard setView={setView} />
      case UserRole.Provider:
        return <ProviderDashboard setView={setView} />
      default:
        return <AuthScreen />
    }
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
