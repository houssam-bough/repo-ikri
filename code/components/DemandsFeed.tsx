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
    <div className="container mx-auto pt-16">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-linear-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          {t('common.availableDemands')}
        </h2>
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
        >
          {t('common.backToDashboard')}
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t('common.loadingDemands')}</p>
      ) : demands.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">{t('common.noDemands')}</p>
          <Button onClick={() => setView("postOffer")} className="px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
            {t('common.postOfferInstead')}
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
                  <h3 className="text-lg font-bold text-sky-800">{demand.title || demand.requiredService}</h3>
                  <p className="text-sm text-slate-600">{demand.farmerName}</p>
                  {demand.city && (
                    <p className="text-xs text-slate-500 mt-1">📍 {demand.city}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-4">{demand.description}</p>
              <div className="space-y-2 mb-4">
                {demand.address && (
                  <p className="text-sm text-slate-600">
                    <strong>{t('common.address')}:</strong> {demand.address}
                  </p>
                )}
                <p className="text-sm text-slate-600">
                  <strong>{t('common.service')}:</strong> {demand.requiredService}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>{t('common.period')}:</strong> {new Date(demand.requiredTimeSlot.start).toLocaleDateString('en-US')} {t('common.to').toLowerCase()}{" "}
                  {new Date(demand.requiredTimeSlot.end).toLocaleDateString('en-US')}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.href = `/demands/${demand._id}`}
                  className="flex-1 px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-normal leading-tight"
                >
                  👁️ {t('common.viewDetails')}
                </Button>
                
                {currentUser && demand.farmerId !== currentUser._id && (
                  <Button 
                    onClick={() => {
                      // Store message target for direct conversation
                      sessionStorage.setItem('messageTarget', JSON.stringify({
                        userId: demand.farmerId,
                        userName: demand.farmerName,
                        demandId: demand._id
                      }));
                      setView("messages");
                    }}
                    className="flex-1 px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-normal leading-tight"
                  >
                    💬 {t('common.contactFarmer')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DemandsFeed
