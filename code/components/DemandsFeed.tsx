"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import type { Demand, SetAppView } from "@/types"
import { getAllDemands } from "@/services/apiService"

interface DemandsFeedProps {
  setView: SetAppView
}

const DemandsFeed: React.FC<DemandsFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
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
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
        >
          Back to Dashboard
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t("provider.loadingDemands")}</p>
      ) : demands.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">No demands available at the moment.</p>
          <Button onClick={() => setView("postOffer")} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
            Post an Offer Instead
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demands.map((demand) => (
            <div
              key={demand._id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-sky-100"
            >
              {demand.photoUrl && (
                <div className="mb-3 -mx-6 -mt-6">
                  <img 
                    src={demand.photoUrl} 
                    alt={demand.requiredService} 
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-sky-800">{demand.requiredService}</h3>
                  <p className="text-sm text-slate-600">{demand.farmerName}</p>
                </div>
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
              {currentUser && demand.farmerId !== currentUser._id && (
                <Button 
                  onClick={() => {
                    window.location.hash = `messages-${demand.farmerId}-${demand._id}`;
                    setView("messages");
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg"
                >
                  💬 Contact Farmer
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DemandsFeed
