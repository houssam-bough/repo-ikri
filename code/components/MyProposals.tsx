'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Proposal, ProposalStatus } from '@/types'
import { SetAppView } from '@/types'

interface MyProposalsProps {
  setView: SetAppView
}

export default function MyProposals({ setView }: MyProposalsProps) {
  const { currentUser } = useAuth()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  useEffect(() => {
    fetchProposals()
  }, [currentUser])

  const fetchProposals = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/proposals?providerId=${currentUser._id}`)
      const data = await response.json()
      setProposals(data.proposals || [])
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

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Mes Propositions</h1>
            <p className="text-slate-600 mt-2">
              {proposals.length} proposition{proposals.length > 1 ? 's' : ''} soumise{proposals.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setView('dashboard')} variant="outline">
            ← Retour au Dashboard
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-emerald-600' : ''}
          >
            Toutes ({proposals.length})
          </Button>
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'default' : 'outline'}
            className={filter === 'pending' ? 'bg-yellow-600' : ''}
          >
            En attente ({proposals.filter(p => p.status === 'pending').length})
          </Button>
          <Button
            onClick={() => setFilter('accepted')}
            variant={filter === 'accepted' ? 'default' : 'outline'}
            className={filter === 'accepted' ? 'bg-green-600' : ''}
          >
            Acceptées ({proposals.filter(p => p.status === 'accepted').length})
          </Button>
          <Button
            onClick={() => setFilter('rejected')}
            variant={filter === 'rejected' ? 'default' : 'outline'}
            className={filter === 'rejected' ? 'bg-red-600' : ''}
          >
            Rejetées ({proposals.filter(p => p.status === 'rejected').length})
          </Button>
        </div>

        {/* Liste des propositions */}
        {filteredProposals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">Aucune proposition trouvée</p>
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
                        {proposal.demand?.title || 'Demande supprimée'}
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        Service: {proposal.demand?.requiredService || 'N/A'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Ville: {proposal.demand?.city || 'N/A'}
                      </p>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Message de félicitations si acceptée */}
                  {proposal.status === 'accepted' && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-green-800 font-semibold text-center">
                        🎉 Félicitations ! Votre proposition a été acceptée !
                      </p>
                      <p className="text-green-700 text-sm text-center mt-2">
                        L'agriculteur va vous contacter prochainement.
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-2">Description de votre offre</p>
                    <p className="text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg">
                      {proposal.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => window.location.href = `/demands/${proposal.demandId}`}
                      variant="outline"
                      className="w-full"
                    >
                      Voir les détails du besoin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
