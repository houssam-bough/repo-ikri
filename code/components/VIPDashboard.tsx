"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../hooks/useAuth"
import { useLanguage } from "../hooks/useLanguage"
import { Button } from '@/components/ui/button'
import { type Demand, type Offer, type Reservation, DemandStatus, OfferStatus, ReservationStatus } from "../types"
import { getDemandsForFarmer, findMatchesForDemand, findLocalOffers, getOffersForProvider, findLocalDemands, getPendingReservationsForProvider, approveReservation, rejectReservation } from "../services/apiService"
import DynamicMap, { type MapMarker } from "./DynamicMap"
import AvailabilityDialog from "./AvailabilityDialog"
import ListIcon from "./icons/ListIcon"
import MapIcon from "./icons/MapIcon"

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
        alert("Reservation approved successfully!")
        fetchData()
      } else {
        alert("Failed to approve reservation")
      }
    } catch (error) {
      console.error("Error approving reservation:", error)
      alert("Error approving reservation")
    }
  }

  const handleRejectReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to reject this reservation?")) return
    
    try {
      const success = await rejectReservation(reservationId)
      if (success) {
        alert("Reservation rejected")
        fetchData()
      } else {
        alert("Failed to reject reservation")
      }
    } catch (error) {
      console.error("Error rejecting reservation:", error)
      alert("Error rejecting reservation")
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

    // Group offers by provider ID
    const offersByProvider = localOffers.reduce((acc, offer) => {
      if (!acc[offer.providerId]) {
        acc[offer.providerId] = []
      }
      acc[offer.providerId].push(offer)
      return acc
    }, {} as Record<string, typeof localOffers>)

    // Create one marker per provider with all their offers
    const offerMarkers: MapMarker[] = Object.values(offersByProvider).map((providerOffers) => {
      const firstOffer = providerOffers[0]
      const popupContent = `
        <div style="max-width: 250px;">
          <strong style="font-size: 14px;">${firstOffer.providerName}</strong>
          <div style="margin-top: 8px;">
            ${providerOffers.map(offer => `
              <div style="border-bottom: 1px solid #e5e7eb; padding: 8px 0;">
                <strong style="color: #059669;">${offer.equipmentType}</strong><br/>
                <span style="font-size: 12px;">Rate: $${offer.priceRate}/hr</span><br/>
                <span style="font-size: 11px; color: #64748b;">Available: ${offer.availability.map(a => 
                  new Date(a.start).toLocaleDateString()
                ).join(', ')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `
      return {
        position: [firstOffer.serviceAreaLocation.coordinates[1], firstOffer.serviceAreaLocation.coordinates[0]],
        popupContent,
        type: "offer" as const,
      }
    })

    // Group demands by farmer ID
    const demandsByFarmer = localDemands.reduce((acc, demand) => {
      if (!acc[demand.farmerId]) {
        acc[demand.farmerId] = []
      }
      acc[demand.farmerId].push(demand)
      return acc
    }, {} as Record<string, typeof localDemands>)

    // Create one marker per farmer with all their demands
    const demandMarkers: MapMarker[] = Object.values(demandsByFarmer).map((farmerDemands) => {
      const firstDemand = farmerDemands[0]
      const popupContent = `
        <div style="max-width: 250px;">
          <strong style="font-size: 14px;">${firstDemand.farmerName}</strong>
          <div style="margin-top: 8px;">
            ${farmerDemands.map(demand => `
              <div style="border-bottom: 1px solid #e5e7eb; padding: 8px 0;">
                <strong style="color: #0284c7;">${demand.requiredService}</strong><br/>
                <span style="font-size: 12px;">Needed: ${new Date(demand.requiredTimeSlot.start).toLocaleDateString()} - ${new Date(demand.requiredTimeSlot.end).toLocaleDateString()}</span><br/>
                <span style="font-size: 11px; color: #64748b;">Status: ${demand.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `
      return {
        position: [firstDemand.jobLocation.coordinates[1], firstDemand.jobLocation.coordinates[0]],
        popupContent,
        type: "demand" as const,
      }
    })

    return [userMarker, ...offerMarkers, ...demandMarkers]
  }

  const viewModeButtonClasses = (mode: "list" | "map") =>
    `p-2 rounded-lg transition-all duration-300 shadow-sm ${viewMode === mode ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg" : "bg-white text-slate-600 hover:bg-slate-100"}`

  return (
    <div className="container mx-auto">
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
            View Offers Feed
          </Button>
          <Button
            onClick={() => setView("demandsFeed")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-sky-500 to-blue-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            View Demands Feed
          </Button>
          <Button
            onClick={() => setView("myReservations")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            📅 My Reservations
          </Button>
          <Button
            onClick={() => setView("messages")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg transition-all text-sm font-medium"
          >
            💬 Messages
          </Button>
          <button
            onClick={() => setView("userSearch")}
            className="ml-2 px-3 py-2 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-lg transition-all text-sm font-medium cursor-pointer hover:opacity-90"
            type="button"
          >
            🔍 Search Users
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Post Services</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Post a demand for services</p>
                  <Button
                    onClick={() => setView("postDemand")}
                    className="w-full text-white font-semibold bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2 rounded-lg shadow-md transition-all duration-300"
                  >
                    Post Demand
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Post an offer for equipment</p>
                  <Button
                    onClick={() => setView("postOffer")}
                    className="w-full text-white font-semibold bg-linear-to-r from-blue-500 to-indigo-500 px-4 py-2 rounded-lg shadow-md transition-all duration-300"
                  >
                    Post Offer
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">My Demands</h3>
              {loading ? (
                <p>Loading demands...</p>
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
                      <Button
                        onClick={() => handleViewMatches(demand._id)}
                        className="mt-2 text-sm text-white bg-sky-500 px-3 py-1 rounded-md shadow-sm"
                        disabled={demand.status !== DemandStatus.Open}
                      >
                        View Matches
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">My Offers</h3>
              {loading ? (
                <p>Loading offers...</p>
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
                          className="flex-1 px-3 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm"
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
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Pending Reservations</h3>
              {loading ? (
                <p>Loading reservations...</p>
              ) : pendingReservations.length === 0 ? (
                <p className="text-sm text-slate-500">No pending reservation requests</p>
              ) : (
                <div className="space-y-3">
                  {pendingReservations.map((reservation) => (
                    <div key={reservation._id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="font-bold text-slate-800">{reservation.equipmentType}</p>
                      <p className="text-sm text-slate-600">Farmer: {reservation.farmerName}</p>
                      <p className="text-xs text-slate-500 mb-2">
                        {formatDateTime(reservation.reservedTimeSlot.start)} → {formatDateTime(reservation.reservedTimeSlot.end)}
                      </p>
                      <p className="text-sm font-semibold text-emerald-700 mb-3">
                        Total: ${reservation.totalCost?.toFixed(2) ?? '0.00'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveReservation(reservation._id)}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          ✓ Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectReservation(reservation._id)}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          ✗ Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">
                {selectedDemand
                  ? `Matches for "${selectedDemand.requiredService}"`
                  : "Matches for Selected Demand"}
              </h3>
              {selectedDemand &&
                (!matches[selectedDemand._id] ? (
                  <p>Loading matches...</p>
                ) : matches[selectedDemand._id].length === 0 ? (
                  <p>No matches found</p>
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
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Local Offers</h3>
              {loading ? (
                <p>Loading offers...</p>
              ) : localOffers.length === 0 ? (
                <p>No local offers</p>
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
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Local Demands</h3>
              {loading ? (
                <p>Loading demands...</p>
              ) : localDemands.length === 0 ? (
                <p>No local demands</p>
              ) : (
                <div className="space-y-4">
                  {localDemands.slice(0, 5).map((demand) => (
                    <div key={demand._id} className="p-4 border rounded-lg bg-sky-50/50 border-sky-200">
                      <p className="font-bold text-lg text-sky-800">{demand.requiredService}</p>
                      <p className="font-medium text-slate-700">From: {demand.farmerName}</p>
                      <p className="text-sm text-slate-600">
                        Needed: {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} to{" "}
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
          <h3 className="text-xl font-semibold mb-4 text-slate-700">Local Services Map</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            currentUser && (
              <DynamicMap
                center={[currentUser.location.coordinates[1], currentUser.location.coordinates[0]]}
                markers={getMapMarkers()}
              />
            )
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
