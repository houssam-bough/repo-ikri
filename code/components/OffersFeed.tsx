"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPinIcon, CalendarIcon, UserIcon } from "lucide-react"
import type { Offer, SetAppView } from "@/types"
import { getAllOffers, createReservation, checkOfferAvailability } from "@/services/apiService"
import AvailabilityDialog from "./AvailabilityDialog"

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
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-linear-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          Offres Disponibles
        </h2>
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
        >
          Retour au Tableau de Bord
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">Chargement des offres...</p>
      ) : offers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">Aucune offre disponible pour le moment.</p>
          <Button onClick={() => setView("postDemand")} className="px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
            Publier une Demande
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card
              key={offer._id}
              className="hover:shadow-xl transition-shadow border border-amber-100"
            >
              <CardContent className="p-0">
                <div className="grid md:grid-cols-4 gap-4">
                  {/* Image */}
                  {offer.photoUrl ? (
                    <div className="md:col-span-1">
                      <img 
                        src={offer.photoUrl} 
                        alt={offer.equipmentType} 
                        className="w-full h-full object-cover rounded-l-lg min-h-[200px]"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-1 bg-amber-100 flex items-center justify-center min-h-[200px] rounded-l-lg">
                      <span className="text-6xl">🚜</span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="md:col-span-3 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-amber-800 mb-1">{offer.equipmentType}</h3>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          {offer.providerName}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 text-lg px-3 py-1">
                        {offer.priceRate} MAD/h
                      </Badge>
                    </div>

                    <p className="text-slate-700 mb-4 line-clamp-2">
                      {offer.description || 'Aucune description disponible'}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-amber-600" />
                        <span>{offer.city}</span>
                      </div>
                    </div>

                    {/* Custom fields preview */}
                    {offer.customFields && Object.keys(offer.customFields).length > 0 && (
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {Object.entries(offer.customFields).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                        {Object.keys(offer.customFields).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.keys(offer.customFields).length - 3} autres
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        onClick={() => window.location.href = `/offers/${offer._id}`}
                        className="px-4 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg"
                      >
                        👁️ Voir plus de détails
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default OffersFeed
