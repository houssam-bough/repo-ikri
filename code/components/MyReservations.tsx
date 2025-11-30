"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchReservations()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchReservations])

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm(t('common.confirmCancelReservation'))) return
    
    try {
      const success = await cancelReservation(reservationId)
      if (success) {
        alert(t('common.reservationCancelledSuccess'))
        fetchReservations()
      } else {
        alert(t('common.failedToCancelReservation'))
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error)
      alert(t('common.errorCancellingReservation'))
    }
  }

  const filteredReservations = selectedStatus === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === selectedStatus)

  const getStatusBadge = (status: ReservationStatus) => {
    const config = {
      [ReservationStatus.Pending]: { label: t('common.pending'), className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      [ReservationStatus.Approved]: { label: t('common.approved') + ' ✅', className: 'bg-green-100 text-green-800 border-green-300' },
      [ReservationStatus.Rejected]: { label: t('common.rejected'), className: 'bg-red-100 text-red-800 border-red-300' },
      [ReservationStatus.Cancelled]: { label: t('common.cancelled'), className: 'bg-gray-100 text-gray-800 border-gray-300' },
    }
    const { label, className } = config[status] || config[ReservationStatus.Pending]
    return <Badge className={className}>{label}</Badge>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">{t('common.loadingYourReservations')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('common.myReservations')}</h1>
            <p className="text-slate-600 mt-2">
              {reservations.length} {t('common.myReservations').toLowerCase()}
            </p>
          </div>
          <Button onClick={() => setView("dashboard")} variant="outline">
            ← {t('common.backToDashboard')}
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setSelectedStatus('all')}
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            className={selectedStatus === 'all' ? 'bg-emerald-600' : ''}
          >
            {t('common.all')} ({reservations.length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Pending)}
            variant={selectedStatus === ReservationStatus.Pending ? 'default' : 'outline'}
            className={selectedStatus === ReservationStatus.Pending ? 'bg-yellow-600' : ''}
          >
            {t('common.pending')} ({reservations.filter(r => r.status === ReservationStatus.Pending).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Approved)}
            variant={selectedStatus === ReservationStatus.Approved ? 'default' : 'outline'}
            className={selectedStatus === ReservationStatus.Approved ? 'bg-green-600' : ''}
          >
            {t('common.approved')} ({reservations.filter(r => r.status === ReservationStatus.Approved).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Rejected)}
            variant={selectedStatus === ReservationStatus.Rejected ? 'default' : 'outline'}
            className={selectedStatus === ReservationStatus.Rejected ? 'bg-red-600' : ''}
          >
            {t('common.rejected')} ({reservations.filter(r => r.status === ReservationStatus.Rejected).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Cancelled)}
            variant={selectedStatus === ReservationStatus.Cancelled ? 'default' : 'outline'}
            className={selectedStatus === ReservationStatus.Cancelled ? 'bg-gray-600' : ''}
          >
            {t('common.cancelled')} ({reservations.filter(r => r.status === ReservationStatus.Cancelled).length})
          </Button>
        </div>

        {/* Liste des réservations */}
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">
                {selectedStatus === 'all' 
                  ? t('common.noReservationsYet') 
                  : t('common.noFilteredReservations').replace('{{status}}', selectedStatus.toLowerCase())}
              </p>
              <Button 
                onClick={() => setView("offersFeed")} 
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                {t('common.browseAvailableOffers')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredReservations.map((reservation) => (
              <Card key={reservation._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-slate-800">
                        {reservation.equipmentType}
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {t('common.provider')}: {reservation.providerName}
                      </p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Message de félicitations si approuvée */}
                  {reservation.status === ReservationStatus.Approved && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-green-800 font-semibold text-center">
                        🎉 {t('common.reservationApprovedSuccess')}
                      </p>
                      <p className="text-green-700 text-sm text-center mt-2">
                        {t('common.farmerWillContact')}
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">{t('common.startDate')}</p>
                      <p className="text-slate-800">{formatDateTime(reservation.reservedTimeSlot.start)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">{t('common.endDate')}</p>
                      <p className="text-slate-800">{formatDateTime(reservation.reservedTimeSlot.end)}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">{t('common.rate')}</p>
                      <p className="text-slate-800">${reservation.priceRate}/hour</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">{t('common.total')}</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        ${reservation.totalCost?.toFixed(2) ?? '0.00'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500">
                      {t('common.requested')}: {formatDateTime(reservation.createdAt)}
                    </p>
                    {reservation.approvedAt && (
                      <p className="text-xs text-slate-500">
                        {t('common.approved')}: {formatDateTime(reservation.approvedAt)}
                      </p>
                    )}
                  </div>

                  {reservation.status === ReservationStatus.Pending && (
                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => handleCancelReservation(reservation._id)}
                        variant="outline"
                        className="w-full text-red-700 border-red-300 hover:bg-red-50"
                      >
                        {t('common.cancelReservation')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyReservations
