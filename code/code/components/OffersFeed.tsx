"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Offer, SetAppView } from "@/types"
import { getAllOffers } from "@/services/apiService"

interface OffersFeedProps {
  setView: SetAppView
}

const OffersFeed: React.FC<OffersFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser, refreshUser } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [machineType, setMachineType] = useState<string>('all')
  const [radiusKm, setRadiusKm] = useState<number>(50)

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
    refreshUser() // Refresh user data to get latest location
    fetchOffers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get unique machine types
  const availableMachineTypes = useMemo(() => {
    const types = new Set(offers.map(offer => offer.equipmentType))
    return Array.from(types).sort()
  }, [offers])

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Check if user has location for radius filtering
  const hasUserLocation = currentUser?.location?.coordinates?.[0] != null && currentUser?.location?.coordinates?.[1] != null

  // Filter offers based on criteria
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      // Machine type filter
      if (machineType !== 'all' && offer.equipmentType !== machineType) {
        return false
      }

      // Radius filter (only if BOTH user AND offer have valid location coordinates)
      if (hasUserLocation) {
        // If user has location but offer doesn't, skip radius filtering for this offer
        const offerLat = offer.serviceAreaLocation?.coordinates?.[1]
        const offerLon = offer.serviceAreaLocation?.coordinates?.[0]
        if (offerLat != null && offerLon != null) {
          const distance = calculateDistance(
            currentUser.location.coordinates[1],
            currentUser.location.coordinates[0],
            offerLat,
            offerLon
          )
          
          if (distance > radiusKm) {
            return false
          }
        }
        // If offer has no location, include it (can't filter by distance)
      }
      // If user has no location, show all offers (can't filter by distance)

      return true
    })
  }, [offers, machineType, radiusKm, currentUser, hasUserLocation])

  const handleResetFilters = () => {
    setMachineType('all')
    setRadiusKm(50)
  }

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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-700">{t('common.filters')}</h3>
          <Button
            onClick={handleResetFilters}
            className="text-xs px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded"
          >
            {t('common.reset')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Machine Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="machineType" className="text-sm font-medium text-slate-600">
              {t('common.machineType')}
            </Label>
            <select
              id="machineType"
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              <option value="all">{t('common.allMachines')}</option>
              {availableMachineTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Radius Filter */}
          <div className="space-y-2">
            <Label htmlFor="radius" className="text-sm font-medium text-slate-600">
              {t('common.radiusKm')}
            </Label>
            <Input
              id="radius"
              type="number"
              min="0"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value) || 0)}
              className="w-full"
              placeholder="50"
              disabled={!hasUserLocation}
            />
            {!hasUserLocation ? (
              <p className="text-xs text-amber-600 font-semibold">
                ⚠️ Set your location in Profile to use radius filter
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {t('common.showOffersWithin').replace('{{radius}}', radiusKm.toString())}
              </p>
            )}
          </div>

          {/* Active Filters Summary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-600">{t('common.activeFilters')}</Label>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                {t('common.machine')}: {machineType === 'all' ? t('common.allTypesMachines') : machineType}
              </p>
              <p>
                {t('common.radius')}: {radiusKm} km
              </p>
              <p className="font-semibold text-blue-600">
                {t('common.showingOffers').replace('{{showing}}', filteredOffers.length.toString()).replace('{{total}}', offers.length.toString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t('common.loadingOffers')}</p>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">{t('common.noOffersAvailable')}</p>
          <Button onClick={() => setView("postDemand")} className="px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
            {t('common.publishDemand')}
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
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
