"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import type { User, Demand, Offer } from "../types"
import {
  getPendingUsers,
  approveUser,
  rejectUser,
  getPendingDemands,
  approveDemand,
  rejectDemand,
  getPendingOffers,
  approveOffer,
  rejectOffer,
  getAllDemands,
  getAllOffers,
} from "../services/apiService"
import { useLanguage } from "../hooks/useLanguage"

const AdminDashboard: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [pendingDemands, setPendingDemands] = useState<Demand[]>([])
  const [pendingOffers, setPendingOffers] = useState<Offer[]>([])
  const [allDemands, setAllDemands] = useState<Demand[]>([])
  const [allOffers, setAllOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "feed">("pending")
  const { t } = useLanguage()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [users, demands, offers, allDemandsData, allOffersData] = await Promise.all([
        getPendingUsers(),
        getPendingDemands(),
        getPendingOffers(),
        getAllDemands(),
        getAllOffers(),
      ])
      setPendingUsers(users)
      setPendingDemands(demands)
      setPendingOffers(offers)
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

  const handleDemandApproval = async (demandId: string, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await approveDemand(demandId)
      } else {
        await rejectDemand(demandId)
      }
      fetchData()
    } catch (error) {
      console.error(`Failed to ${action} demand:`, error)
    }
  }

  const handleOfferApproval = async (offerId: string, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await approveOffer(offerId)
      } else {
        await rejectOffer(offerId)
      }
      fetchData()
    } catch (error) {
      console.error(`Failed to ${action} offer:`, error)
    }
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-slate-800 border-b pb-2">{t("admin.title")}</h2>

      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "pending" ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
        >
          Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "feed" ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
        >
          All Demands & Offers Feed
        </button>
      </div>

      {activeTab === "pending" ? (
        <div className="space-y-8">
          {/* User Approvals */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("admin.userApprovalsTitle")}</h3>
            {loading ? (
              <p>{t("admin.loading")}</p>
            ) : pendingUsers.length === 0 ? (
              <p className="text-slate-500">{t("admin.noPendingUsers")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderName")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderEmail")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderRole")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderActions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleUserApproval(user._id, "approve")}
                            className="text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.approveButton")}
                          </button>
                          <button
                            onClick={() => handleUserApproval(user._id, "reject")}
                            className="text-white bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.rejectButton")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Demand Approvals */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("admin.demandApprovalsTitle")}</h3>
            {loading ? (
              <p>{t("admin.loading")}</p>
            ) : pendingDemands.length === 0 ? (
              <p className="text-slate-500">{t("admin.noPendingDemands")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderFarmer")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderService")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderDates")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderActions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingDemands.map((demand) => (
                      <tr key={demand._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {demand.farmerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{demand.requiredService}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} -{" "}
                          {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleDemandApproval(demand._id, "approve")}
                            className="text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.approveButton")}
                          </button>
                          <button
                            onClick={() => handleDemandApproval(demand._id, "reject")}
                            className="text-white bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.rejectButton")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Offer Approvals */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">{t("admin.offerApprovalsTitle")}</h3>
            {loading ? (
              <p>{t("admin.loading")}</p>
            ) : pendingOffers.length === 0 ? (
              <p className="text-slate-500">{t("admin.noPendingOffers")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderProvider")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderEquipment")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderRate")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t("admin.tableHeaderActions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingOffers.map((offer) => (
                      <tr key={offer._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {offer.providerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{offer.equipmentType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${offer.priceRate}/hr</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleOfferApproval(offer._id, "approve")}
                            className="text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.approveButton")}
                          </button>
                          <button
                            onClick={() => handleOfferApproval(offer._id, "reject")}
                            className="text-white bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.rejectButton")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Demands Feed */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">All Farmer Demands</h3>
            {loading ? (
              <p>{t("admin.loading")}</p>
            ) : allDemands.length === 0 ? (
              <p className="text-slate-500">No demands available</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allDemands.map((demand) => (
                  <div key={demand._id} className="p-4 border border-sky-200 rounded-lg bg-sky-50/50">
                    <p className="font-bold text-sky-800">{demand.requiredService}</p>
                    <p className="text-sm text-slate-600">Farmer: {demand.farmerName}</p>
                    <p className="text-sm text-slate-600">Status: {demand.status}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} -{" "}
                      {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offers Feed */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">All Provider Offers</h3>
            {loading ? (
              <p>{t("admin.loading")}</p>
            ) : allOffers.length === 0 ? (
              <p className="text-slate-500">No offers available</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allOffers.map((offer) => (
                  <div key={offer._id} className="p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                    <p className="font-bold text-amber-800">{offer.equipmentType}</p>
                    <p className="text-sm text-slate-600">Provider: {offer.providerName}</p>
                    <p className="text-sm text-slate-600">Rate: ${offer.priceRate}/hr</p>
                    <p className="text-sm text-slate-600">Status: {offer.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
