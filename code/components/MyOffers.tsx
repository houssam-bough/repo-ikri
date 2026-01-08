"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Offer, SetAppView, Reservation } from "@/types"
import { BookingStatus, ReservationStatus } from "@/types"
import { 
  getAllOffers, 
  deleteOffer, 
  updateOffer, 
  getReservationsForOffer,
  approveReservation,
  rejectReservation,
  providerValidateReservation,
  startConversation 
} from "@/services/apiService"
import { Edit, Trash2, Eye, CheckCircle, XCircle, Download, MapPin, Calendar, Banknote, MessageCircle, Phone, Mail, FileCheck } from "lucide-react"
import { SERVICE_TYPES } from "@/constants/serviceTypes"

interface MyOffersProps {
  setView: SetAppView
}

const MyOffers: React.FC<MyOffersProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookingStatus>('all')
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  
  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<Offer>>({})
  const [editCustomFields, setEditCustomFields] = useState<Record<string, any>>({})
  const [editAvailabilitySlots, setEditAvailabilitySlots] = useState<Array<{ startDate: string; endDate: string }>>([])
  const [editPhotoPreview, setEditPhotoPreview] = useState<string>('')

  const fetchMyOffers = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const allOffers = await getAllOffers()
      const myOffers = allOffers.filter(offer => offer.providerId === currentUser._id)
      setOffers(myOffers)
    } catch (error) {
      console.error("Failed to fetch my offers:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  const fetchReservations = async (offerId: string) => {
    setLoadingReservations(true)
    try {
      const fetchedReservations = await getReservationsForOffer(offerId)
      setReservations(fetchedReservations)
    } catch (error) {
      console.error("Failed to fetch reservations:", error)
    } finally {
      setLoadingReservations(false)
    }
  }

  const handleApproveReservation = async (reservationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir accepter cette réservation ? L'agriculteur devra ensuite confirmer de son côté.")) {
      return
    }

    try {
      const updated = await providerValidateReservation(reservationId, currentUser?._id || '')
      if (updated) {
        // Refresh offers and reservations
        await fetchMyOffers()
        if (selectedOffer) {
          await fetchReservations(selectedOffer._id)
        }
        alert("Vous avez validé la réservation ! L'agriculteur doit maintenant confirmer de son côté.")
      } else {
        alert("Erreur lors de la validation de la réservation")
      }
    } catch (error) {
      console.error("Failed to validate reservation:", error)
      alert("Erreur lors de la validation de la réservation")
    }
  }

  const handleRejectReservation = async (reservationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir refuser cette réservation ?")) {
      return
    }

    try {
      const updated = await rejectReservation(reservationId)
      if (updated) {
        // Refresh reservations
        if (selectedOffer) {
          await fetchReservations(selectedOffer._id)
        }
        alert("Réservation refusée")
      } else {
        alert("Erreur lors du rejet de la réservation")
      }
    } catch (error) {
      console.error("Failed to reject reservation:", error)
      alert("Erreur lors du rejet de la réservation")
    }
  }

  useEffect(() => {
    fetchMyOffers()
  }, [fetchMyOffers])

  const filteredOffers = selectedStatus === 'all' 
    ? offers 
    : offers.filter(o => o.bookingStatus === selectedStatus)

  const getStatusBadge = (status: BookingStatus) => {
    const config = {
      [BookingStatus.Waiting]: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      [BookingStatus.Negotiating]: { label: 'En négociation', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      [BookingStatus.Matched]: { label: 'Réservé', className: 'bg-green-100 text-green-800 border-green-300' },
    }
    const { label, className } = config[status] || config[BookingStatus.Waiting]
    return <Badge className={className}>{label}</Badge>
  }

  const getMachineLabel = (type: string | undefined) => {
    if (!type) return "Non spécifié"
    const machine = SERVICE_TYPES.find((m: any) => m.id === type)
    return machine ? machine.name : type
  }

  const getTimeAgo = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diffInMs = now.getTime() - d.getTime()
    
    if (diffInMs < 0) return "À l'instant"
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) {
      return "À l'instant"
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
    } else {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
    }
  }

  const handleDelete = async () => {
    if (!selectedOffer) return
    try {
      const success = await deleteOffer(selectedOffer._id)
      if (success) {
        setOffers(offers.filter(o => o._id !== selectedOffer._id))
        setShowDeleteConfirm(false)
        setSelectedOffer(null)
        alert("Offre supprimée avec succès")
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Failed to delete offer:", error)
      alert("Erreur lors de la suppression de l'offre")
    }
  }

  const handleEditClick = (offer: Offer) => {
    setSelectedOffer(offer)
    setEditForm({
      equipmentType: offer.equipmentType,
      description: offer.description,
      priceRate: offer.priceRate,
      city: offer.city,
      address: offer.address,
      photoUrl: offer.photoUrl
    })
    setEditCustomFields(offer.customFields || {})
    setEditAvailabilitySlots(offer.availabilitySlots || [{ startDate: '', endDate: '' }])
    setEditPhotoPreview(offer.photoUrl || '')
    setShowEditModal(true)
  }

  const handleAddEditSlot = () => {
    setEditAvailabilitySlots([...editAvailabilitySlots, { startDate: '', endDate: '' }])
  }

  const handleRemoveEditSlot = (index: number) => {
    if (editAvailabilitySlots.length > 1) {
      setEditAvailabilitySlots(editAvailabilitySlots.filter((_, i) => i !== index))
    }
  }

  const handleEditSlotChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const updated = [...editAvailabilitySlots]
    updated[index][field] = value
    setEditAvailabilitySlots(updated)
  }

  const handleUpdate = async () => {
    if (!selectedOffer || !selectedOffer._id) return
    
    // Validation des slots
    for (const slot of editAvailabilitySlots) {
      if (!slot.startDate || !slot.endDate) {
        alert("Veuillez remplir toutes les dates de disponibilité")
        return
      }
      if (new Date(slot.endDate) <= new Date(slot.startDate)) {
        alert("La date de fin doit être après la date de début")
        return
      }
    }
    
    try {
      const updates = {
        ...editForm,
        customFields: editCustomFields,
        availabilitySlots: editAvailabilitySlots
      }
      
      const updated = await updateOffer(selectedOffer._id, updates)
      if (updated) {
        setOffers(offers.map(o => o._id === updated._id ? updated : o))
        setShowEditModal(false)
        setSelectedOffer(null)
        alert("Offre mise à jour avec succès")
      } else {
        alert("Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Failed to update offer:", error)
      alert("Erreur lors de la mise à jour")
    }
  }

  const handleOpenDetails = (offer: Offer) => {
    setSelectedOffer(offer)
    if (offer.bookingStatus === BookingStatus.Negotiating || offer.bookingStatus === BookingStatus.Matched) {
      fetchReservations(offer._id)
    }
    setShowDetailsModal(true)
  }

  // Download contract PDF for a specific reservation
  const handleDownloadReservationContract = async (reservation: Reservation) => {
    try {
      const response = await fetch(`/api/reservations/${reservation._id}/contract`)
      if (!response.ok) {
        throw new Error('Failed to generate contract')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Contrat_Location_YKRI_${reservation._id.substring(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading contract:', error)
      alert('Erreur lors du téléchargement du contrat')
    }
  }

  // Contact farmer from a reservation
  const handleContactFarmer = async (reservation: Reservation) => {
    if (!currentUser) return
    try {
      await startConversation(
        currentUser._id,
        currentUser.name,
        reservation.farmerId,
        reservation.farmerName,
        `Bonjour ${reservation.farmerName}, je vous contacte au sujet de votre réservation pour ${reservation.equipmentType}.`
      )
      setShowDetailsModal(false)
      setView('messages')
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Erreur lors de l\'ouverture de la messagerie')
    }
  }

  if (loading) {
    return (
      <div className="bg-linear-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">Chargement de vos offres...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-linear-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Mes Offres</h1>
            <p className="text-slate-600 mt-2">
              {offers.length} offre{offers.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <Button onClick={() => setView("dashboard")} variant="outline">
            Retour au tableau de bord
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Button
            onClick={() => setSelectedStatus('all')}
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            className={selectedStatus === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            Tout ({offers.length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(BookingStatus.Waiting)}
            variant={selectedStatus === BookingStatus.Waiting ? 'default' : 'outline'}
            className={selectedStatus === BookingStatus.Waiting ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            En attente ({offers.filter(o => o.bookingStatus === BookingStatus.Waiting).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(BookingStatus.Negotiating)}
            variant={selectedStatus === BookingStatus.Negotiating ? 'default' : 'outline'}
            className={selectedStatus === BookingStatus.Negotiating ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            En négociation ({offers.filter(o => o.bookingStatus === BookingStatus.Negotiating).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(BookingStatus.Matched)}
            variant={selectedStatus === BookingStatus.Matched ? 'default' : 'outline'}
            className={selectedStatus === BookingStatus.Matched ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Réservé ({offers.filter(o => o.bookingStatus === BookingStatus.Matched).length})
          </Button>
        </div>

        {/* Liste des offres */}
        {filteredOffers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-600">
                {selectedStatus === 'all' 
                  ? "Vous n'avez pas encore créé d'offres."
                  : "Aucune offre avec ce statut."}
              </p>
              <Button
                onClick={() => setView("postOffer")}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Créer une offre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {getMachineLabel(offer.equipmentType)}
                      </CardTitle>
                      <div className="flex gap-2 items-center flex-wrap mb-3">
                        {getStatusBadge(offer.bookingStatus)}
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {offer.city || 'Localisation non spécifiée'}
                        </span>
                        <span className="text-sm text-slate-400">
                          {getTimeAgo(offer.createdAt || new Date())}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold text-slate-700">Tarif:</span>
                          <span className="text-emerald-600 font-bold">{offer.priceRate} MAD/jour</span>
                        </div>
                        
                        {offer.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                            <span className="text-slate-600">{offer.address}</span>
                          </div>
                        )}
                        
                        {offer.availabilitySlots && offer.availabilitySlots.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-slate-600">
                              {offer.availabilitySlots.length} période{offer.availabilitySlots.length > 1 ? 's' : ''} disponible{offer.availabilitySlots.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        
                        {offer.description && (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2 italic">
                            {offer.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Actions selon le statut */}
                  <div className="flex justify-end gap-2 mt-4 flex-wrap border-t pt-4">
                    {/* En attente - Modifier, Supprimer, Voir détails */}
                    {offer.bookingStatus === BookingStatus.Waiting && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetails(offer)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(offer)}
                          className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOffer(offer)
                            setShowDeleteConfirm(true)
                          }}
                          className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </Button>
                      </>
                    )}

                    {/* En négociation - Voir réservations */}
                    {offer.bookingStatus === BookingStatus.Negotiating && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDetails(offer)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        Voir les réservations
                      </Button>
                    )}

                    {/* Réservé - Voir réservation acceptée (le contrat est téléchargeable dans les détails) */}
                    {offer.bookingStatus === BookingStatus.Matched && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDetails(offer)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="w-4 h-4" />
                        Voir la réservation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de détails */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800">Détails de l'offre</DialogTitle>
            </DialogHeader>
            {selectedOffer && (
              <div className="space-y-6">
                {/* Header avec titre et statut */}
                <div className="flex items-start justify-between pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{getMachineLabel(selectedOffer.equipmentType)}</h3>
                    {getStatusBadge(selectedOffer.bookingStatus)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Publié</p>
                    <p className="text-sm font-medium text-slate-700">{getTimeAgo(selectedOffer.createdAt || new Date())}</p>
                  </div>
                </div>

                {/* Photo */}
                {selectedOffer.photoUrl && (
                  <div className="w-full h-80 overflow-hidden rounded-xl border-2 border-slate-200">
                    <img
                      src={selectedOffer.photoUrl}
                      alt={selectedOffer.equipmentType}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Informations principales */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Tarif */}
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">Tarif journalier</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{selectedOffer.priceRate} MAD</p>
                    <p className="text-xs text-emerald-600 mt-1">par jour de location</p>
                  </div>

                  {/* Localisation */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <Label className="text-sm font-semibold text-blue-900">Localisation</Label>
                    </div>
                    <p className="text-lg font-semibold text-blue-800">{selectedOffer.city}</p>
                    {selectedOffer.address && (
                      <p className="text-sm text-blue-600 mt-1">{selectedOffer.address}</p>
                    )}
                  </div>
                </div>

                {/* Custom Fields */}
                {selectedOffer.customFields && Object.keys(selectedOffer.customFields).length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <Label className="text-sm font-semibold text-purple-900 mb-3 block">Caractéristiques techniques</Label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(selectedOffer.customFields).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded border border-purple-100">
                          <p className="text-xs font-medium text-purple-700 uppercase mb-1">{key}</p>
                          <p className="text-sm font-semibold text-slate-800">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disponibilités */}
                {selectedOffer.availabilitySlots && selectedOffer.availabilitySlots.length > 0 && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      <Label className="text-sm font-semibold text-amber-900">Périodes de disponibilité</Label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedOffer.availabilitySlots.map((slot: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-amber-100 flex items-center gap-3">
                          <div className="shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-amber-700 font-bold text-sm">{idx + 1}</span>
                          </div>
                          <div>
                            <p className="text-xs text-amber-700 font-medium">Du</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {new Date(slot.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-amber-700 font-medium mt-1">Au</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {new Date(slot.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section réservations pour Negotiating et Matched */}
                {(selectedOffer.bookingStatus === BookingStatus.Negotiating || 
                  selectedOffer.bookingStatus === BookingStatus.Matched) && (
                  <div className="border-t-2 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-2 h-2 rounded-full ${selectedOffer.bookingStatus === BookingStatus.Matched ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {selectedOffer.bookingStatus === BookingStatus.Matched 
                          ? "🎉 Réservation acceptée" 
                          : "📋 Réservations en attente"}
                      </h3>
                    </div>
                    
                    {loadingReservations ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-500 mt-2 text-sm">Chargement des réservations...</p>
                      </div>
                    ) : reservations.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-lg">
                        <p className="text-slate-500">Aucune réservation trouvée</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reservations
                          .filter(res => selectedOffer.bookingStatus === BookingStatus.Matched 
                            ? res.status === ReservationStatus.Approved 
                            : res.status === ReservationStatus.Pending)
                          .map((reservation) => (
                          <Card key={reservation._id} className="border-2">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-slate-800">{reservation.farmerName}</h4>
                                  {reservation.farmerPhone && (
                                    <p className="text-sm text-slate-500">{reservation.farmerPhone}</p>
                                  )}
                                </div>
                                <Badge className={
                                  reservation.status === ReservationStatus.Approved 
                                    ? "bg-green-100 text-green-800" 
                                    : (reservation as any).providerValidated
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }>
                                  {reservation.status === ReservationStatus.Approved 
                                    ? "Acceptée ✅" 
                                    : (reservation as any).providerValidated
                                    ? "⏳ Attente confirmation agriculteur"
                                    : "En attente"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="font-semibold text-slate-700">Période:</span>
                                  <p className="text-slate-600">
                                    {new Date(reservation.reservedTimeSlot.start).toLocaleDateString()} - {new Date(reservation.reservedTimeSlot.end).toLocaleDateString()}
                                  </p>
                                </div>
                                {reservation.totalCost && (
                                  <div>
                                    <span className="font-semibold text-slate-700">Coût total:</span>
                                    <p className="text-slate-600">{reservation.totalCost} MAD</p>
                                  </div>
                                )}
                              </div>

                              {/* Boutons d'action pour réservations pending */}
                              {reservation.status === ReservationStatus.Pending && !(reservation as any).providerValidated && (
                                <div className="flex gap-2 mt-4 pt-3 border-t">
                                  <Button
                                    onClick={() => handleApproveReservation(reservation._id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                                  >
                                    <FileCheck className="w-4 h-4" />
                                    Valider la réservation
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectReservation(reservation._id)}
                                    variant="outline"
                                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50 flex items-center justify-center gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Refuser
                                  </Button>
                                </div>
                              )}

                              {/* Attente de confirmation de l'agriculteur */}
                              {reservation.status === ReservationStatus.Pending && (reservation as any).providerValidated && (
                                <div className="mt-4 pt-3 border-t">
                                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-center">
                                    <p className="text-sm text-purple-700 font-medium">
                                      ✅ Vous avez validé cette réservation. En attente de la confirmation de l'agriculteur...
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Boutons d'action pour réservations approuvées */}
                              {reservation.status === ReservationStatus.Approved && (
                                <div className="mt-4 pt-3 border-t space-y-3">
                                  {/* Coordonnées du client */}
                                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                    <p className="text-sm font-semibold text-green-800 mb-2">📞 Coordonnées du client</p>
                                    <div className="flex flex-col gap-1">
                                      {reservation.farmerPhone && (
                                        <a 
                                          href={`tel:${reservation.farmerPhone}`}
                                          className="flex items-center gap-2 text-green-700 hover:text-green-800 text-sm"
                                        >
                                          <Phone className="w-4 h-4" />
                                          {reservation.farmerPhone}
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Boutons */}
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                      onClick={() => handleContactFarmer(reservation)}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      Contacter le client
                                    </Button>
                                    <Button
                                      onClick={() => handleDownloadReservationContract(reservation)}
                                      variant="outline"
                                      className="flex-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      Télécharger le contrat
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal d'édition */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800">
                ✏️ Modifier l'offre
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Type de machine (non modifiable - affiché seulement) */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                  Type de machine
                </Label>
                <p className="text-lg font-bold text-blue-800">{getMachineLabel(editForm.equipmentType)}</p>
                <p className="text-xs text-blue-600 mt-1">Le type de machine ne peut pas être modifié</p>
              </div>

              {/* Caractéristiques techniques */}
              {editCustomFields && Object.keys(editCustomFields).length > 0 && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-4">
                  <h4 className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                    🔧 Caractéristiques techniques
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(editCustomFields).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={`custom-${key}`} className="text-sm font-medium text-slate-700 capitalize">
                          {key}
                        </Label>
                        <Input
                          id={`custom-${key}`}
                          value={String(value)}
                          onChange={(e) => setEditCustomFields({ ...editCustomFields, [key]: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarif journalier */}
              <div>
                <Label htmlFor="priceRate" className="text-sm font-medium text-slate-700">
                  💰 Tarif journalier (MAD) <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="priceRate"
                    type="number"
                    value={editForm.priceRate || ''}
                    onChange={(e) => setEditForm({ ...editForm, priceRate: parseFloat(e.target.value) })}
                    placeholder="Ex: 1500"
                    required
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">
                    MAD/jour
                  </span>
                </div>
              </div>

              {/* Localisation */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
                <h4 className="font-semibold text-purple-800 text-sm flex items-center gap-2">
                  📍 Localisation
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                      Ville <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Ex: Casablanca"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                      Adresse précise <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Ex: Zone Industrielle Sidi Bernoussi"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Périodes de disponibilité */}
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                      📅 Périodes de disponibilité
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Définissez les dates où votre machine est disponible à la location
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddEditSlot}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    + Ajouter une période
                  </Button>
                </div>

                <div className="space-y-3">
                  {editAvailabilitySlots.map((slot, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-sm">{index + 1}</span>
                        </div>
                        <h5 className="font-semibold text-slate-800">Période {index + 1}</h5>
                        {editAvailabilitySlots.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => handleRemoveEditSlot(index)}
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ✕ Supprimer
                          </Button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`start-${index}`} className="text-sm font-medium text-slate-700">
                            Date de début
                          </Label>
                          <Input
                            id={`start-${index}`}
                            type="date"
                            value={slot.startDate}
                            onChange={(e) => handleEditSlotChange(index, 'startDate', e.target.value)}
                            required
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`end-${index}`} className="text-sm font-medium text-slate-700">
                            Date de fin
                          </Label>
                          <Input
                            id={`end-${index}`}
                            type="date"
                            value={slot.endDate}
                            onChange={(e) => handleEditSlotChange(index, 'endDate', e.target.value)}
                            required
                            min={slot.startDate}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {slot.startDate && slot.endDate && new Date(slot.endDate) > new Date(slot.startDate) && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                          ✓ Durée: {Math.ceil((new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {editAvailabilitySlots.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p>Aucune période de disponibilité définie</p>
                    <p className="text-sm mt-1">Cliquez sur "Ajouter une période" pour commencer</p>
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-2xl shrink-0">ℹ️</span>
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Gestion des réservations</p>
                    <p>
                      Les agriculteurs pourront voir vos disponibilités et faire des demandes de réservation. 
                      Vous recevrez une notification pour chaque demande et pourrez l'accepter ou la refuser.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                className="min-w-[120px]"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdate} 
                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
              >
                💾 Enregistrer les modifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              Êtes-vous sûr de vouloir supprimer cette offre ? Cette action est irréversible.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MyOffers
