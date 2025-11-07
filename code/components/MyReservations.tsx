"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import type { Reservation, SetAppView } from "@/types"
import { ReservationStatus } from "@/types"
import { getReservationsForFarmer, cancelReservation } from "@/services/apiService"

interface MyReservationsProps {
  setView: SetAppView
}

const MyReservations: React.FC<MyReservationsProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | ReservationStatus>('all')

  const fetchReservations = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const allReservations = await getReservationsForFarmer(currentUser._id)
      setReservations(allReservations)
    } catch (error) {
      console.error("Failed to fetch reservations:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return
    
    try {
      const success = await cancelReservation(reservationId)
      if (success) {
        alert("Reservation cancelled successfully")
        fetchReservations()
      } else {
        alert("Failed to cancel reservation")
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      alert("Error cancelling reservation")
    }
  }

  const filteredReservations = selectedStatus === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === selectedStatus)

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.Pending:
        return "bg-yellow-100 text-yellow-800"
      case ReservationStatus.Approved:
        return "bg-green-100 text-green-800"
      case ReservationStatus.Rejected:
        return "bg-red-100 text-red-800"
      case ReservationStatus.Cancelled:
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-slate-100 text-slate-800"
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

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-900 bg-clip-text text-transparent">
          My Reservations ({reservations.length})
        </h2>
        <Button
          onClick={() => setView("dashboard")}
          className="px-4 py-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg ${selectedStatus === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          All ({reservations.length})
        </Button>
        <Button
          onClick={() => setSelectedStatus(ReservationStatus.Pending)}
          className={`px-4 py-2 rounded-lg ${selectedStatus === ReservationStatus.Pending ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Pending ({reservations.filter(r => r.status === ReservationStatus.Pending).length})
        </Button>
        <Button
          onClick={() => setSelectedStatus(ReservationStatus.Approved)}
          className={`px-4 py-2 rounded-lg ${selectedStatus === ReservationStatus.Approved ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Approved ({reservations.filter(r => r.status === ReservationStatus.Approved).length})
        </Button>
        <Button
          onClick={() => setSelectedStatus(ReservationStatus.Rejected)}
          className={`px-4 py-2 rounded-lg ${selectedStatus === ReservationStatus.Rejected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Rejected ({reservations.filter(r => r.status === ReservationStatus.Rejected).length})
        </Button>
        <Button
          onClick={() => setSelectedStatus(ReservationStatus.Cancelled)}
          className={`px-4 py-2 rounded-lg ${selectedStatus === ReservationStatus.Cancelled ? 'bg-gray-600 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          Cancelled ({reservations.filter(r => r.status === ReservationStatus.Cancelled).length})
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-slate-600">Loading your reservations...</p>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-slate-600 mb-4">
            {selectedStatus === 'all' 
              ? "You haven't made any reservations yet." 
              : `No ${selectedStatus.toLowerCase()} reservations.`}
          </p>
          <Button 
            onClick={() => setView("offersFeed")} 
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg"
          >
            Browse Available Offers
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <div
              key={reservation._id}
              className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{reservation.equipmentType}</h3>
                  <p className="text-sm text-slate-600">Provider: {reservation.providerName}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                  {reservation.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-600">
                    <strong>Start:</strong> {formatDateTime(reservation.reservedTimeSlot.start)}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>End:</strong> {formatDateTime(reservation.reservedTimeSlot.end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    <strong>Rate:</strong> ${reservation.priceRate}/hour
                  </p>
                  <p className="text-lg font-bold text-emerald-800">
                    Total: ${reservation.totalCost?.toFixed(2) ?? '0.00'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <p>Requested: {formatDateTime(reservation.createdAt)}</p>
                {reservation.approvedAt && (
                  <p>Approved: {formatDateTime(reservation.approvedAt)}</p>
                )}
              </div>

              {reservation.status === ReservationStatus.Pending && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => handleCancelReservation(reservation._id)}
                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                  >
                    Cancel Reservation
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyReservations
