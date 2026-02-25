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

  useEffect(() => {
    if (!isProvider) return
    setShowDetailsModal(false)
    setShowReservationModal(false)
    setSelectedOffer(null)
    setReservationStartDate('')
    setReservationEndDate('')
    setReservationNotes('')
  }, [isProvider])

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const allOffers = await getAllOffers()
      
      // ALWAYS exclude own offers (hybrid accounts can switch modes)
      const filteredOffers = allOffers.filter(o => 
        o.providerId !== currentUser?._id && 
        o.bookingStatus !== BookingStatus.Matched
      )
      setOffers(filteredOffers)
    } catch (error) {
      console.error("Failed to fetch offers:", error)
    } finally {
      setLoading(false)
    }
  }, [isProvider, currentUser?._id])

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  // Auto-select machine filter from category navigation
  useEffect(() => {
    if (offers.length === 0) return
    const categoryFilter = sessionStorage.getItem('categoryFilter')
    if (!categoryFilter) return
    sessionStorage.removeItem('categoryFilter')
    const uniqueMachines = Array.from(new Set(offers.map(o => o.machineType).filter(Boolean)))
    const match = uniqueMachines.find(m => m.toLowerCase().includes(categoryFilter.toLowerCase()))
    if (match) {
      setSelectedMachine(match)
    }
  }, [offers])

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
      [BookingStatus.Waiting]: { label: t('offersFeed.available'), className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      [BookingStatus.Negotiating]: { label: t('offersFeed.negotiating'), className: 'bg-blue-100 text-blue-800 border-blue-300' },
      [BookingStatus.Matched]: { label: t('offersFeed.reserved'), className: 'bg-slate-100 text-slate-800 border-slate-300' },
    }
    const { label, className } = config[status] || config[BookingStatus.Waiting]
    return <Badge className={className}>{label}</Badge>
  }

  const getMachineLabel = (offer: Offer) => {
    // Use machineType (template name) if available, otherwise fallback to equipmentType
    return offer.machineType || offer.equipmentType || t('offersFeed.machine')
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
        userName: offer.providerName || t('offersFeed.provider'),
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
      alert(t('offersFeed.selectDatesAlert'))
      return
    }
    
    const start = new Date(reservationStartDate)
    const end = new Date(reservationEndDate)
    
    if (end <= start) {
      alert(t('offersFeed.endAfterStartAlert'))
      return
    }
    
    // VALIDATION CRITIQUE : Le créneau demandé doit être ENTIÈREMENT inclus dans un créneau disponible
    const isWithinAvailableSlot = selectedOffer.availabilitySlots?.some(slot => {
      const slotStart = new Date(slot.startDate)
      const slotEnd = new Date(slot.endDate)
      // Le créneau demandé doit commencer après (ou égal) le début du slot
      // ET finir avant (ou égal) la fin du slot
      return start >= slotStart && end <= slotEnd
    })
    
    if (!isWithinAvailableSlot) {
      alert(t('offersFeed.datesNotAvailableAlert'))
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
          farmerName: currentUser.name || currentUser.email,
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

      alert(t('offersFeed.reservationSentSuccess'))
      setShowReservationModal(false)
      setSelectedOffer(null)
      fetchOffers() // Refresh offers
    } catch (error: unknown) {
      console.error('Error submitting reservation:', error)
      if (error instanceof Error) {
        alert(`${t('offersFeed.errorPrefix')} ${error.message}`)
      } else {
        alert(t('offersFeed.reservationError'))
      }
    } finally {
      setSubmittingReservation(false)
    }
  }

  return (
    <div className="bg-white p-4 md:p-8">
      <LeafletCSS />
      <div className="max-w-7xl mx-auto">
        
        {/* VERSION PRESTATAIRE: Simple et inspirante */}
        {isProvider ? (
          <>
            {/* Header simple pour prestataire */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-4xl font-bold text-[#4C9A2A] font-heading">
                  {t('offersFeed.providerTitle')}
                </h1>
                <p className="text-[#555] text-sm md:text-base font-body">
                  {t('offersFeed.providerSubtitle')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button
                  onClick={() => setView("dashboard")}
                  variant="outline"
                  className="px-4 py-2"
                >
                  {t('offersFeed.back')}
                </Button>
                <Button
                  onClick={() => setView("postOffer")}
                  className="px-6 py-3 bg-[#4C9A2A] hover:bg-[#3d8422] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-body"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('offersFeed.publishMyOffer')}
                </Button>
              </div>
            </div>

            {/* Liste simple sans filtres pour prestataire */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4C9A2A] border-t-transparent"></div>
                <p className="mt-4 text-[#555] font-body">{t('offersFeed.loading')}</p>
              </div>
            ) : offers.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-[#4C9A2A]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#4C9A2A] mb-2 font-heading">
                    {t('offersFeed.beFirst')}
                  </h3>
                  <p className="text-[#555] mb-6 font-body">
                    {t('offersFeed.beFirstDesc')}
                  </p>
                  <Button
                    onClick={() => setView("postOffer")}
                    className="bg-[#4C9A2A] hover:bg-[#3d8422] font-body"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('offersFeed.publishMyOffer')}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  <span className="font-semibold text-emerald-700">{offers.length}</span> {t('offersFeed.offersCount')}
                </p>
                
                {offers.map((offer) => {
                  const sortedSlots = (offer.availabilitySlots || [])
                    .map((slot) => ({
                      start: new Date(slot.startDate),
                      end: new Date(slot.endDate),
                    }))
                    .filter((slot) => !Number.isNaN(slot.start.getTime()) && !Number.isNaN(slot.end.getTime()))
                    .sort((a, b) => a.start.getTime() - b.start.getTime())

                  const primarySlot = sortedSlots[0]
                  const machineLabel = (getMachineLabel(offer) || '').trim()
                  const title = machineLabel || (offer.equipmentType || '').trim() || t('offersFeed.machine')

                  const customFieldEntries = offer.customFields
                    ? Object.entries(offer.customFields)
                        .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
                        .slice(0, 2)
                    : []

                  return (
                    <Card key={offer._id} className="hover:shadow-lg transition-shadow border-slate-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-start">
                          {/* Image à gauche */}
                          <div className="w-full md:w-48 h-52 md:h-48 flex-shrink-0 bg-slate-100 md:rounded-l-lg overflow-hidden flex items-center justify-center">
                            {offer.photoUrl ? (
                              <img
                                src={offer.photoUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center">
                                <Settings className="w-10 h-10 text-emerald-600" />
                              </div>
                            )}
                          </div>

                          {/* Contenu principal */}
                          <div className="flex-1 p-4 md:p-6">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1">{title}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {offer.city}
                                  </div>
                                  {primarySlot && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span className="text-xs">
                                        {primarySlot.start.toLocaleDateString('fr-FR')} - {primarySlot.end.toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {getStatusBadge(offer.bookingStatus)}
                            </div>

                            {/* Informations en ligne */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase">{t('offersFeed.prestation')}</span>
                                <p className="text-sm text-slate-800 font-medium">{offer.equipmentType || '—'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase">{t('offersFeed.machine')}</span>
                                <p className="text-sm text-slate-800 font-medium">{getMachineLabel(offer)}</p>
                              </div>
                              {customFieldEntries.map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-xs text-slate-500 font-semibold uppercase">{key}</span>
                                  <p className="text-sm text-slate-800 font-medium">{String(value)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                {/* CTA encourageant */}
                <Card className="p-8 bg-[#4C9A2A] border-none mt-8">
                  <div className="text-center text-white">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-90" />
                    <h3 className="text-2xl font-bold mb-2 font-heading">{t('offersFeed.readyToPublish')}</h3>
                    <p className="text-white/80 mb-6 font-body">
                      {t('offersFeed.joinProviders').replace('{count}', String(offers.length))}
                    </p>
                    <Button
                      onClick={() => setView("postOffer")}
                      size="lg"
                      className="bg-white text-[#4C9A2A] hover:bg-green-50 font-semibold shadow-lg font-body"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t('offersFeed.publishMyOfferNow')}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            {/* VERSION AGRICULTEUR: Complète avec filtres et actions */}
            {/* Header avec options de vue */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-4xl font-bold text-[#4C9A2A] font-heading">
                  {t('offersFeed.farmerTitle')}
                </h1>
                <p className="text-[#555] text-sm md:text-base font-body">
                  {t('offersFeed.farmerSubtitle')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border w-full sm:w-auto">
                  <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <List className="w-4 h-4" />
                    {t('offersFeed.listView')}
                  </Button>
                  <Button
                    onClick={() => setViewMode('map')}
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <MapIcon className="w-4 h-4" />
                    {t('offersFeed.mapView')}
                  </Button>
                </div>
                <Button
                  onClick={() => setView("dashboard")}
                  variant="outline"
                  className="px-4 py-2"
                >
                  {t('offersFeed.back')}
                </Button>
                <Button
                  onClick={() => setView("postDemand")}
                  variant="outline"
                  className="px-6 py-3 border-2 border-[#4C9A2A] text-[#4C9A2A] hover:bg-green-50 font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 font-body"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('offersFeed.publishDemand')}
                </Button>
              </div>
            </div>

            {/* Filtres pour agriculteurs */}
            <Card className="mb-6 border-slate-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#4C9A2A] font-heading">{t('offersFeed.filters')}</h3>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                {t('offersFeed.reset')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('offersFeed.city')}</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">{t('offersFeed.allCities')} ({cities.length})</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('offersFeed.machine')}</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">{t('offersFeed.allMachines')}</option>
                  {machines.map(machine => (
                    <option key={machine} value={machine}>{machine}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('offersFeed.status')}</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">{t('offersFeed.allStatuses')}</option>
                  <option value={BookingStatus.Waiting}>{t('offersFeed.available')}</option>
                  <option value={BookingStatus.Negotiating}>{t('offersFeed.negotiating')}</option>
                </select>
              </div>
            </div>

            {/* Additional filters for farmers */}
            {isFarmer && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('offersFeed.advancedFilters')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Price range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{t('offersFeed.priceRange')}</label>
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
                    <label className="text-sm font-medium text-slate-700">{t('offersFeed.desiredPeriod')}</label>
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
                <span className="font-semibold text-[#4C9A2A]">{filteredOffers.length}</span> {t('offersFeed.offersFoundOn')} {offers.length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal : Liste ou Carte */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4C9A2A] border-t-transparent"></div>
            <p className="mt-4 text-[#555] font-body">{t('offersFeed.loading')}</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t('offersFeed.noOffersFound')}
              </h3>
              <p className="text-slate-600 mb-6">
                {t('offersFeed.noOffersFoundDesc')}
              </p>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="mr-2"
              >
                {t('offersFeed.resetFilters')}
              </Button>
              <Button
                onClick={() => setView("postOffer")}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {t('offersFeed.publishMyOffer')}
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
                              <strong className="text-emerald-600">{t('offersFeed.yourPosition')}</strong>
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
                                    <p><strong>{t('offersFeed.cityLabel')}</strong> {offer.city}</p>
                                    <p><strong>{t('offersFeed.rateLabel')}</strong> {offer.priceRate} {t('offersFeed.madPerDay')}</p>
                                    {offer.availabilitySlots && offer.availabilitySlots.length > 0 && (
                                      <p><strong>{t('offersFeed.availabilitiesLabel')}</strong> {offer.availabilitySlots.length} {t('offersFeed.slots')}</p>
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
                                      {t('offersFeed.details')}
                                    </Button>
                                    {isFarmer && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleReserve(offer)}
                                        className="text-xs flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                      >
                                        <ShoppingCart className="w-3 h-3 mr-1" />
                                        {t('offersFeed.reserve')}
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
                  <Card key={offer._id} className="hover:shadow-lg transition-shadow border-slate-200 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-start">
                        {/* Image à gauche */}
                        {offer.photoUrl && (
                          <div className="w-full md:w-48 h-52 md:h-48 flex-shrink-0 bg-slate-100 md:rounded-l-lg overflow-hidden flex items-center justify-center">
                            <img 
                              src={offer.photoUrl} 
                              alt={getMachineLabel(offer)} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Contenu principal */}
                        <div className="flex-1 p-4 md:p-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1">
                                {getMachineLabel(offer)}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {offer.city}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Banknote className="w-4 h-4" />
                                  <span className="font-semibold text-emerald-700">{offer.priceRate} {t('offersFeed.madPerDay')}</span>
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(offer.bookingStatus)}
                          </div>

                          {/* Informations en ligne */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                                <span className="font-semibold text-blue-800 text-sm">{offer.availabilitySlots.length} {t('offersFeed.slotsAvailable')}</span>
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
                                    +{offer.availabilitySlots.length - 2} {t('offersFeed.otherSlots')}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Boutons d'action */}
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(offer)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              {t('offersFeed.viewDetails')}
                            </Button>
                            {isFarmer && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleReserve(offer)}
                                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  {t('offersFeed.reserve')}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleContactProvider(offer)}
                                  className="flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  {t('offersFeed.contact')}
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
        {isFarmer && !loading && filteredOffers.length > 0 && (
          <div className="mt-12 text-center">
            <Card className="p-8 bg-gradient-to-r from-emerald-600 to-teal-600 border-none">
              <h3 className="text-2xl font-bold text-white mb-2">
                {t('offersFeed.needSpecificMachine')}
              </h3>
              <p className="text-emerald-50 mb-6">
                {t('offersFeed.needSpecificMachineDesc')}
              </p>
              <Button
                onClick={() => setView("postDemand")}
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('offersFeed.publishDemand')}
              </Button>
            </Card>
          </div>
        )}
          </>
        )}

        {isFarmer && (
          <>
            {/* Modal: Détails de l'offre */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
              <DialogContent className="w-[92vw] sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('offersFeed.offerDetails')}</DialogTitle>
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
                            {t('offersFeed.publishedOn')} {new Date(selectedOffer.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tarif */}
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">{t('offersFeed.dailyRate')}</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{selectedOffer.priceRate} {t('offersFeed.madPerDay')}</p>
                    </div>

                    {/* Localisation */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">{t('offersFeed.location')}</span>
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
                          <span className="text-sm font-semibold text-purple-800">{t('offersFeed.technicalSpecs')}</span>
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
                          <span className="text-sm font-semibold text-amber-800">{t('offersFeed.availabilitySlotsTitle')}</span>
                        </div>
                        <div className="space-y-2">
                          {selectedOffer.availabilitySlots.map((slot, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-amber-100 flex items-center gap-3">
                              <div className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-slate-700">
                                  {t('offersFeed.from')} <strong>{new Date(slot.startDate).toLocaleDateString('fr-FR')}</strong>
                                  {' '}{t('offersFeed.to')} <strong>{new Date(slot.endDate).toLocaleDateString('fr-FR')}</strong>
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {Math.ceil((new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24))} {t('offersFeed.days')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter className="flex-col sm:flex-row sm:justify-end sm:space-x-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full sm:w-auto"
                  >
                    {t('offersFeed.close')}
                  </Button>
                  {selectedOffer && (
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleReserve(selectedOffer)
                      }}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('offersFeed.reserveThisMachine')}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal: Réservation (pour agriculteurs) */}
            <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
              <DialogContent className="w-[92vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader>
                  <DialogTitle>{t('offersFeed.reserveThisMachine')}</DialogTitle>
                </DialogHeader>
                {selectedOffer && (
                  <div className="space-y-4 px-4 pb-4">
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
                        {selectedOffer.priceRate} {t('offersFeed.madPerDay')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Créneaux disponibles */}
                {selectedOffer.availabilitySlots && selectedOffer.availabilitySlots.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('offersFeed.availableSlotsTitle')}
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
                    <label className="text-sm font-medium text-slate-700">{t('offersFeed.startDate')} <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={reservationStartDate}
                      onChange={(e) => setReservationStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{t('offersFeed.endDate')} <span className="text-red-500">*</span></label>
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
                          <p className="text-sm text-emerald-800 font-semibold">{t('offersFeed.estimatedTotalCost')}</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {Math.ceil((new Date(reservationEndDate).getTime() - new Date(reservationStartDate).getTime()) / (1000 * 60 * 60 * 24))} {t('offersFeed.days')} × {selectedOffer.priceRate} {t('offersFeed.mad')}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">{calculateTotalCost()} {t('offersFeed.mad')}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t('offersFeed.notesLabel')}</label>
                  <textarea
                    value={reservationNotes}
                    onChange={(e) => setReservationNotes(e.target.value)}
                    placeholder={t('offersFeed.notesPlaceholder')}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Info box */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800">
                    ℹ️ <strong>{t('offersFeed.information')}</strong> {t('offersFeed.reservationInfo')}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row sm:justify-end sm:space-x-2 gap-2 px-4 pb-4">
              <Button
                variant="outline"
                onClick={() => setShowReservationModal(false)}
                disabled={submittingReservation}
                className="w-full sm:w-auto"
              >
                {t('offersFeed.cancelReservation')}
              </Button>
              <Button
                onClick={handleSubmitReservation}
                disabled={submittingReservation || !reservationStartDate || !reservationEndDate}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingReservation ? t('offersFeed.submitting') : t('offersFeed.sendReservationRequest')}
              </Button>
            </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}

export default OffersFeed
