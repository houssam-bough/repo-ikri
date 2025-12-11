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
import { Button } from '@/components/ui/button'

interface AdminDashboardProps {
  setView: SetAppView
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setView }) => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allDemands, setAllDemands] = useState<Demand[]>([])
  const [allOffers, setAllOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "all-users" | "feed">("pending")
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
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        const success = await deleteUser(userId)
        if (success) {
          fetchData()
        } else {
          alert('Failed to delete user')
        }
      } catch (error) {
        console.error('Failed to delete user:', error)
        alert('Error deleting user')
      }
    }
  }

  const handleDeleteDemand = async (demandId: string) => {
    if (window.confirm('Delete this demand? This action cannot be undone.')) {
      try {
        const success = await deleteDemand(demandId)
        if (success) {
          fetchData()
        } else {
          alert('Failed to delete demand')
        }
      } catch (error) {
        console.error('Failed to delete demand:', error)
        alert('Error deleting demand')
      }
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    if (window.confirm('Delete this offer? This action cannot be undone.')) {
      try {
        const success = await deleteOffer(offerId)
        if (success) {
          fetchData()
        } else {
          alert('Failed to delete offer')
        }
      } catch (error) {
        console.error('Failed to delete offer:', error)
        alert('Error deleting offer')
      }
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h2 className="text-3xl font-bold text-slate-800">{t("admin.title")}</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => setView("machineTemplates")}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
          >
            ⚙️ Manage Machines
          </Button>
          <Button
            onClick={() => setView("userSearch")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            🔍 Search Users
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "pending" ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
        >
          Pending Approvals
        </Button>
        <Button
          onClick={() => setActiveTab("all-users")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "all-users" ? "bg-blue-500 text-white shadow-lg" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
        >
          All Users
        </Button>
        <Button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "feed" ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
        >
          All Demands & Offers Feed
        </Button>
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
                          <Button
                            onClick={() => handleUserApproval(user._id, "approve")}
                            className="text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.approveButton")}
                          </Button>
                          <Button
                            onClick={() => handleUserApproval(user._id, "reject")}
                            className="text-white bg-rose-500 hover:bg-rose-600 px-3 py-1 rounded-md transition-colors shadow-sm"
                          >
                            {t("admin.rejectButton")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "all-users" ? (
        <div className="space-y-8">
          {/* All Users Management */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">All Users Management</h3>
            {loading ? (
              <p>{t("admin.loading")}</p>
            ) : allUsers.length === 0 ? (
              <p className="text-slate-500">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === UserRole.Admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            user.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.approvalStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {user.role !== UserRole.Admin && (
                            <Button
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors shadow-sm"
                              title="Delete User"
                            >
                              🗑️ Delete
                            </Button>
                          )}
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
            <h3 className="text-xl font-semibold mb-4 text-slate-700">All Demands</h3>
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
                    <div className="mt-3">
                      <Button
                        onClick={() => handleDeleteDemand(demand._id)}
                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors shadow-sm"
                        title="Delete Demand"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offers Feed */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-slate-700">All Offers</h3>
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
                    <div className="mt-3">
                      <Button
                        onClick={() => handleDeleteOffer(offer._id)}
                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors shadow-sm"
                        title="Delete Offer"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
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
