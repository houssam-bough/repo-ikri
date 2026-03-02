"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import type { User, Demand, Offer, SetAppView } from "../types"
import { UserRole } from "../types"
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllDemands,
  getAllOffers,
  getAllUsers,
  deleteUser,
  deleteDemand,
  deleteOffer,
} from "../services/apiService"
import { useLanguage } from "../hooks/useLanguage"
import { useAuth } from "../hooks/useAuth"
import { Button } from '@/components/ui/button'

interface AdminDashboardProps {
  setView: SetAppView
  focusTab?: 'pending' | 'all-users' | 'feed'
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setView, focusTab }) => {
  const { currentUser } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allDemands, setAllDemands] = useState<Demand[]>([])
  const [allOffers, setAllOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "all-users" | "feed">(focusTab || "pending")
  const { t } = useLanguage()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [users, allUsersData, allDemandsData, allOffersData] = await Promise.all([
        getPendingUsers(),
        getAllUsers(),
        getAllDemands(),
        getAllOffers(),
      ])
      setPendingUsers(users)
      setAllUsers(allUsersData)
      setAllDemands(allDemandsData)
      setAllOffers(allOffersData)
    } catch (error) {
      console.error("Failed to fetch pending data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUserApproval = async (userId: string, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await approveUser(userId)
      } else {
        await rejectUser(userId)
      }
      fetchData()
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    }
  }

  // VIP upgrade flow removed: all non-admin users already have full capabilities.

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(t('adminDash.confirmDeleteUser'))) {
      try {
        const success = await deleteUser(userId)
        if (success) {
          fetchData()
        } else {
          alert(t('adminDash.deleteFailedUser'))
        }
      } catch (error) {
        console.error('Failed to delete user:', error)
        alert(t('adminDash.deleteErrorUser'))
      }
    }
  }

  const handleDeleteDemand = async (demandId: string) => {
    if (window.confirm(t('adminDash.confirmDeleteDemand'))) {
      try {
        const success = await deleteDemand(demandId)
        if (success) {
          fetchData()
        } else {
          alert(t('adminDash.deleteFailedDemand'))
        }
      } catch (error) {
        console.error('Failed to delete demand:', error)
        alert(t('adminDash.deleteErrorDemand'))
      }
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (window.confirm(t('adminDash.confirmDeleteOffer'))) {
      try {
        const success = await deleteOffer(offerId)
        if (success) {
          fetchData()
        } else {
          alert(t('adminDash.deleteFailedOffer'))
        }
      } catch (error) {
        console.error('Failed to delete offer:', error)
        alert(t('adminDash.deleteErrorOffer'))
      }
    }
  }

  // ─── Render helpers for tab content ───

  const renderPendingContent = () => (
    <div className="space-y-8">
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("admin.userApprovalsTitle")}</h3>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-500">{t("admin.loading")}</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">{t("admin.noPendingUsers")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button
                    onClick={() => handleUserApproval(user._id, "approve")}
                    className="text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-colors shadow-sm flex-1 sm:flex-none"
                  >
                    {t("admin.approveButton")}
                  </Button>
                  <Button
                    onClick={() => handleUserApproval(user._id, "reject")}
                    className="text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-lg transition-colors shadow-sm flex-1 sm:flex-none"
                  >
                    {t("admin.rejectButton")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderAllUsersContent = () => (
    <div className="space-y-8">
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('adminDash.allUsersManagement')}</h3>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-500">{t("admin.loading")}</p>
          </div>
        ) : allUsers.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">{t('adminDash.noUsers')}</p>
        ) : (
          <div className="space-y-3">
            {allUsers.map((user) => (
              <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors gap-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                    user.role === UserRole.Admin ? 'bg-linear-to-br from-purple-400 to-violet-500' : 'bg-linear-to-br from-emerald-400 to-teal-500'
                  }`}>
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === UserRole.Admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        user.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.approvalStatus}
                      </span>
                    </div>
                    {user.phone && (
                      <p className="text-xs text-slate-400 mt-1">{user.phone}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {user.role !== UserRole.Admin && (
                    <Button
                      onClick={() => handleDeleteUser(user._id, user.name)}
                      className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                      title={t('adminDash.deleteUserTitle')}
                    >
                      {t('adminDash.deleteUser')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderFeedContent = () => (
    <div className="space-y-8">
      {/* Demands */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('adminDash.allDemands')}</h3>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-500">{t("admin.loading")}</p>
          </div>
        ) : allDemands.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">{t('adminDash.noDemands')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDemands.map((demand) => (
              <div key={demand._id} className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all hover:border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-bold text-slate-800 text-base md:text-lg leading-tight flex-1 mr-2">{demand.requiredService}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${
                    demand.status === 'open' || demand.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
                    demand.status === 'matched' ? 'bg-emerald-100 text-emerald-800' :
                    demand.status === 'negotiating' ? 'bg-blue-100 text-blue-800' :
                    demand.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                    demand.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {demand.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {demand.farmerName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <p className="text-sm text-slate-600 truncate">{t('adminDash.farmerLabel')} {demand.farmerName}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} – {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                </div>
                <Button
                  onClick={() => handleDeleteDemand(demand._id)}
                  className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-xl transition-colors shadow-sm text-sm"
                  title={t('adminDash.deleteDemandTitle')}
                >
                  {t('adminDash.deleteUser')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offers */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl border">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('adminDash.allOffers')}</h3>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-500">{t("admin.loading")}</p>
          </div>
        ) : allOffers.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">{t('adminDash.noOffers')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allOffers.map((offer) => (
              <div key={offer._id} className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all hover:border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-bold text-slate-800 text-base md:text-lg leading-tight flex-1 mr-2">{offer.equipmentType}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${
                    offer.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                    offer.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                    offer.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {offer.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-linear-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {offer.providerName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <p className="text-sm text-slate-600 truncate">{t('adminDash.providerLabel')} {offer.providerName}</p>
                </div>
                <p className="text-sm text-slate-500 mb-4">{t('adminDash.rateLabel')} {offer.priceRate} MAD/{t('adminDash.perDay') || 'jour'}</p>
                <Button
                  onClick={() => handleDeleteOffer(offer._id)}
                  className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-xl transition-colors shadow-sm text-sm"
                  title={t('adminDash.deleteOfferTitle')}
                >
                  {t('adminDash.deleteUser')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // When focusTab is set, render only the focused tab content (mobile dedicated page)
  if (focusTab) {
    const tabTitle = focusTab === 'pending' ? t('adminDash.pendingApprovals')
      : focusTab === 'all-users' ? t('adminDash.allUsers')
      : t('adminDash.allDemandsOffers')

    return (
      <div className="bg-white min-h-screen">
        {/* Compact header */}
        <div className="bg-linear-to-r from-purple-500 to-violet-600 px-5 pt-3 pb-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-bold">{tabTitle}</h1>
              <p className="text-purple-100 text-sm mt-0.5">
                {focusTab === 'pending' ? `${pendingUsers.length} ${t('common.pending')}` :
                 focusTab === 'all-users' ? `${allUsers.length} ${t('nav.users').toLowerCase()}` :
                 `${allDemands.length} + ${allOffers.length}`}
              </p>
            </div>
            <button
              onClick={() => setView('dashboard')}
              className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl text-sm"
            >
              {t('common.back')}
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          {focusTab === "pending" && renderPendingContent()}
          {focusTab === "all-users" && renderAllUsersContent()}
          {focusTab === "feed" && renderFeedContent()}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-linear-to-br from-purple-50 via-white to-violet-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-linear-to-r from-purple-500 to-violet-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <span className="text-[200px]">🛡️</span>
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2">
                {t('dash.hello')}, {currentUser?.name}
              </h1>
              <p className="text-purple-100 text-lg">
                {t('admin.title')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-amber-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">{t('adminDash.pendingApprovals')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{pendingUsers.length}</p>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">{t('adminDash.allUsers')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{allUsers.length}</p>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-emerald-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">{t('adminDash.allDemands')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{allDemands.length}</p>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">{t('adminDash.allOffers')}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{allOffers.length}</p>
              </div>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <button
            onClick={() => setView("machineTemplates")}
            className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-500 text-left"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-purple-500 group-hover:translate-x-2 transition-transform text-3xl">→</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                {t('adminDash.manageMachines')}
              </h2>
              <p className="text-gray-600">
                {t('adminDash.machineTemplatesTitle')}
              </p>
            </div>
            <div className="h-2 bg-linear-to-r from-purple-500 to-violet-600" />
          </button>

          <button
            onClick={() => setView("userSearch")}
            className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-500 text-left"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-blue-500 group-hover:translate-x-2 transition-transform text-3xl">→</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                {t('common.searchUsers')}
              </h2>
              <p className="text-gray-600">
                {t('adminDash.allUsersManagement')}
              </p>
            </div>
            <div className="h-2 bg-linear-to-r from-blue-500 to-indigo-600" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${activeTab === "pending" ? "bg-purple-500 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t('adminDash.pendingApprovals')} ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("all-users")}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${activeTab === "all-users" ? "bg-purple-500 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t('adminDash.allUsers')} ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${activeTab === "feed" ? "bg-purple-500 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t('adminDash.allDemandsOffers')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "pending" && renderPendingContent()}
        {activeTab === "all-users" && renderAllUsersContent()}
        {activeTab === "feed" && renderFeedContent()}
      </div>
    </div>
  )
}

export default AdminDashboard
