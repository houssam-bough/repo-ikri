import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

      // Notify the accepted provider
      await prisma.message.create({
        data: {
          senderId: proposal.demand.farmerId,
          senderName: proposal.demand.farmerName,
          receiverId: proposal.providerId,
          receiverName: proposal.provider.name,
          content: `🎉 Félicitations ! Votre proposition a été acceptée pour "${proposal.demand.title}". Prix accepté: ${proposal.price} MAD. L'agriculteur va vous contacter prochainement.`,
          relatedDemandId: proposal.demandId,
          read: false
        }
      })

      // Notify other providers
      for (const otherProposal of otherProposals) {
        await prisma.message.create({
          data: {
            senderId: proposal.demand.farmerId,
            senderName: 'Système IKRI',
            receiverId: otherProposal.providerId,
            receiverName: otherProposal.provider.name,
            content: `Votre proposition pour "${proposal.demand.title}" n'a pas été retenue. Une autre proposition a été acceptée.`,
            relatedDemandId: proposal.demandId,
            read: false
          }
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

      // Notify the provider
      await prisma.message.create({
        data: {
          senderId: proposal.demand.farmerId,
          senderName: proposal.demand.farmerName,
          receiverId: proposal.providerId,
          receiverName: proposal.provider.name,
          content: `Votre proposition pour "${proposal.demand.title}" a été rejetée.`,
          relatedDemandId: proposal.demandId,
          read: false
        }
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
