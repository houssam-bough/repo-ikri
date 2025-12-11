"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LeafletCSS } from "@/components/LeafletCSS"
import type { Offer, SetAppView } from "@/types"
import { BookingStatus, UserRole } from "@/types"
import { getAllOffers } from "@/services/apiService"
import { TrendingUp, CheckCircle, Clock, MapPin, Calendar, Sparkles, List, Map as MapIcon, Eye, Banknote, Settings, MessageSquare, ShoppingCart } from "lucide-react"
import dynamic from 'next/dynamic'

// Import Leaflet dynamically (client-side only)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface OffersFeedProps {
  setView: SetAppView
}

const OffersFeed: React.FC<OffersFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  
  // View mode: list or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  
  // Filtres
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [selectedMachine, setSelectedMachine] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | BookingStatus>('all')
  const [radiusKm, setRadiusKm] = useState<number>(50)
  
  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  
  // Reservation state (for farmers)
  const [reservationStartDate, setReservationStartDate] = useState('')
  const [reservationEndDate, setReservationEndDate] = useState('')
  const [reservationNotes, setReservationNotes] = useState('')
  const [submittingReservation, setSubmittingReservation] = useState(false)
  
  // Additional filters for farmers
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(10000)
  const [desiredStartDate, setDesiredStartDate] = useState('')
  const [desiredEndDate, setDesiredEndDate] = useState('')

  const isProvider = currentUser?.role === UserRole.Provider || currentUser?.activeMode === 'Provider'
  const isFarmer = currentUser?.role === UserRole.Farmer || currentUser?.activeMode === 'Farmer'

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const allOffers = await getAllOffers()
      // Filter out matched offers for cleaner view
      setOffers(allOffers.filter(o => o.bookingStatus !== BookingStatus.Matched))
    } catch (error) {
      console.error("Failed to fetch offers:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Stats pour encourager la publication
  const stats = useMemo(() => {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const newToday = offers.filter(o => {
      const createdAt = new Date(o.createdAt || new Date())
      return createdAt.toDateString() === today.toDateString()
    })
    
    const weekAvailable = offers.filter(o => {
      const createdAt = new Date(o.createdAt || new Date())
      return o.bookingStatus === BookingStatus.Waiting && createdAt >= weekAgo
    })

    const negotiating = offers.filter(o => o.bookingStatus === BookingStatus.Negotiating)
    
    // Nearby offers (within radiusKm)
    let nearby = 0
    if (currentUser?.location?.coordinates) {
      const [userLon, userLat] = currentUser.location.coordinates
      nearby = offers.filter(o => {
        if (!o.serviceAreaLocation?.coordinates) return false
        const [offerLon, offerLat] = o.serviceAreaLocation.coordinates
        const distance = calculateDistance(userLat, userLon, offerLat, offerLon)
        return distance <= radiusKm
      }).length
    }
    
    return {
      newToday: newToday.length,
      weekAvailable: weekAvailable.length,
      negotiatingCount: negotiating.length,
      nearbyCount: nearby,
      totalCount: offers.length
    }
  }, [offers, currentUser, radiusKm])

  // Extraire les options de filtres
  const cities = useMemo(() => {
    const uniqueCities = new Set(offers.map(o => o.city).filter(Boolean))
    return Array.from(uniqueCities).sort()
  }, [offers])

  const machines = useMemo(() => {
    const uniqueMachines = new Set(offers.map(o => o.machineType).filter(Boolean))
    return Array.from(uniqueMachines).sort()
  }, [offers])

  // Filtrer les offres
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      if (selectedCity !== 'all' && offer.city !== selectedCity) return false
      if (selectedMachine !== 'all' && offer.machineType !== selectedMachine) return false
      if (selectedStatus !== 'all' && offer.bookingStatus !== selectedStatus) return false
      
      // Additional filters for farmers
      if (isFarmer) {
        // Price range filter
        if (offer.priceRate < minPrice || offer.priceRate > maxPrice) return false
        
        // Date availability filter
        if (desiredStartDate && desiredEndDate && offer.availabilitySlots) {
          const desiredStart = new Date(desiredStartDate)
          const desiredEnd = new Date(desiredEndDate)
          
          const hasOverlap = offer.availabilitySlots.some(slot => {
            const slotStart = new Date(slot.startDate)
            const slotEnd = new Date(slot.endDate)
            return slotStart <= desiredEnd && slotEnd >= desiredStart
          })
          
          if (!hasOverlap) return false
        }
      }
      
      return true
    })
  }, [offers, selectedCity, selectedMachine, selectedStatus, isFarmer, minPrice, maxPrice, desiredStartDate, desiredEndDate])

  const getStatusBadge = (status: BookingStatus) => {
    const config = {
      [BookingStatus.Waiting]: { label: 'Disponible', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      [BookingStatus.Negotiating]: { label: 'En négociation', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      [BookingStatus.Matched]: { label: 'Réservé', className: 'bg-slate-100 text-slate-800 border-slate-300' },
    }
    const { label, className } = config[status] || config[BookingStatus.Waiting]
    return <Badge className={className}>{label}</Badge>
  }

  const getMachineLabel = (offer: Offer) => {
    // Use machineType (template name) if available, otherwise fallback to equipmentType
    return offer.machineType || offer.equipmentType || "Machine"
  }

  const handleResetFilters = () => {
    setSelectedCity('all')
    setSelectedMachine('all')
    setSelectedStatus('all')
    if (isFarmer) {
      setMinPrice(0)
      setMaxPrice(10000)
      setDesiredStartDate('')
      setDesiredEndDate('')
    }
  }

  const handleViewDetails = (offer: Offer) => {
    setSelectedOffer(offer)
    setShowDetailsModal(true)
  }
  
  const handleReserve = (offer: Offer) => {
    setSelectedOffer(offer)
    setReservationStartDate('')
    setReservationEndDate('')
    setReservationNotes('')
    setShowReservationModal(true)
  }
  
  const handleContactProvider = (offer: Offer) => {
    // Store the conversation target with provider info
    if (offer.providerId) {
      sessionStorage.setItem('messageTarget', JSON.stringify({
        userId: offer.providerId,
        userName: offer.providerName || 'Prestataire',
        offerId: offer._id
      }))
    }
    setView("messages")
  }
  
  const calculateTotalCost = () => {
    if (!selectedOffer || !reservationStartDate || !reservationEndDate) return 0
    const start = new Date(reservationStartDate)
    const end = new Date(reservationEndDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days * selectedOffer.priceRate
  }
  
  const handleSubmitReservation = async () => {
    if (!selectedOffer || !currentUser) return
    
    if (!reservationStartDate || !reservationEndDate) {
      alert('Veuillez sélectionner les dates de début et de fin')
      return
    }
    
    const start = new Date(reservationStartDate)
    const end = new Date(reservationEndDate)
    
    if (end <= start) {
      alert('La date de fin doit être après la date de début')
      return
    }
    
    // Check if dates overlap with available slots
    const hasOverlap = selectedOffer.availabilitySlots?.some(slot => {
      const slotStart = new Date(slot.startDate)
      const slotEnd = new Date(slot.endDate)
      return slotStart <= end && slotEnd >= start
    })
    
    if (!hasOverlap) {
      alert('Les dates sélectionnées ne correspondent à aucun créneau disponible')
      return
    }
    
    setSubmittingReservation(true)
    try {
      const totalCost = calculateTotalCost()
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: currentUser._id,
          farmerName: currentUser.username || currentUser.email,
          farmerPhone: currentUser.phone || null,
          offerId: selectedOffer._id,
          providerId: selectedOffer.providerId,
          providerName: selectedOffer.providerName,
          equipmentType: selectedOffer.equipmentType,
          priceRate: selectedOffer.priceRate,
          totalCost: totalCost,
          status: 'pending',
          reservedTimeSlot: {
            start: reservationStartDate,
            end: reservationEndDate
          },
          notes: reservationNotes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to create reservation')
      }

      alert('Demande de réservation envoyée avec succès! Le prestataire va la traiter.')
      setShowReservationModal(false)
      setSelectedOffer(null)
      fetchOffers() // Refresh offers
    } catch (error: unknown) {
      console.error('Error submitting reservation:', error)
      if (error instanceof Error) {
        alert(`Erreur: ${error.message}`)
      } else {
        alert('Erreur lors de l\'envoi de la réservation')
      }
    } finally {
      setSubmittingReservation(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 p-8">
      <LeafletCSS />
      <div className="max-w-7xl mx-auto">
        {/* Header avec CTA */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              {isFarmer ? 'Trouvez la Machine Idéale' : 'Découvrez les Machines Disponibles'}
            </h1>
            <p className="text-slate-600">
              {isFarmer 
                ? 'Réservez directement les machines dont vous avez besoin'
                : 'Inspirez-vous des offres disponibles et publiez la vôtre'
              }
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border">
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Liste
              </Button>
              <Button
                onClick={() => setViewMode('map')}
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <MapIcon className="w-4 h-4" />
                Carte
              </Button>
            </div>
            <Button
              onClick={() => setView("dashboard")}
              variant="outline"
              className="px-4 py-2"
            >
              Retour
            </Button>
            {!isFarmer && (
              <Button
                onClick={() => setView("postOffer")}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Publier mon offre
              </Button>
            )}
            {isFarmer && (
              <Button
                onClick={() => setView("postDemand")}
                variant="outline"
                className="px-6 py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Publier une demande
              </Button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-semibold mb-1">Nouvelles</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.newToday}</p>
                  <p className="text-xs text-slate-600 mt-1">aujourd'hui</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-semibold mb-1">À proximité</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.nearbyCount}</p>
                  <p className="text-xs text-slate-600 mt-1">dans {radiusKm}km</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-semibold mb-1">Cette semaine</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.weekAvailable}</p>
                  <p className="text-xs text-slate-600 mt-1">nouvelles offres</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-semibold mb-1">Total</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.totalCount}</p>
                  <p className="text-xs text-slate-600 mt-1">offres publiées</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Filtres</h3>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                Réinitialiser
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ville</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Toutes les villes ({cities.length})</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Machine</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Toutes les machines</option>
                  {machines.map(machine => (
                    <option key={machine} value={machine}>{machine}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Statut</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value={BookingStatus.Waiting}>Disponible</option>
                  <option value={BookingStatus.Negotiating}>En négociation</option>
                </select>
              </div>
            </div>

            {/* Additional filters for farmers */}
            {isFarmer && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Filtres avancés</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Price range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Fourchette de prix (MAD/jour)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        placeholder="Min"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <span className="text-slate-500">-</span>
                      <input
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        placeholder="Max"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Période souhaitée</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={desiredStartDate}
                        onChange={(e) => setDesiredStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <span className="text-slate-500">→</span>
                      <input
                        type="date"
                        value={desiredEndDate}
                        onChange={(e) => setDesiredEndDate(e.target.value)}
                        min={desiredStartDate}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-emerald-700">{filteredOffers.length}</span> offre{filteredOffers.length > 1 ? 's' : ''} trouvée{filteredOffers.length > 1 ? 's' : ''} sur {offers.length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal : Liste ou Carte */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Chargement des offres...</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Aucune offre trouvée
              </h3>
              <p className="text-slate-600 mb-6">
                Aucune offre ne correspond à vos critères. Essayez de modifier les filtres ou soyez le premier à publier !
              </p>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="mr-2"
              >
                Réinitialiser les filtres
              </Button>
              <Button
                onClick={() => setView("postOffer")}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                Publier mon offre
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Vue Carte */}
            {viewMode === 'map' && (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="p-0">
                  <div style={{ height: '600px', width: '100%' }}>
                    {typeof window !== 'undefined' && (
                      <MapContainer
                        center={currentUser?.location?.coordinates ? [currentUser.location.coordinates[1], currentUser.location.coordinates[0]] : [33.5731, -7.5898]} // Casablanca par défaut
                        zoom={currentUser?.location?.coordinates ? 10 : 6}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {/* User location */}
                        {currentUser?.location?.coordinates && (
                          <Marker 
                            position={[currentUser.location.coordinates[1], currentUser.location.coordinates[0]]}
                            icon={typeof window !== 'undefined' ? new (require('leaflet').Icon)({
                              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="32" height="32">
                                  <path d="M12 0C7.802 0 4.403 3.403 4.403 7.602 4.403 11.8 12 24 12 24s7.597-12.2 7.597-16.398C19.597 3.403 16.199 0 12 0zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                                </svg>
                              `),
                              iconSize: [32, 32],
                              iconAnchor: [16, 32],
                              popupAnchor: [0, -32]
                            }) : undefined}
                          >
                            <Popup>
                              <strong className="text-emerald-600">Votre position</strong>
                            </Popup>
                          </Marker>
                        )}

                        {/* Offer markers */}
                        {filteredOffers.map(offer => {
                          if (!offer.serviceAreaLocation?.coordinates) return null
                          const [lon, lat] = offer.serviceAreaLocation.coordinates
                          
                          return (
                            <Marker key={offer._id} position={[lat, lon]}>
                              <Popup>
                                <div className="p-2 min-w-[220px]">
                                  <h4 className="font-bold text-sm mb-1">{getMachineLabel(offer)}</h4>
                                  <div className="space-y-0.5 text-xs mb-2">
                                    <p><strong>Ville:</strong> {offer.city}</p>
                                    <p><strong>Tarif:</strong> {offer.priceRate} MAD/jour</p>
                                    {offer.availabilitySlots && offer.availabilitySlots.length > 0 && (
                                      <p><strong>Disponibilités:</strong> {offer.availabilitySlots.length} créneaux</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewDetails(offer)}
                                      className="text-xs flex-1"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Détails
                                    </Button>
                                    {isFarmer && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleReserve(offer)}
                                        className="text-xs flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                      >
                                        <ShoppingCart className="w-3 h-3 mr-1" />
                                        Réserver
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        })}
                      </MapContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vue Liste */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredOffers.map((offer) => (
                  <Card key={offer._id} className="hover:shadow-lg transition-shadow border-slate-200">
                    <CardContent className="p-0">
                      <div className="flex items-start">
                        {/* Image à gauche */}
                        {offer.photoUrl && (
                          <div className="w-48 h-48 flex-shrink-0 bg-slate-100 rounded-l-lg overflow-hidden flex items-center justify-center">
                            <img 
                              src={offer.photoUrl} 
                              alt={getMachineLabel(offer)} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        
                        {/* Contenu principal */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-slate-800 mb-1">
                                {getMachineLabel(offer)}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {offer.city}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Banknote className="w-4 h-4" />
                                  <span className="font-semibold text-emerald-700">{offer.priceRate} MAD/jour</span>
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(offer.bookingStatus)}
                          </div>

                          {/* Informations en ligne */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {offer.customFields && Object.entries(offer.customFields).slice(0, 3).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-xs text-slate-500 font-semibold uppercase">{key}</span>
                                <p className="text-sm text-slate-800 font-medium">{String(value)}</p>
                              </div>
                            ))}
                          </div>

                          {/* Disponibilités */}
                          {offer.availabilitySlots && offer.availabilitySlots.length > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-blue-700" />
                                <span className="font-semibold text-blue-800 text-sm">{offer.availabilitySlots.length} créneau{offer.availabilitySlots.length > 1 ? 'x' : ''} disponible{offer.availabilitySlots.length > 1 ? 's' : ''}</span>
                              </div>
                              <div className="space-y-1.5 mt-2">
                                {offer.availabilitySlots.slice(0, 2).map((slot, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs text-blue-900">
                                    <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                                      {index + 1}
                                    </span>
                                    <span>
                                      <strong>{new Date(slot.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</strong>
                                      {' → '}
                                      <strong>{new Date(slot.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</strong>
                                    </span>
                                  </div>
                                ))}
                                {offer.availabilitySlots.length > 2 && (
                                  <p className="text-xs text-blue-700 italic">
                                    +{offer.availabilitySlots.length - 2} autre{offer.availabilitySlots.length - 2 > 1 ? 's' : ''} créneau{offer.availabilitySlots.length - 2 > 1 ? 'x' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Boutons d'action */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(offer)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </Button>
                            {isFarmer && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleReserve(offer)}
                                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  Réserver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleContactProvider(offer)}
                                  className="flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Contacter
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA final */}
        {!loading && filteredOffers.length > 0 && (
          <div className="mt-12 text-center">
            <Card className="p-8 bg-gradient-to-r from-emerald-600 to-teal-600 border-none">
              <h3 className="text-2xl font-bold text-white mb-2">
                {isFarmer ? 'Besoin d\'une machine spécifique ?' : 'Vous aussi, publiez votre offre !'}
              </h3>
              <p className="text-emerald-50 mb-6">
                {isFarmer 
                  ? 'Publiez une demande et recevez des propositions de prestataires qualifiés'
                  : `Rejoignez ${stats.totalCount}+ prestataires qui louent leurs machines sur IKRI`
                }
              </p>
              <Button
                onClick={() => setView(isFarmer ? "postDemand" : "postOffer")}
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {isFarmer ? 'Publier une demande' : 'Publier mon offre maintenant'}
              </Button>
            </Card>
          </div>
        )}

        {/* Modal: Détails de l'offre */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'offre</DialogTitle>
            </DialogHeader>
            {selectedOffer && (
              <div className="space-y-4 py-2">
                {selectedOffer.photoUrl && (
                  <div className="w-full h-64 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-slate-200">
                    <img
                      src={selectedOffer.photoUrl}
                      alt={getMachineLabel(selectedOffer)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-bold mb-2">{getMachineLabel(selectedOffer)}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusBadge(selectedOffer.bookingStatus)}
                    {selectedOffer.createdAt && (
                      <span className="text-xs text-slate-500">
                        Publié le {new Date(selectedOffer.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tarif */}
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-800">Tarif journalier</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">{selectedOffer.priceRate} MAD/jour</p>
                </div>

                {/* Localisation */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Localisation</span>
                  </div>
                  <p className="text-blue-900">
                    <strong>{selectedOffer.city}</strong>
                    {selectedOffer.address && ` - ${selectedOffer.address}`}
                  </p>
                </div>

                {/* Caractéristiques techniques */}
                {selectedOffer.customFields && Object.keys(selectedOffer.customFields).length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Caractéristiques techniques</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedOffer.customFields).map(([key, value]) => (
                        <div key={key} className="bg-white p-2 rounded border border-purple-100">
                          <p className="text-xs text-purple-700 font-semibold uppercase">{key}</p>
                          <p className="text-sm text-slate-800 font-medium">{String(value)}</p>
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
                      <span className="text-sm font-semibold text-amber-800">Créneaux de disponibilité</span>
                    </div>
                    <div className="space-y-2">
                      {selectedOffer.availabilitySlots.map((slot, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-amber-100 flex items-center gap-3">
                          <div className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700">
                              Du <strong>{new Date(slot.startDate).toLocaleDateString('fr-FR')}</strong>
                              {' '}au <strong>{new Date(slot.endDate).toLocaleDateString('fr-FR')}</strong>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {Math.ceil((new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Fermer
              </Button>
              {isFarmer && selectedOffer && (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleReserve(selectedOffer)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Réserver cette machine
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Réservation (pour agriculteurs) */}
        <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Réserver cette machine</DialogTitle>
            </DialogHeader>
            {selectedOffer && (
              <div className="space-y-4 py-2">
                {/* Machine info */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-start gap-3">
                    {selectedOffer.photoUrl && (
                      <img 
                        src={selectedOffer.photoUrl} 
                        alt={getMachineLabel(selectedOffer)}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-800">{getMachineLabel(selectedOffer)}</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {selectedOffer.city}
                      </p>
                      <p className="text-sm font-semibold text-emerald-700 mt-1">
                        <Banknote className="w-3 h-3 inline mr-1" />
                        {selectedOffer.priceRate} MAD/jour
                      </p>
                    </div>
                  </div>
                </div>

                {/* Créneaux disponibles */}
                {selectedOffer.availabilitySlots && selectedOffer.availabilitySlots.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Créneaux disponibles
                    </h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedOffer.availabilitySlots.map((slot, index) => (
                        <div key={index} className="text-xs text-blue-900 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                            {index + 1}
                          </span>
                          <span>
                            <strong>{new Date(slot.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            {' → '}
                            <strong>{new Date(slot.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date selection */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Date de début <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={reservationStartDate}
                      onChange={(e) => setReservationStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Date de fin <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={reservationEndDate}
                      onChange={(e) => setReservationEndDate(e.target.value)}
                      min={reservationStartDate}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  {/* Total cost calculation */}
                  {reservationStartDate && reservationEndDate && (
                    <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-emerald-800 font-semibold">Coût total estimé</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {Math.ceil((new Date(reservationEndDate).getTime() - new Date(reservationStartDate).getTime()) / (1000 * 60 * 60 * 24))} jour(s) × {selectedOffer.priceRate} MAD
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">{calculateTotalCost()} MAD</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Notes / Informations complémentaires</label>
                  <textarea
                    value={reservationNotes}
                    onChange={(e) => setReservationNotes(e.target.value)}
                    placeholder="Précisez vos besoins, questions ou contraintes particulières..."
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Info box */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    ℹ️ <strong>Information :</strong> Votre demande de réservation sera envoyée au prestataire qui pourra l'accepter ou la refuser. 
                    Vous serez notifié de sa décision et pourrez discuter des détails via la messagerie.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReservationModal(false)}
                disabled={submittingReservation}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitReservation}
                disabled={submittingReservation || !reservationStartDate || !reservationEndDate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingReservation ? 'Envoi en cours...' : 'Envoyer la demande de réservation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default OffersFeed
