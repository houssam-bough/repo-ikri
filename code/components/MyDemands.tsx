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
import type { Demand, SetAppView } from "@/types"
import { DemandStatus } from "@/types"
import { getAllDemands, deleteDemand, updateDemand, getProposalsForDemand, acceptProposal, rejectProposal, counterProposal, finalAcceptProposal, finalRejectProposal, farmerFinalValidateProposal } from "@/services/apiService"
import { Edit, Trash2, Eye, MessageSquare, Phone, Download, CheckCircle, XCircle, RefreshCcw, FileCheck } from "lucide-react"
import { SERVICE_TYPES } from "@/constants/serviceTypes"

interface MyDemandsProps {
  setView: SetAppView
}

const MyDemands: React.FC<MyDemandsProps> = ({ setView }) => {
  const { t } = useLanguage()
  const { currentUser } = useAuth()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | DemandStatus>('all')
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Proposals state
  const [proposals, setProposals] = useState<any[]>([])
  const [loadingProposals, setLoadingProposals] = useState(false)
  
  // Counter offer state
  const [showCounterModal, setShowCounterModal] = useState(false)
  const [selectedProposalForCounter, setSelectedProposalForCounter] = useState<any>(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [isCountering, setIsCountering] = useState(false)
  
  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<Demand>>({})

  const fetchMyDemands = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const allDemands = await getAllDemands()
      const myDemands = allDemands.filter(demand => demand.farmerId === currentUser._id)
      setDemands(myDemands)
    } catch (error) {
      console.error("Failed to fetch my demands:", error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  const fetchProposals = async (demandId: string) => {
    setLoadingProposals(true)
    try {
      const fetchedProposals = await getProposalsForDemand(demandId)
      setProposals(fetchedProposals)
    } catch (error) {
      console.error("Failed to fetch proposals:", error)
    } finally {
      setLoadingProposals(false)
    }
  }

  const handleAcceptProposal = async (proposalId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir accepter cette proposition ? Toutes les autres propositions seront automatiquement rejetées.")) {
      return
    }

    try {
      const updated = await acceptProposal(proposalId, currentUser?._id)
      if (updated) {
        // Refresh demands and proposals
        await fetchMyDemands()
        if (selectedDemand) {
          await fetchProposals(selectedDemand._id)
        }
        alert("Proposition acceptée avec succès !")
      } else {
        alert("Erreur lors de l'acceptation de la proposition")
      }
    } catch (error) {
      console.error("Failed to accept proposal:", error)
      alert("Erreur lors de l'acceptation de la proposition")
    }
  }

  const handleRejectProposal = async (proposalId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir refuser cette proposition ?")) {
      return
    }

    try {
      const updated = await rejectProposal(proposalId, currentUser?._id)
      if (updated) {
        // Refresh proposals
        if (selectedDemand) {
          await fetchProposals(selectedDemand._id)
        }
        alert("Proposition refusée")
      } else {
        alert("Erreur lors du refus de la proposition")
      }
    } catch (error) {
      console.error("Failed to reject proposal:", error)
      alert("Erreur lors du refus de la proposition")
    }
  }

  // Open counter offer modal
  const handleOpenCounterModal = (proposal: any) => {
    setSelectedProposalForCounter(proposal)
    const currentPrice = proposal.currentPrice || proposal.price
    // Suggest a slightly lower price
    setCounterPrice(Math.floor(currentPrice * 0.9).toString())
    setShowCounterModal(true)
  }

  // Submit counter offer
  const handleSubmitCounter = async () => {
    if (!selectedProposalForCounter || !currentUser || !counterPrice) return
    
    const priceValue = parseFloat(counterPrice)
    if (isNaN(priceValue) || priceValue <= 0) {
      alert("Veuillez entrer un prix valide")
      return
    }

    setIsCountering(true)
    try {
      const result = await counterProposal(selectedProposalForCounter.id, priceValue, currentUser._id)
      if (result.success) {
        setShowCounterModal(false)
        setSelectedProposalForCounter(null)
        setCounterPrice('')
        // Refresh proposals
        if (selectedDemand) {
          await fetchProposals(selectedDemand._id)
        }
        alert("Contre-offre envoyée avec succès !")
      } else {
        alert(result.error || "Erreur lors de l'envoi de la contre-offre")
      }
    } catch (error) {
      console.error("Failed to counter proposal:", error)
      alert("Erreur lors de l'envoi de la contre-offre")
    } finally {
      setIsCountering(false)
    }
  }

  // Final approval after provider accepts
  const handleFinalAccept = async (proposalId: string) => {
    if (!confirm("Confirmez-vous l'acceptation finale de cette proposition ?")) {
      return
    }

    try {
      const updated = await finalAcceptProposal(proposalId, currentUser?._id || '')
      if (updated) {
        await fetchMyDemands()
        if (selectedDemand) {
          await fetchProposals(selectedDemand._id)
        }
        alert("Proposition acceptée définitivement !")
      } else {
        alert("Erreur lors de l'acceptation finale")
      }
    } catch (error) {
      console.error("Failed to final accept proposal:", error)
      alert("Erreur lors de l'acceptation finale")
    }
  }

  // Final rejection after provider accepts
  const handleFinalReject = async (proposalId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir rejeter cette proposition même après que le prestataire l'ait acceptée ?")) {
      return
    }

    try {
      const updated = await finalRejectProposal(proposalId, currentUser?._id || '')
      if (updated) {
        if (selectedDemand) {
          await fetchProposals(selectedDemand._id)
        }
        alert("Proposition rejetée")
      } else {
        alert("Erreur lors du rejet")
      }
    } catch (error) {
      console.error("Failed to final reject proposal:", error)
      alert("Erreur lors du rejet")
    }
  }

  // Farmer final validation to conclude the deal (step 3 of double validation)
  const handleFarmerFinalValidate = async (proposalId: string) => {
    if (!confirm("Confirmez-vous définitivement cet accord ? Le contrat sera finalisé.")) {
      return
    }

    try {
      const updated = await farmerFinalValidateProposal(proposalId, currentUser?._id || '')
      if (updated) {
        await fetchMyDemands()
        if (selectedDemand) {
          await fetchProposals(selectedDemand._id)
        }
        alert("🎉 Marché conclu ! Le contrat est maintenant disponible au téléchargement.")
      } else {
        alert("Erreur lors de la validation finale")
      }
    } catch (error) {
      console.error("Failed to farmer final validate proposal:", error)
      alert("Erreur lors de la validation finale")
    }
  }

  const handleOpenDetails = async (demand: Demand) => {
    setSelectedDemand(demand)
    if (demand.status === DemandStatus.Negotiating || demand.status === DemandStatus.Matched) {
      await fetchProposals(demand._id)
    }
    setShowDetailsModal(true)
  }

  const handleContactProvider = (providerId: string, providerName: string) => {
    // Store the conversation target with provider info
    if (providerId && selectedDemand) {
      sessionStorage.setItem('messageTarget', JSON.stringify({
        userId: providerId,
        userName: providerName || 'Prestataire',
        demandId: selectedDemand._id
      }))
    }
    setView("messages")
  }

  useEffect(() => {
    fetchMyDemands()
  }, [fetchMyDemands])

  const filteredDemands = selectedStatus === 'all' 
    ? demands 
    : demands.filter(d => d.status === selectedStatus)

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
    if (!id) return "Non spécifié"
    const service = SERVICE_TYPES.find(s => s.id === id)
    return service ? service.name : id
  }

  const getTimeAgo = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diffInMs = now.getTime() - d.getTime()
    
    // Handle future dates or slight clock skews
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
    if (!selectedDemand) return
    try {
      const success = await deleteDemand(selectedDemand._id)
      if (success) {
        setDemands(demands.filter(d => d._id !== selectedDemand._id))
        setShowDeleteConfirm(false)
        setSelectedDemand(null)
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Failed to delete demand:", error)
      alert("Erreur lors de la suppression de la demande")
    }
  }

  const handleEditClick = (demand: Demand) => {
    setSelectedDemand(demand)
    setEditForm({
      title: demand.title,
      serviceType: demand.serviceType,
      requiredService: demand.requiredService,
      cropType: demand.cropType,
      area: demand.area,
      description: demand.description,
      city: demand.city,
      address: demand.address,
      requiredTimeSlot: demand.requiredTimeSlot
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!selectedDemand || !selectedDemand._id) return
    try {
      const updated = await updateDemand(selectedDemand._id, editForm)
      if (updated) {
        setDemands(demands.map(d => d._id === updated._id ? updated : d))
        setShowEditModal(false)
        setSelectedDemand(null)
      } else {
        alert("Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Failed to update demand:", error)
      alert("Erreur lors de la mise à jour")
    }
  }

  const handleDownloadContract = (demand: Demand) => {
    // Download contract from API
    const url = `/api/demands/${demand._id}/contract`
    const link = document.createElement('a')
    link.href = url
    link.download = `Contrat_YKRI_${demand._id.substring(0, 8)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">Chargement de vos demandes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Mes Demandes</h1>
            <p className="text-slate-600 mt-2">
              {demands.length} demande{demands.length > 1 ? 's' : ''} au total
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
            className={selectedStatus === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Tout ({demands.length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(DemandStatus.Waiting)}
            variant={selectedStatus === DemandStatus.Waiting ? 'default' : 'outline'}
            className={selectedStatus === DemandStatus.Waiting ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            En attente ({demands.filter(d => d.status === DemandStatus.Waiting).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(DemandStatus.Negotiating)}
            variant={selectedStatus === DemandStatus.Negotiating ? 'default' : 'outline'}
            className={selectedStatus === DemandStatus.Negotiating ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            En négociation ({demands.filter(d => d.status === DemandStatus.Negotiating).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus(DemandStatus.Matched)}
            variant={selectedStatus === DemandStatus.Matched ? 'default' : 'outline'}
            className={selectedStatus === DemandStatus.Matched ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            Matché ({demands.filter(d => d.status === DemandStatus.Matched).length})
          </Button>
        </div>

        {/* Liste des demandes */}
        {filteredDemands.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-600">
                {selectedStatus === 'all' 
                  ? "Vous n'avez pas encore créé de demandes."
                  : "Aucune demande avec ce statut."}
              </p>
              <Button
                onClick={() => setView("postDemand")}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                Créer une demande
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDemands.map((demand) => (
              <Card key={demand._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {demand.title || demand.requiredService}
                      </CardTitle>
                      <div className="flex gap-2 items-center flex-wrap mb-3">
                        {getStatusBadge(demand.status)}
                        <span className="text-sm text-slate-500">
                          {demand.city || 'Localisation non spécifiée'}
                        </span>
                        <span className="text-sm text-slate-400">
                          {getTimeAgo(demand.createdAt || new Date())}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {demand.serviceType && (
                          <div>
                            <span className="font-semibold text-slate-700">Type de prestation:</span>
                            <span className="text-slate-600 ml-2">{getServiceLabel(demand.serviceType)}</span>
                          </div>
                        )}
                        {demand.requiredService && (
                          <div>
                            <span className="font-semibold text-slate-700">Machine:</span>
                            <span className="text-slate-600 ml-2">{demand.requiredService}</span>
                          </div>
                        )}
                        {demand.cropType && (
                          <div>
                            <span className="font-semibold text-slate-700">Culture:</span>
                            <span className="text-slate-600 ml-2">{demand.cropType}</span>
                          </div>
                        )}
                        {demand.area && (
                          <div>
                            <span className="font-semibold text-slate-700">Superficie:</span>
                            <span className="text-slate-600 ml-2">{demand.area} ha</span>
                          </div>
                        )}
                        {demand.requiredTimeSlot && (
                          <div className="col-span-2">
                            <span className="font-semibold text-slate-700">Période:</span>
                            <span className="text-slate-600 ml-2">
                              {new Date(demand.requiredTimeSlot.start).toLocaleDateString()} - {new Date(demand.requiredTimeSlot.end).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Actions selon le statut */}
                  <div className="flex justify-end gap-2 mt-4 flex-wrap border-t pt-4">
                    {/* En attente - Modifier, Supprimer, Voir détails */}
                    {demand.status === DemandStatus.Waiting && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDemand(demand)
                            setShowDetailsModal(true)
                          }}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(demand)}
                          className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDemand(demand)
                            setShowDeleteConfirm(true)
                          }}
                          className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </Button>
                      </>
                    )}

                    {/* En négociation - Voir propositions */}
                    {demand.status === DemandStatus.Negotiating && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDetails(demand)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        Voir les propositions
                      </Button>
                    )}

                    {/* Matché - Voir proposition acceptée */}
                    {demand.status === DemandStatus.Matched && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenDetails(demand)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Eye className="w-4 h-4" />
                          Voir la proposition acceptée
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadContract(demand)}
                          className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger contrat
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Détails */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la demande</DialogTitle>
            </DialogHeader>
            {selectedDemand && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedDemand.title || selectedDemand.requiredService}</h3>
                  {getStatusBadge(selectedDemand.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-slate-700">Ville:</span>
                    <p className="text-slate-600">{selectedDemand.city}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Adresse:</span>
                    <p className="text-slate-600">{selectedDemand.address}</p>
                  </div>
                  {selectedDemand.serviceType && (
                    <div>
                      <span className="font-semibold text-slate-700">Type de prestation:</span>
                      <p className="text-slate-600">{getServiceLabel(selectedDemand.serviceType)}</p>
                    </div>
                  )}
                  {selectedDemand.requiredService && (
                    <div>
                      <span className="font-semibold text-slate-700">Machine requise:</span>
                      <p className="text-slate-600">{selectedDemand.requiredService}</p>
                    </div>
                  )}
                  {selectedDemand.cropType && (
                    <div>
                      <span className="font-semibold text-slate-700">Type de culture:</span>
                      <p className="text-slate-600">{selectedDemand.cropType}</p>
                    </div>
                  )}
                  {selectedDemand.area && (
                    <div>
                      <span className="font-semibold text-slate-700">Superficie:</span>
                      <p className="text-slate-600">{selectedDemand.area} ha</p>
                    </div>
                  )}
                  {selectedDemand.requiredTimeSlot && (
                    <div className="col-span-2">
                      <span className="font-semibold text-slate-700">Période souhaitée:</span>
                      <p className="text-slate-600">
                        {new Date(selectedDemand.requiredTimeSlot.start).toLocaleDateString()} - {new Date(selectedDemand.requiredTimeSlot.end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDemand.description && (
                  <div>
                    <span className="font-semibold text-slate-700">Description:</span>
                    <p className="text-slate-600 mt-1 bg-slate-50 p-3 rounded-lg">
                      {selectedDemand.description}
                    </p>
                  </div>
                )}

                {/* Section Propositions pour status En négociation */}
                {selectedDemand.status === DemandStatus.Negotiating && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-semibold text-lg mb-2">
                      Propositions reçues ({proposals.length})
                    </h4>
                    
                    {loadingProposals ? (
                      <div className="text-center py-3 text-slate-500 text-sm">
                        Chargement des propositions...
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-3 text-slate-500 text-sm">
                        Aucune proposition reçue pour le moment
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {proposals
                          .filter((p: any) => p.status === 'pending')
                          .map((proposal: any) => {
                            const currentPrice = proposal.currentPrice || proposal.price
                            const negotiationRound = proposal.negotiationRound || 0
                            const isMyTurn = negotiationRound % 2 === 0 // Farmer's turn at even rounds
                            const isAwaitingFinalApproval = proposal.pendingFarmerFinalApproval
                            const canFarmerCounter = negotiationRound === 0 || negotiationRound === 2
                            const history = (proposal.counterOfferHistory as any[]) || []
                            
                            // Double validation state
                            const farmerValidated = proposal.farmerValidated || false
                            const providerValidated = proposal.providerValidated || false
                            const isAwaitingFarmerFinalValidation = farmerValidated && providerValidated
                            const isAwaitingProviderValidation = farmerValidated && !providerValidated
                            
                            return (
                          <Card key={proposal.id} className={`border-2 transition-colors ${isAwaitingFarmerFinalValidation ? 'bg-green-50 border-green-300 ring-2 ring-green-400' : isAwaitingProviderValidation ? 'bg-purple-50 border-purple-300' : isAwaitingFinalApproval ? 'bg-green-50 border-green-300' : isMyTurn ? 'bg-blue-50 border-blue-300' : 'bg-amber-50 border-amber-300'}`}>
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                {/* Header with name and turn indicator */}
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-base text-slate-800 truncate">
                                      {proposal.provider?.name || proposal.providerName}
                                    </p>
                                    {/* Negotiation status badge */}
                                    {isAwaitingFarmerFinalValidation ? (
                                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs mt-1 animate-pulse">
                                        🎯 Le prestataire a validé - Validez définitivement !
                                      </Badge>
                                    ) : isAwaitingProviderValidation ? (
                                      <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs mt-1">
                                        ⏳ Vous avez validé - Attente validation prestataire
                                      </Badge>
                                    ) : isAwaitingFinalApproval ? (
                                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs mt-1">
                                        ✅ En attente de votre approbation finale
                                      </Badge>
                                    ) : negotiationRound > 0 ? (
                                      <Badge className={`text-xs mt-1 ${isMyTurn ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                                        {isMyTurn ? '🔔 À vous de répondre' : '⏳ Attente réponse du prestataire'}
                                        {' '}(Tour {negotiationRound}/4)
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <div className="flex gap-1.5 flex-shrink-0">
                                    {proposal.provider?.phone && (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-blue-300 text-blue-700 hover:bg-blue-50 h-8 px-2"
                                        onClick={() => window.open(`tel:${proposal.provider.phone}`)}
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8 px-2"
                                      onClick={() => handleContactProvider(proposal.providerId, proposal.provider?.name || proposal.providerName)}
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Price display with negotiation history */}
                                <div className="bg-white p-2 rounded space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-700">Prix actuel:</span>
                                    <span className="text-lg text-emerald-700 font-bold">
                                      {currentPrice} MAD
                                    </span>
                                  </div>
                                  {proposal.price !== currentPrice && (
                                    <p className="text-xs text-slate-500">
                                      Prix initial: <span className="line-through">{proposal.price} MAD</span>
                                    </p>
                                  )}
                                  {/* Show negotiation history */}
                                  {history.length > 0 && (
                                    <div className="mt-2 pt-2 border-t">
                                      <p className="text-xs font-semibold text-slate-600 mb-1">Historique des négociations:</p>
                                      <div className="space-y-1">
                                        {history.map((h: any, i: number) => (
                                          <p key={i} className="text-xs text-slate-500">
                                            {h.by === 'farmer' ? '👤 Vous' : '🚜 Prestataire'}: {h.price} MAD
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="bg-white p-2 rounded">
                                  <p className="text-xs font-semibold text-slate-700 mb-0.5">Description:</p>
                                  <p className="text-xs text-slate-600 line-clamp-3">{proposal.description}</p>
                                </div>
                                
                                {/* Action buttons based on state */}
                                <div className="flex gap-2 pt-2 border-t flex-wrap">
                                  {isAwaitingFarmerFinalValidation ? (
                                    // Double validation: farmer final validation (step 3)
                                    <>
                                      <div className="w-full mb-2 p-2 bg-green-100 rounded-lg border border-green-200">
                                        <p className="text-xs text-green-800 font-medium text-center">
                                          🎉 Le prestataire a confirmé ! Validez pour conclure le marché.
                                        </p>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700 flex items-center gap-1 h-8 text-xs flex-1"
                                        onClick={() => handleFarmerFinalValidate(proposal.id)}
                                      >
                                        <FileCheck className="w-3.5 h-3.5" />
                                        Conclure le marché
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1 h-8 text-xs"
                                        onClick={() => handleRejectProposal(proposal.id)}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Annuler
                                      </Button>
                                    </>
                                  ) : isAwaitingProviderValidation ? (
                                    // Double validation: waiting for provider (step 2)
                                    <div className="w-full text-center py-2">
                                      <p className="text-xs text-purple-700 font-medium">
                                        ✅ Vous avez validé. En attente de la confirmation du prestataire...
                                      </p>
                                    </div>
                                  ) : isAwaitingFinalApproval ? (
                                    // Final approval buttons (old flow)
                                    <>
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700 flex items-center gap-1 h-8 text-xs flex-1"
                                        onClick={() => handleFinalAccept(proposal.id)}
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Valider définitivement
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1 h-8 text-xs flex-1"
                                        onClick={() => handleFinalReject(proposal.id)}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Refuser
                                      </Button>
                                    </>
                                  ) : isMyTurn && !farmerValidated ? (
                                    // Farmer's turn - show all 3 buttons
                                    <>
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700 flex items-center gap-1 h-8 text-xs flex-1"
                                        onClick={() => handleAcceptProposal(proposal.id)}
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Accepter
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-1 h-8 text-xs flex-1"
                                        onClick={() => handleRejectProposal(proposal.id)}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Refuser
                                      </Button>
                                      {canFarmerCounter && (
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="border-amber-400 text-amber-700 hover:bg-amber-50 flex items-center gap-1 h-8 text-xs flex-1"
                                          onClick={() => handleOpenCounterModal(proposal)}
                                        >
                                          <RefreshCcw className="w-3.5 h-3.5" />
                                          Contrer l'offre
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    // Waiting for provider response
                                    <div className="w-full text-center py-2">
                                      <p className="text-xs text-amber-700 font-medium">
                                        ⏳ En attente de la réponse du prestataire...
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )})}
                      </div>
                    )}
                  </div>
                )}

                {/* Section Proposition acceptée pour status Matché */}
                {selectedDemand.status === DemandStatus.Matched && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-semibold text-lg mb-2 text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Proposition acceptée
                    </h4>
                    
                    {loadingProposals ? (
                      <div className="text-center py-3 text-slate-500 text-sm">
                        Chargement des informations...
                      </div>
                    ) : (
                      (() => {
                        const acceptedProposal = proposals.find((p: any) => p.status === 'accepted')
                        if (!acceptedProposal) {
                          return (
                            <div className="text-center py-3 text-slate-500 text-sm">
                              Aucune proposition acceptée trouvée
                            </div>
                          )
                        }
                        return (
                          <Card className="bg-green-50 border-2 border-green-300">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="font-semibold text-slate-700 text-sm">Prestataire:</span>
                                    <p className="text-slate-900 font-medium text-base">
                                      {acceptedProposal.provider?.name || acceptedProposal.providerName}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-700 text-sm">Prix convenu:</span>
                                    <p className="text-green-700 font-bold text-xl">
                                      {acceptedProposal.currentPrice || acceptedProposal.price} MAD
                                    </p>
                                  </div>
                                  {acceptedProposal.provider?.phone && (
                                    <div>
                                      <span className="font-semibold text-slate-700 text-sm">Téléphone:</span>
                                      <p className="text-slate-900 text-sm">{acceptedProposal.provider.phone}</p>
                                    </div>
                                  )}
                                  {acceptedProposal.provider?.email && (
                                    <div>
                                      <span className="font-semibold text-slate-700 text-sm">Email:</span>
                                      <p className="text-slate-900 text-sm">{acceptedProposal.provider.email}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="bg-white p-2.5 rounded-lg">
                                  <span className="font-semibold text-slate-700 text-sm">Description:</span>
                                  <p className="text-slate-600 text-sm mt-1 line-clamp-3">{acceptedProposal.description}</p>
                                </div>

                                <div className="flex gap-2 pt-2 border-t">
                                  {acceptedProposal.provider?.phone && (
                                    <Button 
                                      size="sm" 
                                      className="bg-blue-600 hover:bg-blue-700 h-9"
                                      onClick={() => window.open(`tel:${acceptedProposal.provider.phone}`)}
                                    >
                                      <Phone className="w-4 h-4 mr-1.5" />
                                      Appeler
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-9"
                                    onClick={() => handleContactProvider(acceptedProposal.providerId, acceptedProposal.provider?.name || acceptedProposal.providerName)}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-1.5" />
                                    Message
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })()
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

        {/* Modal Modifier */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la demande</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Type de prestation</Label>
                  <select 
                    id="serviceType"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editForm.serviceType || ''}
                    onChange={(e) => setEditForm({...editForm, serviceType: e.target.value})}
                  >
                    <option value="">Sélectionner...</option>
                    {SERVICE_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredService">Machine</Label>
                  <Input 
                    id="requiredService" 
                    value={editForm.requiredService || ''} 
                    onChange={(e) => setEditForm({...editForm, requiredService: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropType">Culture</Label>
                  <Input 
                    id="cropType" 
                    value={editForm.cropType || ''} 
                    onChange={(e) => setEditForm({...editForm, cropType: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Superficie (ha)</Label>
                  <Input 
                    id="area" 
                    type="number"
                    value={editForm.area || ''} 
                    onChange={(e) => setEditForm({...editForm, area: e.target.value ? parseFloat(e.target.value) : undefined})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input 
                    id="city" 
                    value={editForm.city || ''} 
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input 
                    id="address" 
                    value={editForm.address || ''} 
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  />
                </div>
              </div>
              
              {/* Période souhaitée */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-700 mb-3">Période souhaitée</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input 
                      id="startDate" 
                      type="date"
                      value={editForm.requiredTimeSlot?.start ? new Date(editForm.requiredTimeSlot.start).toISOString().split('T')[0] : ''} 
                      onChange={(e) => setEditForm({
                        ...editForm, 
                        requiredTimeSlot: {
                          start: new Date(e.target.value),
                          end: editForm.requiredTimeSlot?.end || new Date()
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input 
                      id="endDate" 
                      type="date"
                      value={editForm.requiredTimeSlot?.end ? new Date(editForm.requiredTimeSlot.end).toISOString().split('T')[0] : ''} 
                      onChange={(e) => setEditForm({
                        ...editForm, 
                        requiredTimeSlot: {
                          start: editForm.requiredTimeSlot?.start || new Date(),
                          end: new Date(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={editForm.description || ''} 
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Confirmer Suppression */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Contrer l'offre */}
        <Dialog open={showCounterModal} onOpenChange={setShowCounterModal}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-amber-600" />
                Contrer l'offre
              </DialogTitle>
            </DialogHeader>
            {selectedProposalForCounter && (
              <div className="space-y-4 py-2">
                {/* Info du prestataire */}
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold">Prestataire:</span>{' '}
                    {selectedProposalForCounter.provider?.name || selectedProposalForCounter.providerName}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-semibold">Prix actuel:</span>{' '}
                    <span className="text-lg font-bold text-slate-800">
                      {selectedProposalForCounter.currentPrice || selectedProposalForCounter.price} MAD
                    </span>
                  </p>
                </div>

                {/* Explication du processus */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-xs text-amber-800">
                    💡 <strong>Conseil:</strong> Proposez un prix que vous estimez juste. 
                    Le prestataire pourra accepter, refuser, ou faire une nouvelle contre-offre.
                    Maximum 3 tours de négociation.
                  </p>
                </div>

                {/* Input pour le nouveau prix */}
                <div className="space-y-2">
                  <Label htmlFor="counterPrice" className="font-semibold">
                    Votre contre-offre (MAD)
                  </Label>
                  <Input 
                    id="counterPrice"
                    type="number"
                    placeholder="Ex: 800"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="text-lg font-bold"
                    min="1"
                  />
                  {counterPrice && parseFloat(counterPrice) >= (selectedProposalForCounter.currentPrice || selectedProposalForCounter.price) && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Votre contre-offre devrait être inférieure au prix actuel
                    </p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCounterModal(false)
                  setSelectedProposalForCounter(null)
                  setCounterPrice('')
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSubmitCounter}
                disabled={isCountering || !counterPrice || parseFloat(counterPrice) <= 0}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isCountering ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Envoyer la contre-offre
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default MyDemands
