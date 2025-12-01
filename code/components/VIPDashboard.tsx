"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../hooks/useAuth"
import { useLanguage } from "../hooks/useLanguage"
import { Button } from '@/components/ui/button'
import { type Demand, type Offer, type Reservation, DemandStatus, OfferStatus, ReservationStatus, type GeoJSONPoint } from "../types"
import { getDemandsForFarmer, findMatchesForDemand, findLocalOffers, getOffersForProvider, findLocalDemands, getPendingReservationsForProvider, approveReservation, rejectReservation } from "../services/apiService"
import DynamicMap, { type MapMarker } from "./DynamicMap"
import AvailabilityDialog from "./AvailabilityDialog"
import ListIcon from "./icons/ListIcon"
import MapIcon from "./icons/MapIcon"
import MapFilters, { type MapFiltersState } from "./MapFilters"
import { getDistanceInKm, addRandomOffset50m, isSameLocation } from "../services/geoService"

import { SetAppView } from '../types'

interface VIPDashboardProps {
  setView: SetAppView
}

const VIPDashboard: React.FC<VIPDashboardProps> = ({ setView }) => {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  const [demands, setDemands] = useState<Demand[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [matches, setMatches] = useState<Record<string, Offer[]>>({})
  const [localOffers, setLocalOffers] = useState<Offer[]>([])
  const [localDemands, setLocalDemands] = useState<Demand[]>([])
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [availabilityOfferId, setAvailabilityOfferId] = useState<string | null>(null)
  
  // Map filters state
  const [mapFilters, setMapFilters] = useState<MapFiltersState>({
    showOffers: true,
    showDemands: true,
    machineType: 'all',
    radiusKm: 50
  })
  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const [farmerDemands, providerOffers, offersNearby, demandsNearby, reservations] = await Promise.all([
        getDemandsForFarmer(currentUser._id),
        getOffersForProvider(currentUser._id),
        findLocalOffers(currentUser.location),
        findLocalDemands(currentUser.location),
        getPendingReservationsForProvider(currentUser._id),
      ])
      setDemands(farmerDemands)
      setOffers(providerOffers)
      setLocalOffers(offersNearby)
      setLocalDemands(demandsNearby)
      setPendingReservations(reservations)
      setLocalDemands(demandsNearby)
      // Refresh matches for open demands
      const matchesPromises = farmerDemands
        .filter(d => d.status === DemandStatus.Open)
        .map(d => findMatchesForDemand(d._id))
      const matchesResults = await Promise.all(matchesPromises)
      const newMatches: Record<string, Offer[]> = {}
      farmerDemands
        .filter(d => d.status === DemandStatus.Open)
        .forEach((d, index) => {
          newMatches[d._id] = matchesResults[index]
        })
      setMatches(newMatches)
    } catch (error) {
      console.error("Failed to fetch VIP data:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApproveReservation = async (reservationId: string) => {
    try {
      const success = await approveReservation(reservationId)
      if (success) {
        alert(t('common.reservationApprovedSuccess'))
        fetchData()
      } else {
        alert(t('common.failedToApprove'))
      }
    } catch (error) {
      console.error("Error approving reservation:", error)
      alert(t('common.errorApproving'))
    }
  }

  const handleRejectReservation = async (reservationId: string) => {
    if (!confirm(t('common.confirmRejectReservation'))) return
    
    try {
      const success = await rejectReservation(reservationId)
      if (success) {
        alert(t('common.reservationRejectedSuccess'))
        fetchData()
      } else {
        alert(t('common.failedToReject'))
      }
    } catch (error) {
      console.error("Error rejecting reservation:", error)
      alert(t('common.errorRejecting'))
    }
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewMatches = async (demandId: string) => {
    try {
      const demand = demands.find((d) => d._id === demandId)
      if (!demand || demand.status !== DemandStatus.Open) {
        alert(t("farmer.viewMatchesNotOpen"))
        setSelectedDemand(null)
        return
      }
      setSelectedDemand(demand || null)
      if (!matches[demandId]) {
        // Fetch only if not already fetched
        const foundMatches = await findMatchesForDemand(demandId)
        setMatches((prev) => ({ ...prev, [demandId]: foundMatches }))
      }
    } catch (error) {
      console.error("Failed to find matches:", error)
      alert(t("farmer.viewMatchesError"))
    }
  }

  const getDemandStatusChip = (status: DemandStatus) => {
    const statusText = {
      [DemandStatus.Pending]: t("status.pending"),
      [DemandStatus.Open]: t("status.open"),
      [DemandStatus.Matched]: t("status.matched"),
      [DemandStatus.Rejected]: t("status.rejected"),
    }[status]

    const statusColor = {
      [DemandStatus.Pending]: "bg-amber-100 text-amber-800",
      [DemandStatus.Open]: "bg-emerald-100 text-emerald-800",
      [DemandStatus.Matched]: "bg-sky-100 text-sky-800",
      [DemandStatus.Rejected]: "bg-rose-100 text-rose-800",
    }[status]

    return <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
  }

  const getOfferStatusChip = (status: OfferStatus) => {
    const statusText = {
      [OfferStatus.Pending]: t("status.pending"),
      [OfferStatus.Approved]: t("status.approved"),
      [OfferStatus.Rejected]: t("status.rejected"),
    }[status]

    const statusColor = {
      [OfferStatus.Pending]: "bg-amber-100 text-amber-800",
      [OfferStatus.Approved]: "bg-emerald-100 text-emerald-800",
      [OfferStatus.Rejected]: "bg-rose-100 text-rose-800",
    }[status]

    return <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${statusColor}`}>{statusText}</span>
  }

  const getMapMarkers = (): MapMarker[] => {
    if (!currentUser) return []

    const userMarker: MapMarker = {
      position: [currentUser.location.coordinates[1], currentUser.location.coordinates[0]],
      popupContent: `<strong>You are here</strong><br/>${currentUser.name}`,
      type: "user",
    }

    const markers: MapMarker[] = [userMarker]
    const usedPositions: Array<[number, number]> = []

    // Helper function to get a unique position with random offset if needed
    const getUniquePosition = (originalLat: number, originalLon: number): [number, number] => {
      let position: [number, number] = [originalLat, originalLon]
      
      // Check if this position is already used
      while (usedPositions.some(pos => isSameLocation(pos, position))) {
        // Add random offset of ~50m
        position = addRandomOffset50m(originalLat, originalLon)
      }
      
      usedPositions.push(position)
      return position
    }

    // Get unique machine types for filters
    const allMachineTypes = new Set<string>()
    localOffers.forEach(offer => allMachineTypes.add(offer.equipmentType))
    localDemands.forEach(demand => allMachineTypes.add(demand.requiredService))

    // Filter by radius
    const userLocation: GeoJSONPoint = currentUser.location
    
    // Group offers by equipmentType (machine) instead of provider
    if (mapFilters.showOffers) {
      const offersByMachine = localOffers.reduce((acc, offer) => {
        // Apply radius filter
        const distance = getDistanceInKm(userLocation, offer.serviceAreaLocation)
        if (distance > mapFilters.radiusKm) return acc
        
        // Apply machine type filter
        if (mapFilters.machineType !== 'all' && offer.equipmentType !== mapFilters.machineType) {
          return acc
        }

        if (!acc[offer.equipmentType]) {
          acc[offer.equipmentType] = []
        }
        acc[offer.equipmentType].push(offer)
        return acc
      }, {} as Record<string, typeof localOffers>)

      // Create one marker per machine type
      Object.entries(offersByMachine).forEach(([machineType, machineOffers]) => {
        machineOffers.forEach((offer) => {
          const originalLat = offer.serviceAreaLocation.coordinates[1]
          const originalLon = offer.serviceAreaLocation.coordinates[0]
          const position = getUniquePosition(originalLat, originalLon)
          
          const popupContent = `
            <div style="max-width: 280px;">
              <strong style="font-size: 14px; color: #0284c7;">📍 ${machineType}</strong>
              <div style="margin-top: 8px; padding: 8px 0; border-top: 2px solid #0284c7;">
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>${t('common.provider')}:</strong> ${offer.providerName}</p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>${t('common.rate')}:</strong> $${offer.priceRate}/hr</p>
                <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${t('common.available')}: ${offer.availability.map(a => 
                  new Date(a.start).toLocaleDateString()
                ).join(', ')}</p>
                <a href="/offers/${offer._id}" 
                   style="display: inline-block; background: linear-gradient(to right, #3b82f6, #6366f1); color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 4px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); transition: all 0.2s;"
                   onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.4)'"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(59, 130, 246, 0.3)'">
                  👁️ ${t('common.viewDetailsButton')}
                </a>
              </div>
            </div>
          `
          
          markers.push({
            position,
            popupContent,
            type: "offer" as const,
            equipmentType: machineType,
            itemId: offer._id
          })
        })
      })
    }

    // Group demands by requiredService (machine) instead of farmer
    if (mapFilters.showDemands) {
      const demandsByMachine = localDemands.reduce((acc, demand) => {
        // Apply radius filter
        const distance = getDistanceInKm(userLocation, demand.jobLocation)
        if (distance > mapFilters.radiusKm) return acc
        
        // Apply machine type filter
        if (mapFilters.machineType !== 'all' && demand.requiredService !== mapFilters.machineType) {
          return acc
        }

        if (!acc[demand.requiredService]) {
          acc[demand.requiredService] = []
        }
        acc[demand.requiredService].push(demand)
        return acc
      }, {} as Record<string, typeof localDemands>)

      // Create one marker per machine type
      Object.entries(demandsByMachine).forEach(([machineType, machineDemands]) => {
        machineDemands.forEach((demand) => {
          const originalLat = demand.jobLocation.coordinates[1]
          const originalLon = demand.jobLocation.coordinates[0]
          const position = getUniquePosition(originalLat, originalLon)
          
          const popupContent = `
            <div style="max-width: 280px;">
              <strong style="font-size: 14px; color: #ea580c;">🔍 ${machineType}</strong>
              <div style="margin-top: 8px; padding: 8px 0; border-top: 2px solid #ea580c;">
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>${t('common.title')}:</strong> ${demand.title || machineType}</p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>${t('common.city')}:</strong> ${demand.city}</p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>${t('common.farmer')}:</strong> ${demand.farmerName}</p>
                <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${t('common.needed')}: ${new Date(demand.requiredTimeSlot.start).toLocaleDateString()} - ${new Date(demand.requiredTimeSlot.end).toLocaleDateString()}</p>
                <a href="/demands/${demand._id}" 
                   style="display: inline-block; background: linear-gradient(to right, #3b82f6, #6366f1); color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 4px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); transition: all 0.2s;"
                   onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.4)'"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(59, 130, 246, 0.3)'">
                  👁️ ${t('common.viewDetailsButton')}
                </a>
              </div>
            </div>
          `
          
          markers.push({
            position,
            popupContent,
            type: "demand" as const,
            equipmentType: machineType,
            itemId: demand._id
          })
        })
      })
    }

    return markers
  }

  // Get available machine types for filter dropdown
  const getAvailableMachineTypes = (): string[] => {
    const types = new Set<string>()
    localOffers.forEach(offer => types.add(offer.equipmentType))
    localDemands.forEach(demand => types.add(demand.requiredService))
    return Array.from(types).sort()
  }

  const handleMarkerClick = (itemId: string, type: "offer" | "demand") => {
    if (typeof window !== 'undefined') {
      if (type === "offer") {
        window.open(`/offers/${itemId}`, '_blank')
      } else {
        window.open(`/demands/${itemId}`, '_blank')
      }
    }
  }

  const viewModeButtonClasses = (mode: "list" | "map") =>
    `p-2 rounded-lg transition-all duration-300 shadow-sm ${viewMode === mode ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-100"}`

  return (
    <div className="container mx-auto pt-16">
      <div className="flex justify-between items-center border-b pb-2 mb-6">
  <h2 className="text-3xl font-bold bg-linear-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          User Dashboard
        </h2>
        <div className="flex items-center space-x-2 p-1 bg-slate-200/50 rounded-lg">
          <Button
            onClick={() => setViewMode("list")}
            className={viewModeButtonClasses("list")}
            aria-label="List View"
          >
            <ListIcon className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setViewMode("map")}
            className={viewModeButtonClasses("map")}
            aria-label="Map View"
          >
            <MapIcon className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setView("offersFeed")}
            className="ml-4 px-3 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            {t('common.viewOffersFeed')}
          </Button>
          <Button
            onClick={() => setView("demandsFeed")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-sky-500 to-blue-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            {t('common.viewDemandsFeed')}
          </Button>
          <Button
            onClick={() => setView("myReservations")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            📅 {t('common.myReservations')}
          </Button>
          <Button
            onClick={() => setView("messages")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            💬 {t('common.messages')}
          </Button>
          <Button
            onClick={() => setView("userSearch")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            🔍 {t('common.searchUsers')}
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.postServices')}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">{t('common.postDemandDescription')}</p>
                  <Button
                    onClick={() => setView("postDemand")}
                    className="w-full text-white font-semibold bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2 rounded-lg shadow-md transition-all duration-300"
                  >
                    {t('common.postDemand')}
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">{t('common.postOfferDescription')}</p>
                  <Button
                    onClick={() => setView("postOffer")}
                    className="w-full text-white font-semibold bg-linear-to-r from-blue-500 to-indigo-500 px-4 py-2 rounded-lg shadow-md transition-all duration-300"
                  >
                    {t('common.postOffer')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.myDemands')}</h3>
              {loading ? (
                <p>{t('common.loadingDemands')}</p>
              ) : (
                <ul className="space-y-4">
                  {demands.map((demand) => (
                    <li key={demand._id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-800">{demand.requiredService}</p>
                        {getDemandStatusChip(demand.status)}
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} -{" "}
                        {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleViewMatches(demand._id)}
                          className="flex-1 text-xs text-white bg-sky-500 px-2 py-1 rounded-md shadow-sm whitespace-normal leading-tight"
                          disabled={demand.status !== DemandStatus.Open}
                        >
                          {t('common.viewMatches')}
                        </Button>
                        <Button
                          onClick={() => window.location.href = `/demands/${demand._id}`}
                          className="flex-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded-md shadow-sm transition-colors whitespace-normal leading-tight"
                        >
                          {t('common.viewDetails')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.myOffers')}</h3>
              {loading ? (
                <p>{t('common.loadingOffers')}</p>
              ) : (
                <ul className="space-y-3">
                  {offers.map((offer) => (
                    <li key={offer._id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-800">{offer.equipmentType}</p>
                        {getOfferStatusChip(offer.status)}
                      </div>
                      <p className="text-sm text-slate-500">${offer.priceRate}/hr</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setAvailabilityOfferId(offer._id)}
                          className="flex-1 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs transition-colors shadow-sm whitespace-normal leading-tight"
                        >
                          {t('availability.viewAvailability')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.pendingReservations')}</h3>
              {loading ? (
                <p>{t('common.loadingReservations')}</p>
              ) : pendingReservations.length === 0 ? (
                <p className="text-sm text-slate-500">{t('common.noPendingReservations')}</p>
              ) : (
                <div className="space-y-3">
                  {pendingReservations.map((reservation) => (
                    <div key={reservation._id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="font-bold text-slate-800">{reservation.equipmentType}</p>
                      <p className="text-sm text-slate-600">{t('common.farmer')}: {reservation.farmerName}</p>
                      <p className="text-xs text-slate-500 mb-2">
                        {formatDateTime(reservation.reservedTimeSlot.start)} → {formatDateTime(reservation.reservedTimeSlot.end)}
                      </p>
                      <p className="text-sm font-semibold text-emerald-700 mb-3">
                        {t('common.total')}: ${reservation.totalCost?.toFixed(2) ?? '0.00'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveReservation(reservation._id)}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          ✓ {t('common.approve')}
                        </Button>
                        <Button
                          onClick={() => handleRejectReservation(reservation._id)}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          ✗ {t('common.reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.myProposals')}</h3>
              <Button
                onClick={() => setView('myProposals')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 font-medium transition-colors shadow-sm"
              >
                📋 {t('common.viewMyProposals')}
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">
                {selectedDemand
                  ? `${t('common.matchesFor')} "${selectedDemand.requiredService}"`
                  : `${t('common.matchesFor')} ${t('common.selectedDemand')}`}
              </h3>
              {selectedDemand &&
                (!matches[selectedDemand._id] ? (
                  <p>{t('common.loadingMatches')}</p>
                ) : matches[selectedDemand._id].length === 0 ? (
                  <p>{t('common.noMatches')}</p>
                ) : (
                  <div className="space-y-4">
                    {matches[selectedDemand._id].map((offer) => (
                      <div key={offer._id} className="p-4 border rounded-lg bg-emerald-50/50 border-emerald-200">
                        <p className="font-bold text-lg text-emerald-800">{offer.providerName}</p>
                        <p className="font-medium text-slate-700">{offer.equipmentType}</p>
                        <p className="text-sm text-slate-600">{offer.description}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-2">
                          Rate: ${offer.priceRate}/hr
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.localOffers')}</h3>
              {loading ? (
                <p>{t('common.loadingOffers')}</p>
              ) : localOffers.length === 0 ? (
                <p>{t('common.noLocalOffers')}</p>
              ) : (
                <div className="space-y-4">
                  {localOffers.slice(0, 5).map((offer) => (
                    <div key={offer._id} className="p-4 border rounded-lg bg-amber-50/50 border-amber-200">
                      <p className="font-bold text-lg text-amber-800">{offer.providerName}</p>
                      <p className="font-medium text-slate-700">{offer.equipmentType}</p>
                      <p className="text-sm text-slate-600">{offer.description}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-2">
                        Rate: ${offer.priceRate}/hr
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.localDemands')}</h3>
              {loading ? (
                <p>{t('common.loadingDemands')}</p>
              ) : localDemands.length === 0 ? (
                <p>{t('common.noLocalDemands')}</p>
              ) : (
                <div className="space-y-4">
                  {localDemands.slice(0, 5).map((demand) => (
                    <div key={demand._id} className="p-4 border rounded-lg bg-sky-50/50 border-sky-200">
                      <p className="font-bold text-lg text-sky-800">{demand.requiredService}</p>
                      <p className="font-medium text-slate-700">{t('common.from')}: {demand.farmerName}</p>
                      <p className="text-sm text-slate-600">
                        {t('common.needed')}: {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} to{" "}
                        {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">{t('common.localServicesMap')}</h3>
          {currentUser && (
            <>
              <MapFilters
                filters={mapFilters}
                onFiltersChange={setMapFilters}
                availableMachineTypes={getAvailableMachineTypes()}
              />
              {loading ? (
                <p>{t('common.loading')}</p>
              ) : (
                <DynamicMap
                  center={[currentUser.location.coordinates[1], currentUser.location.coordinates[0]]}
                  markers={getMapMarkers()}
                  onMarkerClick={handleMarkerClick}
                />
              )}
            </>
          )}
        </div>
      )}
      {availabilityOfferId && (
        <AvailabilityDialog
          offerId={availabilityOfferId}
          offerTitle={offers.find(o => o._id === availabilityOfferId)?.equipmentType}
          isProviderView={true}
          offerOwnerId={offers.find(o => o._id === availabilityOfferId)?.providerId}
          onClose={() => setAvailabilityOfferId(null)}
        />
      )}
    </div>
  )
}

export default VIPDashboard
