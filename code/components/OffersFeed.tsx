"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Offer, SetAppView } from "@/types"
import { getAllOffers } from "@/services/apiService"

interface OffersFeedProps {
  setView: SetAppView
}

const OffersFeed: React.FC<OffersFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
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
    <div className="container mx-auto pt-16">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-linear-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          {t('common.availableOffers')}
        </h2>
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
        >
          {t('common.backToDashboard')}
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t('common.loadingOffers')}</p>
      ) : offers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">{t('common.noOffersAvailable')}</p>
          <Button onClick={() => setView("postDemand")} className="px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
            {t('common.publishDemand')}
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div
              key={offer._id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-amber-100"
            >
              {offer.photoUrl && (
                <div className="mb-3 -mx-6 -mt-6">
                  <img 
                    src={offer.photoUrl} 
                    alt={offer.equipmentType} 
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-amber-800">{offer.equipmentType}</h3>
                  <p className="text-sm text-slate-600">{offer.providerName}</p>
                  {offer.city && (
                    <p className="text-xs text-slate-500 mt-1">📍 {offer.city}</p>
                  )}
                </div>
                <Badge className="bg-amber-100 text-amber-800">
                  {offer.priceRate} MAD/h
                </Badge>
              </div>
              <p className="text-sm text-slate-700 mb-4">{offer.description || t('common.noDescription')}</p>
              
              {/* Custom fields preview */}
              {offer.customFields && Object.keys(offer.customFields).length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {Object.entries(offer.customFields).slice(0, 2).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.href = `/offers/${offer._id}`}
                  className="flex-1 px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-normal leading-tight"
                >
                  👁️ {t('common.viewDetails')}
                </Button>
                
                {currentUser && offer.providerId !== currentUser._id && (
                  <Button 
                    onClick={() => {
                      // Store message target for direct conversation
                      sessionStorage.setItem('messageTarget', JSON.stringify({
                        userId: offer.providerId,
                        userName: offer.providerName,
                        offerId: offer._id
                      }));
                      setView("messages");
                    }}
                    className="flex-1 px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-normal leading-tight"
                  >
                    💬 {t('common.contactProvider')}
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

export default OffersFeed
