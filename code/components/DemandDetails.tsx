// TODO: Test after migration
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { type Demand, type Proposal, ProposalStatus } from '../types';
import ProposalModal from './ProposalModal';
import DynamicMap, { type MapMarker } from './DynamicMap';

interface DemandDetailsProps {
    demandId: string;
    onBack: () => void;
}

const DemandDetails: React.FC<DemandDetailsProps> = ({ demandId, onBack }) => {
    const { currentUser } = useAuth();
    const [demand, setDemand] = useState<Demand | null>(null);
    const [loading, setLoading] = useState(true);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [showAcceptConfirm, setShowAcceptConfirm] = useState<string | null>(null);
    const [showRefuseConfirm, setShowRefuseConfirm] = useState<string | null>(null);
    const [processingProposal, setProcessingProposal] = useState(false);

    useEffect(() => {
        fetchDemandDetails();
    }, [demandId]);

    const fetchDemandDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/demands/${demandId}`);
            const data = await response.json();
            setDemand(data.demand);
        } catch (error) {
            console.error('Error fetching demand details:', error);
            alert('Erreur lors du chargement des détails');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptProposal = async (proposalId: string) => {
        if (!currentUser) return;

        setProcessingProposal(true);
        try {
            const response = await fetch(`/api/proposals/${proposalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'accept',
                    farmerId: currentUser._id
                })
            });

            if (response.ok) {
                alert('✅ Proposition acceptée avec succès !');
                setShowAcceptConfirm(null);
                fetchDemandDetails(); // Refresh data
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de l\'acceptation');
            }
        } catch (error) {
            console.error('Error accepting proposal:', error);
            alert('Erreur lors de l\'acceptation');
        } finally {
            setProcessingProposal(false);
        }
    };

    const handleRefuseProposal = async (proposalId: string) => {
        if (!currentUser) return;

        setProcessingProposal(true);
        try {
            const response = await fetch(`/api/proposals/${proposalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'refuse',
                    farmerId: currentUser._id
                })
            });

            if (response.ok) {
                alert('Proposition refusée');
                setShowRefuseConfirm(null);
                fetchDemandDetails();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors du refus');
            }
        } catch (error) {
            console.error('Error refusing proposal:', error);
            alert('Erreur lors du refus');
        } finally {
            setProcessingProposal(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: 'bg-amber-100 text-amber-800',
            open: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return `px-3 py-1 rounded-full text-sm font-semibold ${badges[status as keyof typeof badges] || 'bg-gray-100'}`;
    };

    const getProposalStatusBadge = (status: string) => {
        const badges = {
            pending: { class: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'EN ATTENTE', icon: '⏳' },
            accepted: { class: 'bg-green-100 text-green-800 border-green-300', text: '✅ ACCEPTÉE', icon: '✓' },
            refused: { class: 'bg-red-100 text-red-800 border-red-300', text: '❌ REFUSÉE', icon: '✗' },
            auto_rejected: { class: 'bg-gray-100 text-gray-600 border-gray-300', text: 'AUTO-REJETÉE', icon: '○' },
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${badge.class}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    const getMapMarker = (): MapMarker[] => {
        if (!demand) return [];
        return [{
            position: [demand.jobLocation.coordinates[1], demand.jobLocation.coordinates[0]],
            popupContent: `<strong>${demand.title}</strong><br/>${demand.city}`,
            type: 'demand'
        }];
    };

    const isProvider = currentUser && demand && currentUser._id !== demand.farmerId;
    const isFarmer = currentUser && demand && currentUser._id === demand.farmerId;
    const hasSubmittedProposal = demand?.proposals?.some(p => p.providerId === currentUser?._id);

    if (loading) {
        return (
            <div className="container mx-auto p-8">
                <p>Chargement...</p>
            </div>
        );
    }

    if (!demand) {
        return (
            <div className="container mx-auto p-8">
                <p>Besoin introuvable</p>
                <Button onClick={onBack} className="mt-4">Retour</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-7xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button onClick={onBack} className="bg-slate-200 hover:bg-slate-300 text-slate-700">
                    ← Retour
                </Button>
                <span className={getStatusBadge(demand.status)}>
                    {demand.status.toUpperCase()}
                </span>
            </div>

            {/* Section 1: Informations du besoin */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">{demand.title}</h1>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Type de machine</p>
                            <p className="text-lg font-semibold text-emerald-600">{demand.requiredService}</p>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium text-slate-600">Localisation</p>
                            <p className="text-lg">{demand.city}</p>
                            <p className="text-sm text-slate-500">{demand.address}</p>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium text-slate-600">Période souhaitée</p>
                            <p className="text-sm">
                                Du {new Date(demand.requiredTimeSlot.start).toLocaleDateString('fr-FR', { 
                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                            </p>
                            <p className="text-sm">
                                Au {new Date(demand.requiredTimeSlot.end).toLocaleDateString('fr-FR', { 
                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-slate-600 mb-2">Description complète</p>
                            <p className="text-slate-700 whitespace-pre-wrap">{demand.description}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-600 mb-2">Localisation sur la carte</p>
                        <DynamicMap
                            center={[demand.jobLocation.coordinates[1], demand.jobLocation.coordinates[0]]}
                            markers={getMapMarker()}
                            zoom={14}
                        />
                        {demand.photoUrl && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-slate-600 mb-2">Photo du site</p>
                                <img src={demand.photoUrl} alt="Site" className="rounded-lg max-h-64 w-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Profil de l'agriculteur */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Agriculteur</h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {demand.farmerName.charAt(0)}
                    </div>
                    <div>
                        <p className="text-lg font-semibold">{demand.farmerName}</p>
                        {isFarmer || demand.status === 'accepted' ? (
                            <>
                                <p className="text-sm text-slate-600">{demand.farmer?.email}</p>
                                <p className="text-sm text-slate-600">{demand.farmer?.phone || 'N/A'}</p>
                            </>
                        ) : (
                            <p className="text-xs text-slate-500">Coordonnées visibles après acceptation</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 3: Zone de proposition (Provider only) */}
            {isProvider && demand.status !== 'accepted' && demand.status !== 'closed' && (
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">
                        {hasSubmittedProposal ? '✓ Votre proposition' : 'Soumettre une Proposition'}
                    </h2>
                    {hasSubmittedProposal ? (
                        <p className="text-slate-600">
                            Vous avez déjà soumis une proposition pour ce besoin. L'agriculteur examinera votre offre.
                        </p>
                    ) : (
                        <>
                            <p className="text-slate-600 mb-4">
                                Intéressé par ce besoin ? Soumettez votre proposition avec votre prix et les détails de votre offre.
                            </p>
                            <Button
                                onClick={() => setShowProposalModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                                📝 Soumettre une Proposition
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Section 4: Propositions reçues (Farmer only) */}
            {isFarmer && demand.proposals && demand.proposals.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">
                        Propositions Reçues ({demand.proposals.length})
                    </h2>
                    <div className="space-y-4">
                        {demand.proposals.map((proposal) => (
                            <div
                                key={proposal._id}
                                className={`border-2 rounded-lg p-6 ${
                                    proposal.status === 'accepted' ? 'border-green-400 bg-green-50' :
                                    proposal.status === 'refused' ? 'border-red-200 bg-red-50 opacity-60' :
                                    proposal.status === 'auto_rejected' ? 'border-gray-200 bg-gray-50 opacity-50' :
                                    'border-slate-200 bg-white'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                            {proposal.providerName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">{proposal.providerName}</p>
                                            <p className="text-sm text-slate-500">
                                                {new Date(proposal.createdAt).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                    {getProposalStatusBadge(proposal.status)}
                                </div>

                                <div className="mb-4">
                                    <p className="text-3xl font-bold text-emerald-600 mb-2">
                                        {proposal.proposedPrice} MAD
                                    </p>
                                    <p className="text-slate-700 whitespace-pre-wrap">{proposal.description}</p>
                                </div>

                                {proposal.status === 'accepted' && proposal.provider && (
                                    <div className="mt-4 p-4 bg-green-100 rounded-lg">
                                        <p className="font-semibold text-green-800 mb-2">Coordonnées du prestataire :</p>
                                        <p className="text-sm">📧 {proposal.provider.email}</p>
                                        <p className="text-sm">📞 {proposal.provider.phone || 'N/A'}</p>
                                        <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white">
                                            💬 Contacter le prestataire
                                        </Button>
                                    </div>
                                )}

                                {proposal.status === 'pending' && (
                                    <div className="flex gap-3 mt-4">
                                        <Button
                                            onClick={() => setShowAcceptConfirm(proposal._id)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                                            disabled={processingProposal}
                                        >
                                            ✓ Accepter
                                        </Button>
                                        <Button
                                            onClick={() => setShowRefuseConfirm(proposal._id)}
                                            className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 font-semibold"
                                            disabled={processingProposal}
                                        >
                                            ✗ Refuser
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showProposalModal && (
                <ProposalModal
                    demand={demand}
                    onClose={() => setShowProposalModal(false)}
                    onSuccess={() => {
                        setShowProposalModal(false);
                        fetchDemandDetails();
                    }}
                />
            )}

            {/* Accept Confirmation Modal */}
            {showAcceptConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">⚠️ Confirmer l'acceptation</h3>
                        <p className="text-slate-600 mb-6">
                            Vous êtes sur le point d'accepter cette proposition. Les autres propositions seront automatiquement rejetées. 
                            Êtes-vous sûr ?
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowAcceptConfirm(null)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700"
                                disabled={processingProposal}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={() => handleAcceptProposal(showAcceptConfirm)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                disabled={processingProposal}
                            >
                                {processingProposal ? 'Traitement...' : 'Oui, Accepter'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refuse Confirmation Modal */}
            {showRefuseConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Refuser cette proposition ?</h3>
                        <p className="text-slate-600 mb-6">
                            Êtes-vous sûr de vouloir refuser cette proposition ?
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowRefuseConfirm(null)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700"
                                disabled={processingProposal}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={() => handleRefuseProposal(showRefuseConfirm)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                disabled={processingProposal}
                            >
                                {processingProposal ? 'Traitement...' : 'Oui, Refuser'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemandDetails;
