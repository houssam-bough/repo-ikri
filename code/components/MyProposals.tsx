'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Proposal, ProposalStatus } from '@/types'
import { SetAppView } from '@/types'
import { Eye, Download, MapPin, Calendar, Phone, MessageSquare } from 'lucide-react'

interface MyProposalsProps {
  setView: SetAppView
}

export default function MyProposals({ setView }: MyProposalsProps) {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [downloadingContract, setDownloadingContract] = useState(false)

  useEffect(() => {
    fetchProposals()
  }, [currentUser])

  const fetchProposals = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/proposals?providerId=${currentUser._id}`)
      const data = await response.json()
      
      // Fetch full demand details for each proposal
      const proposalsWithDetails = await Promise.all(
        (data.proposals || []).map(async (proposal: any) => {
          if (proposal.demandId) {
            try {
              const demandResponse = await fetch(`/api/demands/${proposal.demandId}`)
              if (demandResponse.ok) {
                const demandData = await demandResponse.json()
                return { ...proposal, demand: demandData.demand || proposal.demand }
              }
            } catch (error) {
              console.error('Error fetching demand details:', error)
            }
          }
          return proposal
        })
      )
      
      setProposals(proposalsWithDetails)
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      accepted: { label: 'Acceptée ✅', className: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: 'Rejetée', className: 'bg-red-100 text-red-800 border-red-300' },
    }
    const { label, className } = config[status as keyof typeof config] || config.pending
    return <Badge className={className}>{label}</Badge>
  }

  const handleViewDetails = (proposal: any) => {
    setSelectedProposal(proposal)
    setShowDetailsModal(true)
  }

  const handleContactFarmer = (proposal: any) => {
    if (proposal.demand?.farmerId) {
      sessionStorage.setItem('messageTarget', JSON.stringify({
        userId: proposal.demand.farmerId,
        userName: proposal.demand.farmerName || 'Agriculteur',
        demandId: proposal.demandId
      }))
    }
    setView("messages")
  }

  const handleDownloadContract = async (demandId: string) => {
    setDownloadingContract(true)
    try {
      const response = await fetch(`/api/demands/${demandId}/contract`)
      if (!response.ok) {
        throw new Error('Failed to generate contract')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrat-${demandId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading contract:', error)
      alert('Erreur lors du téléchargement du contrat')
    } finally {
      setDownloadingContract(false)
    }
  }

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 p-8 pt-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('common.myProposals')}</h1>
            <p className="text-slate-600 mt-2">
              {proposals.length} {t('common.proposalSubmitted')}
            </p>
          </div>
          <Button onClick={() => setView('dashboard')} variant="outline">
            ← {t('common.backToDashboard')}
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-emerald-600' : ''}
          >
            {t('common.allProposals')} ({proposals.length})
          </Button>
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'default' : 'outline'}
            className={filter === 'pending' ? 'bg-yellow-600' : ''}
          >
            {t('common.pending')} ({proposals.filter(p => p.status === 'pending').length})
          </Button>
          <Button
            onClick={() => setFilter('accepted')}
            variant={filter === 'accepted' ? 'default' : 'outline'}
            className={filter === 'accepted' ? 'bg-green-600' : ''}
          >
            {t('common.accepted')} ({proposals.filter(p => p.status === 'accepted').length})
          </Button>
          <Button
            onClick={() => setFilter('rejected')}
            variant={filter === 'rejected' ? 'default' : 'outline'}
            className={filter === 'rejected' ? 'bg-red-600' : ''}
          >
            {t('common.rejected')} ({proposals.filter(p => p.status === 'rejected').length})
          </Button>
        </div>

        {/* Liste des propositions */}
        {filteredProposals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">{t('common.noProposalsFound')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-slate-800">
                        {proposal.demand?.title || t('common.demandDeleted')}
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {proposal.demand?.city || 'N/A'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Machine: {proposal.demand?.requiredService || 'N/A'}
                      </p>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Message de félicitations si acceptée */}
                  {proposal.status === 'accepted' && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-semibold text-center">
                        🎉 Félicitations ! Votre proposition a été acceptée
                      </p>
                      <p className="text-green-700 text-sm text-center mt-1">
                        Vous pouvez maintenant contacter l'agriculteur et télécharger le contrat
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">Prix proposé</p>
                      <p className="text-2xl font-bold text-emerald-600">{proposal.price} MAD</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">Date de soumission</p>
                      <p className="text-slate-800">
                        {new Date(proposal.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {proposal.demand?.area && (
                      <div>
                        <p className="text-sm text-slate-600 font-semibold">Superficie</p>
                        <p className="text-slate-800">{proposal.demand.area} ha</p>
                      </div>
                    )}
                  </div>

                  {/* Boutons d'action selon le statut */}
                  <div className="pt-4 border-t flex gap-2">
                    {proposal.status === 'pending' && (
                      <Button
                        onClick={() => handleViewDetails(proposal)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir les détails
                      </Button>
                    )}

                    {proposal.status === 'accepted' && (
                      <>
                        <Button
                          onClick={() => handleViewDetails(proposal)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </Button>
                        <Button
                          onClick={() => handleDownloadContract(proposal.demandId)}
                          disabled={downloadingContract}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {downloadingContract ? 'Téléchargement...' : 'Télécharger le contrat'}
                        </Button>
                      </>
                    )}

                    {proposal.status === 'rejected' && (
                      <Button
                        onClick={() => handleViewDetails(proposal)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir les détails
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Détails */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la proposition</DialogTitle>
            </DialogHeader>
            {selectedProposal && (
              <div className="space-y-4 py-2">
                {/* Statut */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Statut</h3>
                  {getStatusBadge(selectedProposal.status)}
                </div>

                {/* Info de la demande */}
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-base mb-2">Informations de la demande</h4>
                  <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Titre:</span> {selectedProposal.demand?.title || 'N/A'}
                    </p>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-semibold">Ville:</span> {selectedProposal.demand?.city || 'N/A'}
                    </p>
                    {selectedProposal.demand?.address && (
                      <p className="text-sm">
                        <span className="font-semibold">Adresse:</span> {selectedProposal.demand.address}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-semibold">Machine:</span> {selectedProposal.demand?.requiredService || 'N/A'}
                    </p>
                    {selectedProposal.demand?.serviceType && (
                      <p className="text-sm">
                        <span className="font-semibold">Type de prestation:</span> {selectedProposal.demand.serviceType}
                      </p>
                    )}
                    {selectedProposal.demand?.cropType && (
                      <p className="text-sm">
                        <span className="font-semibold">Culture:</span> {selectedProposal.demand.cropType}
                      </p>
                    )}
                    {selectedProposal.demand?.area && (
                      <p className="text-sm">
                        <span className="font-semibold">Superficie:</span> {selectedProposal.demand.area} ha
                      </p>
                    )}
                    {selectedProposal.demand?.requiredTimeSlot && (
                      <p className="text-sm flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-semibold">Période:</span>{' '}
                        {new Date(selectedProposal.demand.requiredTimeSlot.start).toLocaleDateString('fr-FR')} - {new Date(selectedProposal.demand.requiredTimeSlot.end).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {selectedProposal.demand?.description && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="font-semibold text-sm">Description de la demande:</span>
                        <p className="text-sm text-slate-600 mt-1">{selectedProposal.demand.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Votre proposition */}
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-base mb-2">Votre proposition</h4>
                  <div className="bg-emerald-50 p-3 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Prix proposé:</span>{' '}
                      <span className="text-lg font-bold text-emerald-700">{selectedProposal.price} MAD</span>
                    </p>
                    <div>
                      <span className="font-semibold text-sm">Description de votre offre:</span>
                      <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
                        {selectedProposal.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact agriculteur si acceptée */}
                {selectedProposal.status === 'accepted' && selectedProposal.demand && (
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-base mb-2 text-green-700">Contact de l'agriculteur</h4>
                    <div className="bg-green-50 p-3 rounded-lg space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold">Nom:</span> {selectedProposal.demand.farmerName || 'N/A'}
                      </p>
                      {selectedProposal.demand.farmer?.phone && (
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="font-semibold">Téléphone:</span> {selectedProposal.demand.farmer.phone}
                        </p>
                      )}
                      {selectedProposal.demand.farmer?.email && (
                        <p className="text-sm">
                          <span className="font-semibold">Email:</span> {selectedProposal.demand.farmer.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </Button>
              {selectedProposal?.status === 'accepted' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsModal(false)
                      handleContactFarmer(selectedProposal)
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contacter
                  </Button>
                  <Button
                    onClick={() => handleDownloadContract(selectedProposal.demandId)}
                    disabled={downloadingContract}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingContract ? 'Téléchargement...' : 'Télécharger contrat'}
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
