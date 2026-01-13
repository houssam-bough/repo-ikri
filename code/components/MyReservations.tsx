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
import { getReservationsForFarmer, cancelReservation, farmerFinalValidateReservation, startConversation } from "@/services/apiService"
import { MessageCircle, Download, FileText, Phone, Mail, CheckCircle, FileCheck } from "lucide-react"

interface MyReservationsProps {
  setView: SetAppView
}

const MyReservations: React.FC<MyReservationsProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | ReservationStatus>('all')
  const [isMobileApp, setIsMobileApp] = useState(false)

  useEffect(() => {
    const mobile = typeof window !== 'undefined' && (
      document.body.classList.contains('mobile-app') ||
      Boolean((window as any).Capacitor)
    )
    setIsMobileApp(mobile)
  }, [])

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
    if (!confirm(t('common.confirmCancelReservation'))) return
    
    try {
      const success = await cancelReservation(reservationId, currentUser?._id)
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

  // Farmer final validation to conclude the reservation
  const handleFarmerFinalValidate = async (reservationId: string) => {
    if (!confirm("Confirmez-vous définitivement cette réservation ? Le contrat sera finalisé.")) return
    
    try {
      const updated = await farmerFinalValidateReservation(reservationId, currentUser?._id || '')
      if (updated) {
        alert("🎉 Réservation confirmée ! Le contrat est maintenant disponible au téléchargement.")
        fetchReservations()
      } else {
        alert("Erreur lors de la confirmation de la réservation")
      }
    } catch (error) {
      console.error("Error confirming reservation:", error)
      alert("Erreur lors de la confirmation de la réservation")
    }
  }

  // Download contract PDF for approved reservations
  const handleDownloadContract = async (reservation: Reservation) => {
    try {
      const response = await fetch(`/api/reservations/${reservation._id}/contract`)
      if (!response.ok) {
        throw new Error('Failed to generate contract')
      }
      const blob = await response.blob()
      const filename = `Contrat_Location_YKRI_${reservation._id.substring(0, 8)}.pdf`
      
      // Use mobile-aware download utility
      const { downloadFile } = await import('@/lib/mobileUtils')
      const url = window.URL.createObjectURL(blob)
      await downloadFile(url, filename, blob)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading contract:', error)
      alert('Erreur lors du téléchargement du contrat')
    }
  }

  // Start conversation with provider
  const handleContactProvider = async (reservation: Reservation) => {
    if (!currentUser) return
    try {
      await startConversation(
        currentUser._id,
        currentUser.name,
        reservation.providerId,
        reservation.providerName,
        `Bonjour ${reservation.providerName}, je vous contacte au sujet de ma réservation pour ${reservation.equipmentType}.`
      )
      setView('messages')
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Erreur lors de l\'ouverture de la messagerie')
    }
  }

  const filteredReservations = selectedStatus === 'all' 
    ? reservations 
    : reservations.filter(r => r.status === selectedStatus)

  const getStatusBadge = (reservation: any) => {
    const status = reservation.status as ReservationStatus
    const providerValidated = reservation.providerValidated || false
    const farmerValidated = reservation.farmerValidated || false
    
    // Double validation states
    if (status === ReservationStatus.Pending && providerValidated && !farmerValidated) {
      return <Badge className="bg-green-100 text-green-800 border-green-300 animate-pulse">🎯 À confirmer de votre part</Badge>
    }
    if (status === ReservationStatus.Pending && !providerValidated) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">⏳ Attente validation prestataire</Badge>
    }
    
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
      <div className="bg-linear-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">{t('common.loadingYourReservations')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-linear-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('common.myReservations')}</h1>
            <p className="text-slate-600 mt-2">
              {reservations.length} {t('common.myReservations').toLowerCase()}
            </p>
          </div>
          {!isMobileApp && (
            <Button onClick={() => setView("dashboard")} variant="outline">
              ← {t('common.backToDashboard')}
            </Button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
          <Button
            onClick={() => setSelectedStatus('all')}
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${selectedStatus === 'all' ? 'bg-emerald-600' : ''}`}
          >
            {t('common.all')} ({reservations.length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Pending)}
            variant={selectedStatus === ReservationStatus.Pending ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${selectedStatus === ReservationStatus.Pending ? 'bg-yellow-600' : ''}`}
          >
            {t('common.pending')} ({reservations.filter(r => r.status === ReservationStatus.Pending).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Approved)}
            variant={selectedStatus === ReservationStatus.Approved ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${selectedStatus === ReservationStatus.Approved ? 'bg-green-600' : ''}`}
          >
            {t('common.approved')} ({reservations.filter(r => r.status === ReservationStatus.Approved).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Rejected)}
            variant={selectedStatus === ReservationStatus.Rejected ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${selectedStatus === ReservationStatus.Rejected ? 'bg-red-600' : ''}`}
          >
            {t('common.rejected')} ({reservations.filter(r => r.status === ReservationStatus.Rejected).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(ReservationStatus.Cancelled)}
            variant={selectedStatus === ReservationStatus.Cancelled ? 'default' : 'outline'}
            className={`text-xs md:text-sm ${selectedStatus === ReservationStatus.Cancelled ? 'bg-gray-600' : ''}`}
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
                    {getStatusBadge(reservation)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Message de félicitations si approuvée */}
                  {reservation.status === ReservationStatus.Approved && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-green-800 font-semibold text-center text-lg">
                        🎉 Réservation Approuvée !
                      </p>
                      <p className="text-green-700 text-sm text-center mt-2">
                        Votre réservation a été confirmée. Vous pouvez contacter le prestataire et télécharger le contrat.
                      </p>
                      
                      {/* Informations de contact du prestataire */}
                      <div className="bg-white rounded-lg p-4 mt-4 border border-green-300">
                        <p className="text-sm font-semibold text-slate-700 mb-3 text-center">
                          📞 Coordonnées du prestataire
                        </p>
                        <div className="flex flex-col gap-2 items-center">
                          <p className="text-slate-800 font-medium">
                            {reservation.providerName}
                          </p>
                          {reservation.providerPhone && (
                            <a 
                              href={`tel:${reservation.providerPhone}`}
                              className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              {reservation.providerPhone}
                            </a>
                          )}
                          {reservation.providerEmail && (
                            <a 
                              href={`mailto:${reservation.providerEmail}`}
                              className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              {reservation.providerEmail}
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Boutons d'action pour réservation approuvée */}
                      <div className="flex flex-col sm:flex-row gap-3 mt-4 justify-center">
                        <Button
                          onClick={() => handleContactProvider(reservation)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contacter le prestataire
                        </Button>
                        <Button
                          onClick={() => handleDownloadContract(reservation)}
                          variant="outline"
                          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger le contrat
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Message si rejetée */}
                  {reservation.status === ReservationStatus.Rejected && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 font-semibold text-center">
                        ❌ Réservation Refusée
                      </p>
                      <p className="text-red-700 text-sm text-center mt-2">
                        Le prestataire n'a pas pu accepter votre demande. Vous pouvez chercher d'autres offres disponibles.
                      </p>
                      <div className="flex justify-center mt-4">
                        <Button
                          onClick={() => setView("offersFeed")}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Voir d'autres offres
                        </Button>
                      </div>
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
                      <p className="text-slate-800">{reservation.priceRate} MAD/jour</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">{t('common.total')}</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {reservation.totalCost?.toFixed(2) ?? '0.00'} MAD
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
                    <div className="pt-4 border-t space-y-3">
                      {/* Bouton de confirmation si le prestataire a validé */}
                      {(reservation as any).providerValidated && !(reservation as any).farmerValidated && (
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                          <p className="text-green-800 font-semibold text-center mb-3">
                            🎯 Le prestataire a validé votre réservation !
                          </p>
                          <p className="text-green-700 text-sm text-center mb-4">
                            Confirmez de votre côté pour finaliser la réservation.
                          </p>
                          <div className="flex gap-3 justify-center">
                            <Button
                              onClick={() => handleFarmerFinalValidate(reservation._id)}
                              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            >
                              <FileCheck className="w-4 h-4" />
                              Confirmer la réservation
                            </Button>
                            <Button
                              onClick={() => handleCancelReservation(reservation._id)}
                              variant="outline"
                              className="text-red-700 border-red-300 hover:bg-red-50"
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Attente de validation du prestataire */}
                      {!(reservation as any).providerValidated && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <p className="text-yellow-800 font-medium">
                            ⏳ En attente de la validation du prestataire...
                          </p>
                          <Button
                            onClick={() => handleCancelReservation(reservation._id)}
                            variant="outline"
                            className="mt-3 text-red-700 border-red-300 hover:bg-red-50"
                          >
                            {t('common.cancelReservation')}
                          </Button>
                        </div>
                      )}
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
