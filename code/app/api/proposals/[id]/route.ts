import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

// Helper to determine whose turn it is based on negotiation round
const getWhoseTurn = (negotiationRound: number): 'farmer' | 'provider' => {
  // Round 0: Provider made initial proposal, farmer's turn
  // Round 1: Farmer countered, provider's turn
  // Round 2: Provider countered, farmer's turn
  // Round 3: Farmer countered, provider's turn (final)
  // Round 4+: Provider responded, farmer has final say
  return negotiationRound % 2 === 0 ? 'farmer' : 'provider'
}

// Helper to check if counter is still allowed
const canCounter = (negotiationRound: number, role: 'farmer' | 'provider'): boolean => {
  // Max 3 contre-offres total:
  // Round 0: Proposition initiale du provider → Farmer peut contrer
  // Round 1: Farmer a contré → Provider peut contrer (1 seule fois)
  // Round 2: Provider a contré → Farmer peut contrer
  // Round 3: Farmer a contré → Provider peut SEULEMENT accepter/refuser (plus de contre-offre)
  if (role === 'farmer') {
    return negotiationRound === 0 || negotiationRound === 2
  } else {
    // Provider ne peut contrer qu'au round 1 (une seule fois)
    return negotiationRound === 1
  }
}

// PATCH /api/proposals/[id] - Accept, reject, or counter a proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const body = await request.json()
    const { action, counterPrice, userId } = body // action: 'accept', 'reject', 'counter', 'final_accept', 'final_reject'

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action field' },
        { status: 400 }
      )
    }

    // Get the proposal with related data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        demand: {
          include: {
            farmer: true
          }
        },
        provider: true
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // For counter and accept/reject during negotiation, check if it's the right person's turn
    const currentRound = proposal.negotiationRound
    const whoseTurn = getWhoseTurn(currentRound)
    
    // Determine if the requester is farmer or provider
    let requesterRole: 'farmer' | 'provider' | null = null
    if (userId === proposal.demand.farmerId) {
      requesterRole = 'farmer'
    } else if (userId === proposal.providerId) {
      requesterRole = 'provider'
    }

    // Debug log for troubleshooting
    console.log('Proposal action debug:', {
      action,
      userId,
      farmerId: proposal.demand.farmerId,
      providerId: proposal.providerId,
      requesterRole,
      whoseTurn,
      currentRound
    })

    // Handle final approval flow (when provider accepts after negotiation)
    if (action === 'final_accept' || action === 'final_reject') {
      if (!proposal.pendingFarmerFinalApproval) {
        return NextResponse.json(
          { error: 'This proposal is not pending final approval' },
          { status: 400 }
        )
      }
      
      if (requesterRole !== 'farmer') {
        return NextResponse.json(
          { error: 'Only the farmer can give final approval' },
          { status: 403 }
        )
      }

      if (action === 'final_accept') {
        // Farmer gives final approval - proposal is accepted
        const updatedProposal = await prisma.proposal.update({
          where: { id: proposalId },
          data: { 
            status: 'accepted',
            pendingFarmerFinalApproval: false
          },
          include: {
            provider: true,
            demand: true
          }
        })

        // Update demand status to 'matched'
        await prisma.demand.update({
          where: { id: proposal.demandId },
          data: { status: 'matched' }
        })

        // Auto-reject all other pending proposals
        await prisma.proposal.updateMany({
          where: {
            demandId: proposal.demandId,
            id: { not: proposalId },
            status: 'pending'
          },
          data: { status: 'rejected' }
        })

        // Notify provider of final acceptance
        const finalPrice = proposal.currentPrice || proposal.price
        await sendNotification({
          receiverId: proposal.providerId,
          receiverName: proposal.provider.name,
          content: `✅ Confirmation finale ! ${proposal.demand.farmerName} a validé définitivement votre accord pour ${proposal.demand.requiredService}. Prix final : ${finalPrice} MAD. Contactez-le pour finaliser les détails.`,
          senderId: proposal.demand.farmerId,
          senderName: proposal.demand.farmerName,
          relatedDemandId: proposal.demandId
        })

        return NextResponse.json({ proposal: updatedProposal })
      } else {
        // Farmer rejects at final stage
        const updatedProposal = await prisma.proposal.update({
          where: { id: proposalId },
          data: { 
            status: 'rejected',
            pendingFarmerFinalApproval: false
          },
          include: {
            provider: true,
            demand: true
          }
        })

        // Notify provider of rejection
        await sendNotification({
          receiverId: proposal.providerId,
          receiverName: proposal.provider.name,
          content: `❌ Désolé, ${proposal.demand.farmerName} a finalement décidé de ne pas accepter votre proposition pour ${proposal.demand.requiredService}. Continuez à consulter les autres demandes.`,
          senderId: proposal.demand.farmerId,
          senderName: proposal.demand.farmerName,
          relatedDemandId: proposal.demandId
        })

        return NextResponse.json({ proposal: updatedProposal })
      }
    }

    // Check if proposal is still pending for regular actions
    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: 'This proposal has already been processed' },
        { status: 400 }
      )
    }

    // Handle counter offer
    if (action === 'counter') {
      if (!counterPrice || counterPrice <= 0) {
        return NextResponse.json(
          { error: 'Counter price is required and must be positive' },
          { status: 400 }
        )
      }

      // Verify the requester is authorized
      if (!requesterRole) {
        return NextResponse.json(
          { error: 'Unauthorized: You are not the farmer or provider for this proposal' },
          { status: 403 }
        )
      }

      // Verify it's the right person's turn
      if (requesterRole !== whoseTurn) {
        return NextResponse.json(
          { error: `Ce n'est pas votre tour de contrer. En attente de réponse du ${whoseTurn === 'farmer' ? 'fermier' : 'prestataire'}` },
          { status: 403 }
        )
      }

      // Check if counter is still allowed at this round
      if (!canCounter(currentRound, requesterRole)) {
        return NextResponse.json(
          { error: 'Nombre maximum de contre-offres atteint' },
          { status: 400 }
        )
      }

      // Build counter offer history
      const history = (proposal.counterOfferHistory as any[]) || []
      history.push({
        round: currentRound + 1,
        by: requesterRole,
        price: counterPrice,
        timestamp: new Date().toISOString()
      })

      // Update proposal with counter offer
      const updatedProposal = await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          negotiationRound: currentRound + 1,
          currentPrice: counterPrice,
          lastCounterBy: requesterRole,
          counterOfferHistory: history
        },
        include: {
          provider: true,
          demand: true
        }
      })

      // Send notification to the other party
      const previousPrice = proposal.currentPrice || proposal.price
      if (requesterRole === 'farmer') {
        await sendNotification({
          receiverId: proposal.providerId,
          receiverName: proposal.provider.name,
          content: `💰 Contre-offre reçue ! ${proposal.demand.farmerName} propose ${counterPrice} MAD au lieu de ${previousPrice} MAD pour ${proposal.demand.requiredService}. Consultez vos propositions pour répondre.`,
          senderId: proposal.demand.farmerId,
          senderName: proposal.demand.farmerName,
          relatedDemandId: proposal.demandId
        })
      } else {
        await sendNotification({
          receiverId: proposal.demand.farmerId,
          receiverName: proposal.demand.farmerName,
          content: `💰 Contre-offre reçue ! ${proposal.provider.name} propose ${counterPrice} MAD au lieu de ${previousPrice} MAD pour votre demande de ${proposal.demand.requiredService}. Consultez vos demandes pour répondre.`,
          senderId: proposal.providerId,
          senderName: proposal.provider.name,
          relatedDemandId: proposal.demandId
        })
      }

      return NextResponse.json({ proposal: updatedProposal })
    }

    if (action === 'accept') {
      // Determine who is accepting
      const currentPrice = proposal.currentPrice || proposal.price
      
      // If provider is accepting after negotiation, farmer needs final approval
      if (requesterRole === 'provider' && proposal.negotiationRound > 0) {
        const updatedProposal = await prisma.proposal.update({
          where: { id: proposalId },
          data: { 
            pendingFarmerFinalApproval: true
          },
          include: {
            provider: true,
            demand: true
          }
        })

        // Notify farmer that provider accepted and needs final approval
        await sendNotification({
          receiverId: proposal.demand.farmerId,
          receiverName: proposal.demand.farmerName,
          content: `✅ ${proposal.provider.name} a accepté votre offre de ${currentPrice} MAD pour ${proposal.demand.requiredService}. Donnez votre approbation finale pour conclure l'accord.`,
          senderId: proposal.providerId,
          senderName: proposal.provider.name,
          relatedDemandId: proposal.demandId
        })

        return NextResponse.json({ proposal: updatedProposal })
      }

      // Direct acceptance (farmer accepts or no negotiation happened)
      const updatedProposal = await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'accepted' },
        include: {
          provider: true,
          demand: true
        }
      })

      // Update demand status to 'matched'
      await prisma.demand.update({
        where: { id: proposal.demandId },
        data: { status: 'matched' }
      })

      // Auto-reject all other pending proposals for this demand
      const otherProposals = await prisma.proposal.findMany({
        where: {
          demandId: proposal.demandId,
          id: { not: proposalId },
          status: 'pending'
        },
        include: {
          provider: true
        }
      })

      await prisma.proposal.updateMany({
        where: {
          demandId: proposal.demandId,
          id: { not: proposalId },
          status: 'pending'
        },
        data: { status: 'rejected' }
      })

      // Notification 3: Agriculteur accepte proposition → Prestataire
      await sendNotification({
        receiverId: proposal.providerId,
        receiverName: proposal.provider.name,
        content: `✅ Félicitations ! Votre proposition pour ${proposal.demand.requiredService} a été acceptée par ${proposal.demand.farmerName}. Prix accepté : ${currentPrice} MAD/jour. Contactez-le pour finaliser les détails.`,
        senderId: proposal.demand.farmerId,
        senderName: proposal.demand.farmerName,
        relatedDemandId: proposal.demandId
      })

      // Notification 4: Auto-reject autres propositions → Prestataires
      for (const otherProposal of otherProposals) {
        await sendNotification({
          receiverId: otherProposal.providerId,
          receiverName: otherProposal.provider.name,
          content: `❌ Votre proposition pour ${proposal.demand.requiredService} n'a pas été retenue cette fois. Continuez à consulter les autres demandes disponibles.`,
          senderName: 'Système YKRI',
          relatedDemandId: proposal.demandId
        })
      }

      return NextResponse.json({ proposal: updatedProposal })

    } else if (action === 'reject') {
      // Reject the proposal
      const updatedProposal = await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: 'rejected' },
        include: {
          provider: true,
          demand: true
        }
      })

      // Notification 4: Agriculteur rejette proposition → Prestataire
      await sendNotification({
        receiverId: proposal.providerId,
        receiverName: proposal.provider.name,
        content: `❌ Votre proposition pour ${proposal.demand.requiredService} n'a pas été retenue cette fois. Continuez à consulter les autres demandes disponibles.`,
        senderId: proposal.demand.farmerId,
        senderName: proposal.demand.farmerName,
        relatedDemandId: proposal.demandId
      })

      return NextResponse.json({ proposal: updatedProposal })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Update proposal error:', error)
    console.error('Error details:', error?.message, error?.code, error?.meta)
    return NextResponse.json(
      { error: 'Failed to update proposal: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
