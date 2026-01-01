"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useLanguage } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LeafletCSS } from "@/components/LeafletCSS"
import type { Demand, SetAppView } from "@/types"
import { DemandStatus, UserRole } from "@/types"
import { getAllDemands } from "@/services/apiService"
import { TrendingUp, CheckCircle, Clock, MapPin, Calendar, Sparkles, List, Map as MapIcon, MessageSquare, FileText, Eye, Send } from "lucide-react"
import { SERVICE_TYPES } from "@/constants/serviceTypes"
import dynamic from 'next/dynamic'

// Import Leaflet dynamically (client-side only)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface DemandsFeedProps {
  setView: SetAppView
}

const DemandsFeed: React.FC<DemandsFeedProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  
  // View mode: list or map (for providers)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  
  // Filtres
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [selectedMachine, setSelectedMachine] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | DemandStatus>('all')
  const [radiusKm, setRadiusKm] = useState<number>(50)
  
  // Modals
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  
  // Proposal form
  const [proposalPrice, setProposalPrice] = useState<string>('')
  const [proposalDescription, setProposalDescription] = useState<string>('')
  const [submittingProposal, setSubmittingProposal] = useState(false)
  const [existingProposals, setExistingProposals] = useState<Set<string>>(new Set())

  const isProvider = currentUser?.role === UserRole.Provider || currentUser?.activeMode === 'Provider'

  const fetchDemands = useCallback(async () => {
    setLoading(true)
    try {
      const allDemands = await getAllDemands()
      // ALWAYS exclude own demands (hybrid accounts can switch modes)
      const filteredDemands = allDemands.filter(d => d.farmerId !== currentUser?._id && d.status !== DemandStatus.Matched)
      setDemands(filteredDemands)
      
      // For providers: fetch existing proposals
      if (isProvider && currentUser?._id) {
        const response = await fetch(`/api/proposals?providerId=${currentUser._id}`)
        if (response.ok) {
          const data = await response.json()
          const demandIds = new Set(data.proposals.map((p: any) => p.demandId))
          setExistingProposals(demandIds)
        }
      }
    } catch (error) {
      console.error("Failed to fetch demands:", error)
    } finally {
      setLoading(false)
    }
  }, [isProvider, currentUser?.id, currentUser?._id])

  useEffect(() => {
    fetchDemands()
  }, [fetchDemands])

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

  // Stats adaptées au rôle
  const stats = useMemo(() => {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    if (isProvider) {
      // Provider stats: opportunities
      const newToday = demands.filter(d => {
        const createdAt = new Date(d.createdAt || new Date())
        return createdAt.toDateString() === today.toDateString()
      })
      
      const urgent = demands.filter(d => {
        if (!d.requiredTimeSlot?.start) return false
        const startDate = new Date(d.requiredTimeSlot.start)
        const daysUntil = (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        return daysUntil > 0 && daysUntil <= 7
      })
      
      const negotiating = demands.filter(d => d.status === DemandStatus.Negotiating)
      
      // Nearby demands (within radiusKm)
      let nearby = 0
      if (currentUser?.location?.coordinates) {
        const [userLon, userLat] = currentUser.location.coordinates
        nearby = demands.filter(d => {
          if (!d.jobLocation?.coordinates) return false
          const [demandLon, demandLat] = d.jobLocation.coordinates
          const distance = calculateDistance(userLat, userLon, demandLat, demandLon)
          return distance <= radiusKm
        }).length
      }
      
      return {
        newToday: newToday.length,
        urgentCount: urgent.length,
        negotiatingCount: negotiating.length,
        nearbyCount: nearby,
        totalCount: demands.length
      }
    } else {
      // Farmer stats: motivational
      const todayDemands = demands.filter(d => {
        const createdAt = new Date(d.createdAt || new Date())
        return createdAt.toDateString() === today.toDateString()
      })
      
      const weekMatched = demands.filter(d => {
        const updatedAt = new Date(d.updatedAt || new Date())
        return d.status === DemandStatus.Matched && updatedAt >= weekAgo
      })

      const activeDemands = demands.filter(d => 
        d.status === DemandStatus.Waiting || d.status === DemandStatus.Negotiating
      )
      
      return {
        todayCount: todayDemands.length,
        weekMatchedCount: weekMatched.length,
        activeCount: activeDemands.length,
        totalCount: demands.length
      }
    }
  }, [demands, isProvider, currentUser, radiusKm])

  // Extraire les options de filtres
  const cities = useMemo(() => {
    const uniqueCities = new Set(demands.map(d => d.city).filter(Boolean))
    return Array.from(uniqueCities).sort()
  }, [demands])

  const machines = useMemo(() => {
    const uniqueMachines = new Set(demands.map(d => d.requiredService).filter(Boolean))
    return Array.from(uniqueMachines).sort()
  }, [demands])

  // Filtrer les demandes
  const filteredDemands = useMemo(() => {
    return demands.filter(demand => {
      if (selectedCity !== 'all' && demand.city !== selectedCity) return false
      if (selectedMachine !== 'all' && demand.requiredService !== selectedMachine) return false
      if (selectedService !== 'all' && demand.serviceType !== selectedService) return false
      if (selectedStatus !== 'all' && demand.status !== selectedStatus) return false
      return true
    })
  }, [demands, selectedCity, selectedMachine, selectedService, selectedStatus])

  const getStatusBadge = (status: DemandStatus) => {
    const config = {
      [DemandStatus.Waiting]: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      [DemandStatus.Negotiating]: { label: 'En négociation', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      [DemandStatus.Matched]: { label: 'Matché', className: 'bg-green-100 text-green-800 border-green-300' },
    }
    const { label, className } = config[status] || config[DemandStatus.Waiting]
    return <Badge className={className}>{label}</Badge>
  }

  const getServiceLabel = (id: string | undefined) => {
    if (!id) return ""
    const service = SERVICE_TYPES.find(s => s.id === id)
    return service ? service.name : id
  }

  const handleResetFilters = () => {
    setSelectedCity('all')
    setSelectedMachine('all')
    setSelectedService('all')
    setSelectedStatus('all')
  }

  const handleContactFarmer = (demand: Demand) => {
    // Store the conversation target with farmer info
    if (demand.farmerId) {
      sessionStorage.setItem('messageTarget', JSON.stringify({
        userId: demand.farmerId,
        userName: demand.farmerName || 'Agriculteur',
        demandId: demand.id || demand._id
      }))
    }
    setView("messages")
  }

  const handleMakeProposal = (demand: Demand) => {
    setSelectedDemand(demand)
    setProposalPrice('')
    setProposalDescription('')
    setShowProposalModal(true)
  }

  const handleViewDetails = (demand: Demand) => {
    setSelectedDemand(demand)
    setShowDetailsModal(true)
  }

  const handleSubmitProposal = async () => {
    if (!selectedDemand || !currentUser) return
    
    if (!proposalPrice || parseFloat(proposalPrice) <= 0) {
      alert('Veuillez entrer un prix valide')
      return
    }
    
    if (!proposalDescription || proposalDescription.trim().length === 0) {
      alert('Veuillez entrer une description')
      return
    }

    setSubmittingProposal(true)
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandId: selectedDemand._id,
          providerId: currentUser._id,
          price: parseFloat(proposalPrice),
          description: proposalDescription
        })
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          alert(error.error || 'Votre session a expiré. Veuillez vous reconnecter.')
          // Force logout
          localStorage.removeItem('user')
          window.location.reload()
          return
        }
        throw new Error(error.error || error.message || 'Failed to create proposal')
      }

      alert('Proposition envoyée avec succès!')
      setShowProposalModal(false)
      // Add to existing proposals
      setExistingProposals(prev => new Set([...prev, selectedDemand._id]))
      setSelectedDemand(null)
      fetchDemands() // Refresh demands
    } catch (error: unknown) {
      console.error('Error submitting proposal:', error)
      if (error instanceof Error) {
        alert(`Erreur: ${error.message}`)
      } else {
        alert('Erreur lors de l\'envoi de la proposition')
      }
    } finally {
      setSubmittingProposal(false)
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
              {isProvider ? 'Opportunités de Service' : 'Découvrez les Demandes'}
            </h1>
            <p className="text-slate-600">
              {isProvider 
                ? 'Trouvez des demandes à proximité et proposez vos services'
                : 'Inspirez-vous des besoins de la communauté agricole'
              }
            </p>
          </div>
          <div className="flex gap-3">
            {isProvider && (
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
            )}
            <Button
              onClick={() => setView("dashboard")}
              variant="outline"
              className="px-4 py-2"
            >
              Retour
            </Button>
            {!isProvider && (
              <Button
                onClick={() => setView("postDemand")}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Publier ma demande
              </Button>
            )}
          </div>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="text-sm font-medium text-slate-700">Type de prestation</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Tous les types</option>
                  {SERVICE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
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
                  <option value={DemandStatus.Waiting}>En attente</option>
                  <option value={DemandStatus.Negotiating}>En négociation</option>
                  <option value={DemandStatus.Matched}>Matché</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-emerald-700">{filteredDemands.length}</span> demande{filteredDemands.length > 1 ? 's' : ''} trouvée{filteredDemands.length > 1 ? 's' : ''} sur {demands.length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contenu principal : Liste ou Carte */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Chargement des demandes...</p>
          </div>
        ) : filteredDemands.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Aucune demande trouvée
              </h3>
              <p className="text-slate-600 mb-6">
                Aucune demande ne correspond à vos critères. Essayez de modifier les filtres.
              </p>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="mr-2"
              >
                Réinitialiser les filtres
              </Button>
              {!isProvider && (
                <Button
                  onClick={() => setView("postDemand")}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  Publier ma demande
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Vue Carte pour prestataires */}
            {isProvider && viewMode === 'map' && (
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

                        {/* Demand markers */}
                        {filteredDemands.map(demand => {
                          if (!demand.jobLocation?.coordinates) return null
                          const [lon, lat] = demand.jobLocation.coordinates
                          
                          return (
                            <Marker key={demand._id} position={[lat, lon]}>
                              <Popup>
                                <div className="p-2 min-w-[220px]">
                                  <h4 className="font-bold text-sm mb-1">{demand.title || demand.requiredService}</h4>
                                  <div className="space-y-0.5 text-xs mb-2">
                                    <p><strong>Ville:</strong> {demand.city}</p>
                                    <p><strong>Machine:</strong> {demand.requiredService}</p>
                                    {demand.area && <p><strong>Surface:</strong> {demand.area} ha</p>}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewDetails(demand)}
                                      className="text-xs flex-1"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Détails
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleMakeProposal(demand)}
                                      disabled={existingProposals.has(demand._id)}
                                      className="text-xs flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={existingProposals.has(demand._id) ? 'Vous avez déjà proposé' : 'Faire une proposition'}
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      {existingProposals.has(demand._id) ? 'Déjà proposé' : 'Proposer'}
                                    </Button>
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
            {(!isProvider || viewMode === 'list') && (
              <div className="space-y-4">
                {filteredDemands.map((demand) => (
                  <Card key={demand._id} className="hover:shadow-lg transition-shadow border-slate-200">
                    <CardContent className="p-0">
                      <div className="flex items-start">
                        {/* Image à gauche */}
                        {demand.photoUrl && (
                          <div className="w-48 h-48 flex-shrink-0 bg-slate-100 rounded-l-lg overflow-hidden flex items-center justify-center">
                            <img 
                              src={demand.photoUrl} 
                              alt={demand.title} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        
                        {/* Contenu principal */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-slate-800 mb-1">
                                {demand.title || demand.requiredService}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {demand.city}
                                </div>
                                {demand.requiredTimeSlot && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs">
                                      {new Date(demand.requiredTimeSlot.start).toLocaleDateString('fr-FR')} - {new Date(demand.requiredTimeSlot.end).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {getStatusBadge(demand.status)}
                          </div>

                          {/* Informations en ligne */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {demand.serviceType && (
                              <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase">Prestation</span>
                                <p className="text-sm text-slate-800 font-medium">{getServiceLabel(demand.serviceType)}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-slate-500 font-semibold uppercase">Machine</span>
                              <p className="text-sm text-slate-800 font-medium">{demand.requiredService}</p>
                            </div>
                            {demand.cropType && (
                              <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase">Culture</span>
                                <p className="text-sm text-slate-800 font-medium">{demand.cropType}</p>
                              </div>
                            )}
                            {demand.area && (
                              <div>
                                <span className="text-xs text-slate-500 font-semibold uppercase">Superficie</span>
                                <p className="text-sm text-slate-800 font-medium">{demand.area} ha</p>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {demand.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                              {demand.description}
                            </p>
                          )}

                          {/* Boutons d'action pour prestataires */}
                          {isProvider && (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(demand)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Voir détails
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleMakeProposal(demand)}
                                disabled={existingProposals.has(demand._id)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                title={existingProposals.has(demand._id) ? 'Vous avez déjà soumis une proposition' : 'Faire une proposition'}
                              >
                                <Send className="w-4 h-4" />
                                {existingProposals.has(demand._id) ? 'Proposition envoyée' : 'Faire une proposition'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* CTA final (uniquement pour les agriculteurs) */}
        {!loading && !isProvider && filteredDemands.length > 0 && (
          <div className="mt-12 text-center">
            <Card className="p-8 bg-gradient-to-r from-emerald-600 to-teal-600 border-none">
              <h3 className="text-2xl font-bold text-white mb-2">
                Vous aussi, publiez votre demande !
              </h3>
              <p className="text-emerald-50 mb-6">
                Rejoignez {'totalCount' in stats ? stats.totalCount : 0}+ agriculteurs qui ont trouvé des prestataires sur YKRI
              </p>
              <Button
                onClick={() => setView("postDemand")}
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Publier ma demande maintenant
              </Button>
            </Card>
          </div>
        )}

        {/* Modal: Faire une proposition */}
        <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Faire une proposition</DialogTitle>
            </DialogHeader>
            {selectedDemand && (
              <div className="space-y-4 py-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">{selectedDemand.title || selectedDemand.requiredService}</h4>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p><strong>Ville:</strong> {selectedDemand.city}</p>
                    <p><strong>Machine:</strong> {selectedDemand.requiredService}</p>
                    {selectedDemand.area && <p><strong>Surface:</strong> {selectedDemand.area} ha</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Prix proposé (MAD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposalPrice}
                    onChange={(e) => setProposalPrice(e.target.value)}
                    placeholder="Ex: 5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description de votre offre</Label>
                  <Textarea
                    id="description"
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="Décrivez votre offre, vos disponibilités, votre expérience..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProposalModal(false)}
                disabled={submittingProposal}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitProposal}
                disabled={submittingProposal || !proposalPrice || !proposalDescription}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submittingProposal ? 'Envoi...' : 'Envoyer la proposition'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Détails de la demande */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la demande</DialogTitle>
            </DialogHeader>
            {selectedDemand && (
              <div className="space-y-3 py-2">
                {selectedDemand.photoUrl && (
                  <div className="w-full h-40 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedDemand.photoUrl}
                      alt={selectedDemand.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-bold mb-1">{selectedDemand.title || selectedDemand.requiredService}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedDemand.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase block mb-0.5">Ville</span>
                    <p className="text-sm font-medium">{selectedDemand.city}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase block mb-0.5">Machine</span>
                    <p className="text-sm font-medium">{selectedDemand.requiredService}</p>
                  </div>
                  {selectedDemand.serviceType && (
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-0.5">Type de prestation</span>
                      <p className="text-sm font-medium">{getServiceLabel(selectedDemand.serviceType)}</p>
                    </div>
                  )}
                  {selectedDemand.cropType && (
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-0.5">Culture</span>
                      <p className="text-sm font-medium">{selectedDemand.cropType}</p>
                    </div>
                  )}
                  {selectedDemand.area && (
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-0.5">Superficie</span>
                      <p className="text-sm font-medium">{selectedDemand.area} ha</p>
                    </div>
                  )}
                  {selectedDemand.requiredTimeSlot && (
                    <div className="col-span-2">
                      <span className="text-xs text-slate-500 font-semibold uppercase block mb-0.5">Période souhaitée</span>
                      <p className="text-sm font-medium">
                        {new Date(selectedDemand.requiredTimeSlot.start).toLocaleDateString('fr-FR')} - {new Date(selectedDemand.requiredTimeSlot.end).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDemand.description && (
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase block mb-0.5">Description</span>
                    <p className="text-sm text-slate-700 line-clamp-3">{selectedDemand.description}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Fermer
              </Button>
              {isProvider && selectedDemand && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false)
                      handleContactFarmer(selectedDemand)
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contacter
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false)
                      handleMakeProposal(selectedDemand)
                    }}
                    disabled={existingProposals.has(selectedDemand._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={existingProposals.has(selectedDemand._id) ? 'Vous avez déjà soumis une proposition' : 'Faire une proposition'}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {existingProposals.has(selectedDemand._id) ? 'Proposition envoyée' : 'Proposer'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default DemandsFeed
