import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

// PATCH /api/proposals/[id] - Accept or reject a proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const body = await request.json()
    const { action } = body // action: 'accept' or 'reject'

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

    // Check if proposal is still pending
    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: 'This proposal has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      // Accept the proposal
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
        content: `✅ Félicitations ! Votre proposition pour ${proposal.demand.requiredService} a été acceptée par ${proposal.demand.farmerName}. Prix accepté : ${proposal.price} MAD/jour. Contactez-le pour finaliser les détails.`,
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

  } catch (error) {
    console.error('Update proposal error:', error)
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    )
  }
}
