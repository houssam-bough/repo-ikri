"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import type { Demand } from "@/types"
import { getAllDemands } from "@/services/apiService"

interface DemandsFeedProps {
  setView: (view: "dashboard" | "profile" | "postDemand" | "postOffer") => void
}

const DemandsFeed: React.FC<DemandsFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDemands = useCallback(async () => {
    setLoading(true)
    try {
      const allDemands = await getAllDemands()
      setDemands(allDemands)
    } catch (error) {
      console.error("Failed to fetch demands:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDemands()
  }, [fetchDemands])

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          Available Demands
        </h2>
        <button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t("provider.loadingDemands")}</p>
      ) : demands.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">No demands available at the moment.</p>
          <button
            onClick={() => setView("postOffer")}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Post an Offer Instead
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demands.map((demand) => (
            <div
              key={demand._id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-sky-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-sky-800">{demand.requiredService}</h3>
                  <p className="text-sm text-slate-600">{demand.farmerName}</p>
                </div>
                <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full">
                  {demand.status}
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-4">{demand.description}</p>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-slate-600">
                  <strong>Location:</strong> {demand.jobLocation.coordinates.join(", ")}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Needed:</strong> {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} to{" "}
                  {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                </p>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-medium">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DemandsFeed
