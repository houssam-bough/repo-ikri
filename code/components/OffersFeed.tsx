"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import type { Offer, SetAppView } from "@/types"
import { getAllOffers, createReservation, checkOfferAvailability, sendMessage } from "@/services/apiService"
import AvailabilityDialog from "./AvailabilityDialog"

interface OffersFeedProps {
  setView: SetAppView
}

const OffersFeed: React.FC<OffersFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [reservationStartDate, setReservationStartDate] = useState("")
  const [reservationStartTime, setReservationStartTime] = useState("")
  const [reservationEndDate, setReservationEndDate] = useState("")
  const [reservationEndTime, setReservationEndTime] = useState("")
  const [isReserving, setIsReserving] = useState(false)
  const [availabilityOfferId, setAvailabilityOfferId] = useState<string | null>(null)

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

  const handleReserveClick = (offer: Offer) => {
    setSelectedOffer(offer)
    // Set default dates to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    setReservationStartDate(tomorrowStr)
    setReservationEndDate(tomorrowStr)
    setReservationStartTime("09:00")
    setReservationEndTime("17:00")
  }

  const handleReservationSubmit = async () => {
    if (!currentUser || !selectedOffer) return

    const startDateTime = new Date(`${reservationStartDate}T${reservationStartTime}`)
    const endDateTime = new Date(`${reservationEndDate}T${reservationEndTime}`)

    if (endDateTime <= startDateTime) {
      alert("End time must be after start time")
      return
    }

    setIsReserving(true)
    try {
      // Check availability
      const isAvailable = await checkOfferAvailability(selectedOffer._id, {
        start: startDateTime,
        end: endDateTime
      })

      if (!isAvailable) {
        alert("Sorry, this equipment is already booked for the selected time period. Please choose a different time.")
        setIsReserving(false)
        return
      }

      // Create reservation
      const reservation = await createReservation(
        currentUser._id,
        currentUser.name,
        currentUser.phone,
        selectedOffer,
        {
          start: startDateTime,
          end: endDateTime
        }
      )

      if (reservation) {
        alert("Reservation request sent! The provider will review and approve it.")
        setSelectedOffer(null)
      } else {
        alert("Failed to create reservation. Please try again.")
      }
    } catch (error) {
      console.error("Reservation error:", error)
      alert("Error creating reservation")
    } finally {
      setIsReserving(false)
    }
  }

  const calculateEstimatedCost = () => {
    if (!selectedOffer || !reservationStartDate || !reservationStartTime || !reservationEndDate || !reservationEndTime) {
      return 0
    }
    const start = new Date(`${reservationStartDate}T${reservationStartTime}`)
    const end = new Date(`${reservationEndDate}T${reservationEndTime}`)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return hours > 0 ? hours * selectedOffer.priceRate : 0
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-linear-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          Available Offers
        </h2>
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
        >
          Back to Dashboard
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">{t("farmer.loadingDemands")}</p>
      ) : offers.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">No offers available at the moment.</p>
          <Button onClick={() => setView("postDemand")} className="px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg">
            Post a Demand Instead
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
              <div className="space-y-2">
                <Button 
                  onClick={() => handleReserveClick(offer)}
                  className="w-full px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg"
                >
                  📅 Reserve This Service
                </Button>
                <Button
                  onClick={() => setAvailabilityOfferId(offer._id)}
                  className="w-full px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg"
                >
                  🔍 {t('availability.viewAvailability')}
                </Button>
                {currentUser && offer.providerId !== currentUser._id && (
                  <Button 
                    onClick={() => {
                      // Navigate to messages with this provider
                      window.location.hash = `messages-${offer.providerId}-${offer._id}`;
                      setView("messages");
                    }}
                    className="w-full px-4 py-2 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg"
                  >
                    💬 Contact Provider
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservation Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Reserve: {selectedOffer.equipmentType}
            </h3>
            <p className="text-sm text-slate-600 mb-4">Provider: {selectedOffer.providerName}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={reservationStartDate}
                  onChange={(e) => setReservationStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={reservationStartTime}
                  onChange={(e) => setReservationStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={reservationEndDate}
                  onChange={(e) => setReservationEndDate(e.target.value)}
                  min={reservationStartDate}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={reservationEndTime}
                  onChange={(e) => setReservationEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Rate:</strong> ${selectedOffer.priceRate}/hour
                </p>
                <p className="text-lg font-bold text-amber-800 mt-2">
                  Estimated Cost: ${calculateEstimatedCost().toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setSelectedOffer(null)}
                disabled={isReserving}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReservationSubmit}
                disabled={isReserving}
                className="flex-1 px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isReserving ? "Reserving..." : "Confirm Reservation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Dialog (public) */}
      {availabilityOfferId && (
        <AvailabilityDialog
          offerId={availabilityOfferId}
          offerTitle={offers.find(o => o._id === availabilityOfferId)?.equipmentType}
          isProviderView={false}
          offerOwnerId={offers.find(o => o._id === availabilityOfferId)?.providerId}
          onClose={() => setAvailabilityOfferId(null)}
        />
      )}
    </div>
  )
}

export default OffersFeed
 
// Availability dialog overlay (public view)
// Render at root of this component to avoid stacking issues
// Note: We add this at the bottom to keep JSX above tidy
