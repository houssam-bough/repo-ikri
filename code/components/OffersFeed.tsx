"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import type { Offer } from "@/types"
import { getAllOffers } from "@/services/apiService"

interface OffersFeedProps {
  setView: (view: "dashboard" | "profile" | "postDemand" | "postOffer") => void
}

const OffersFeed: React.FC<OffersFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const allOffers = await getAllOffers()
      setOffers(allOffers)
    } catch (error) {
      console.error("Failed to fetch offers:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          Available Offers
        </h2>
        <button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t("farmer.loadingDemands")}</p>
      ) : offers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">No offers available at the moment.</p>
          <button
            onClick={() => setView("postDemand")}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Post a Demand Instead
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-amber-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-amber-800">{offer.equipmentType}</h3>
                  <p className="text-sm text-slate-600">{offer.providerName}</p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                  {offer.status}
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-4">{offer.description}</p>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-slate-600">
                  <strong>Rate:</strong> ${offer.priceRate}/hr
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Service Area:</strong> {offer.serviceAreaLocation.coordinates.join(", ")}
                </p>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all font-medium">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OffersFeed
