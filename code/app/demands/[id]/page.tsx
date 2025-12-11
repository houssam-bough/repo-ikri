'use client'

import { useEffect, useState, ComponentType } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DemandWithFarmer, DemandStatus } from '@/types'
import { getDemandById } from '@/services/apiService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, MapPinIcon, UserIcon, PhoneIcon, MailIcon, ClockIcon } from 'lucide-react'
import ProposalModal from '@/components/ProposalModal'

// Define the map component props type
interface MapProps {
  position: [number, number]
  title: string
  city: string
}

// Import Leaflet map dynamically to avoid SSR issues
const DynamicMap = dynamic<MapProps>(
  () => import('@/components/DemandDetailsMap'),
  { 
    ssr: false,
    loading: () => <div className="h-80 rounded-lg bg-slate-100 animate-pulse flex items-center justify-center">Chargement de la carte...</div>
  }
)

export default function DemandDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const demandId = params.id as string
  const { currentUser } = useAuth()

  const [demand, setDemand] = useState<DemandWithFarmer | null>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)

  const fetchDemand = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDemandById(demandId)
      if (data) {
        setDemand(data)
      } else {
        setError('Besoin introuvable')
      }
    } catch (err) {
      console.error('Error fetching demand:', err)
      setError('Erreur lors du chargement des détails')
    } finally {
      setLoading(false)
    }
  }

  const fetchProposals = async () => {
    try {
      const response = await fetch(`/api/proposals?demandId=${demandId}`)
      const data = await response.json()
      setProposals(data.proposals || [])
    } catch (err) {
      console.error('Error fetching proposals:', err)
    }
  }

  useEffect(() => {
    if (demandId) {
      fetchDemand()
      fetchProposals()
    }
  }, [demandId])

  const handleAcceptProposal = async (proposalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir accepter cette proposition ? Toutes les autres seront automatiquement rejetées.')) {
      return
    }

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      })

      if (response.ok) {
        alert('✅ Proposition acceptée avec succès !')
        fetchDemand()
        fetchProposals()
      } else {
        const data = await response.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Error accepting proposal:', error)
      alert('Erreur lors de l\'acceptation')
    }
  }

  const handleRejectProposal = async (proposalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette proposition ?')) {
      return
    }

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })

      if (response.ok) {
        alert('❌ Proposition rejetée')
        fetchProposals()
      } else {
        const data = await response.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error)
      alert('Erreur lors du rejet')
    }
  }

  const getDemandStatusBadge = (status: DemandStatus) => {
    const statusConfig = {
      [DemandStatus.Pending]: { label: 'En attente', variant: 'secondary' as const },
      [DemandStatus.Open]: { label: 'Ouvert', variant: 'default' as const },
      [DemandStatus.Matched]: { label: 'Matché', variant: 'default' as const },
      [DemandStatus.Rejected]: { label: 'Rejeté', variant: 'destructive' as const },
    }
    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement des détails...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !demand) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Besoin introuvable'}</p>
              <Button onClick={() => router.back()}>Retour</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const position: [number, number] = [
    demand.jobLocation.coordinates[1],
    demand.jobLocation.coordinates[0]
  ]

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            onClick={() => window.location.href = '/?view=demandsFeed'} 
            variant="outline"
            className="mb-4"
          >
            ← Retour
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {demand.title}
              </h1>
              <div className="flex items-center gap-3">
                {getDemandStatusBadge(demand.status)}
                <span className="text-slate-600">
                  Publié le {new Date(demand.requiredTimeSlot.start).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Section principale - Informations du besoin */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo du besoin */}
            {demand.photoUrl && (
              <Card>
                <CardContent className="p-0">
                  <img 
                    src={demand.photoUrl} 
                    alt={demand.title}
                    className="w-full h-80 object-cover rounded-t-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Détails du besoin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-emerald-600" />
                  Informations du besoin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Service requis</h3>
                  <p className="text-slate-900 text-lg">{demand.requiredService}</p>
                </div>

                {demand.description && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-1">Description</h3>
                    <p className="text-slate-600 whitespace-pre-line">{demand.description}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-emerald-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-1">Période demandée</h3>
                      <p className="text-sm text-slate-600">
                        Du {new Date(demand.requiredTimeSlot.start).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-slate-600">
                        Au {new Date(demand.requiredTimeSlot.end).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPinIcon className="h-5 w-5 text-emerald-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-1">Localisation</h3>
                      <p className="text-sm text-slate-600">{demand.city}</p>
                      <p className="text-sm text-slate-500">{demand.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-emerald-600" />
                  Localisation sur la carte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 rounded-lg overflow-hidden border border-slate-200">
                  <DynamicMap 
                    position={position}
                    title={demand.title}
                    city={demand.city}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section Propositions - visible uniquement pour l'agriculteur propriétaire */}
            {currentUser && currentUser._id === demand.farmerId && proposals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📝 Propositions reçues
                    <Badge className="ml-2">{proposals.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className={`p-4 rounded-lg border-2 ${
                          proposal.status === 'accepted'
                            ? 'border-green-300 bg-green-50'
                            : proposal.status === 'rejected'
                            ? 'border-red-200 bg-red-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg text-slate-800">
                              {proposal.provider?.name || proposal.providerName}
                            </h4>
                            <p className="text-sm text-slate-500">
                              Soumis le {new Date(proposal.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">
                              {proposal.price} MAD
                            </p>
                            {proposal.status === 'pending' && (
                              <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                                En attente
                              </Badge>
                            )}
                            {proposal.status === 'accepted' && (
                              <Badge className="bg-green-100 text-green-800 mt-1">
                                ✅ Acceptée
                              </Badge>
                            )}
                            {proposal.status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800 mt-1">
                                ❌ Rejetée
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-semibold text-slate-700 mb-1">
                            Description de l'offre:
                          </p>
                          <p className="text-sm text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded">
                            {proposal.description}
                          </p>
                        </div>

                        {proposal.provider && (
                          <div className="flex gap-3 text-sm text-slate-600 mb-3">
                            {proposal.provider.email && (
                              <a
                                href={`mailto:${proposal.provider.email}`}
                                className="text-emerald-600 hover:underline"
                              >
                                📧 {proposal.provider.email}
                              </a>
                            )}
                            {proposal.provider.phone && (
                              <a
                                href={`tel:${proposal.provider.phone}`}
                                className="text-emerald-600 hover:underline"
                              >
                                📞 {proposal.provider.phone}
                              </a>
                            )}
                          </div>
                        )}

                        {proposal.status === 'pending' && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              onClick={() => handleAcceptProposal(proposal.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                              ✓ Accepter
                            </Button>
                            <Button
                              onClick={() => handleRejectProposal(proposal.id)}
                              variant="outline"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              ✗ Rejeter
                            </Button>
                          </div>
                        )}

                        {proposal.status === 'accepted' && (
                          <div className="pt-3 border-t">
                            <Button
                              onClick={() => {
                                sessionStorage.setItem('messageTarget', JSON.stringify({
                                  userId: proposal.providerId,
                                  userName: proposal.provider?.name || proposal.providerName,
                                  demandId: demand._id
                                }));
                                window.location.href = '/?view=messages';
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              💬 Contacter {proposal.provider?.name || 'le prestataire'}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Profil de l'agriculteur */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-emerald-600" />
                  Profil de l'agriculteur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    {demand.farmerName.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-lg text-slate-800">{demand.farmerName}</h3>
                </div>

                {demand.farmer && (
                  <div className="space-y-3">
                    {demand.farmer.email && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <MailIcon className="h-5 w-5 text-slate-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500 mb-1">Email</p>
                          <a 
                            href={`mailto:${demand.farmer.email}`}
                            className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline break-all"
                          >
                            {demand.farmer.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {demand.farmer.phone && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <PhoneIcon className="h-5 w-5 text-slate-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500 mb-1">Téléphone</p>
                          <a 
                            href={`tel:${demand.farmer.phone}`}
                            className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            {demand.farmer.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t space-y-3">
                  <Button 
                    className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    onClick={() => {
                      // Store message target for direct conversation
                      sessionStorage.setItem('messageTarget', JSON.stringify({
                        userId: demand.farmerId,
                        userName: demand.farmerName,
                        demandId: demand._id
                      }));
                      // Navigate to messages page
                      window.location.href = '/?view=messages';
                    }}
                  >
                    💬 Contacter l'agriculteur
                  </Button>

                  {currentUser && currentUser._id !== demand.farmerId && (
                    <Button 
                      className="w-full bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      onClick={() => setIsProposalModalOpen(true)}
                    >
                      📝 Soumettre une Proposition
                    </Button>
                  )}
                </div>

                <div className="text-xs text-slate-500 text-center pt-2">
                  Les coordonnées de l'agriculteur sont protégées et utilisées uniquement pour ce besoin.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      {currentUser && demand && (
        <ProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          demandId={demand._id}
          demandTitle={demand.title}
          providerId={currentUser._id}
          onSuccess={() => {
            fetchDemand()
            fetchProposals()
          }}
        />
      )}
    </div>
  )
}
