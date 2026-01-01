import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

// GET /api/proposals - Get proposals for a demand or by a provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const demandId = searchParams.get('demandId')
    const providerId = searchParams.get('providerId')

    const proposals = await prisma.proposal.findMany({
      where: {
        ...(demandId && { demandId }),
        ...(providerId && { providerId }),
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            locationLat: true,
            locationLon: true,
          }
        },
        demand: {
          select: {
            id: true,
            title: true,
            city: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ proposals })
  } catch (error) {
    console.error('Get proposals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    )
  }
}

// POST /api/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { demandId, providerId, price, description } = body

    // Validate required fields
    if (!demandId || !providerId || !price || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if demand exists and is open
    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      include: { farmer: true }
    })

    if (!demand) {
      return NextResponse.json(
        { error: 'Demand not found' },
        { status: 404 }
      )
    }

    if (demand.status === 'matched') {
      return NextResponse.json(
        { error: 'This demand is no longer accepting proposals' },
        { status: 400 }
      )
    }

    // CRITICAL: Prevent self-proposals (hybrid accounts)
    if (demand.farmerId === providerId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas répondre à votre propre demande' },
        { status: 400 }
      )
    }

    // Check if provider already submitted a proposal for this demand
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        demandId,
        providerId,
      }
    })

    if (existingProposal) {
      return NextResponse.json(
        { error: 'You have already submitted a proposal for this demand' },
        { status: 400 }
      )
    }

    // Get provider details for notification
    const provider = await prisma.user.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      console.error('Provider not found with ID:', providerId)
      return NextResponse.json({ 
        error: 'Votre compte n\'existe plus dans la base de données. Veuillez vous déconnecter et vous reconnecter.' 
      }, { status: 401 })
    }

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        demandId,
        providerId,
        providerName: provider.name,
        price: parseFloat(price),
        description,
        status: 'pending',
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    })

    // Update demand status to 'negotiating' if it was 'waiting'
    if (demand.status === 'waiting') {
      await prisma.demand.update({
        where: { id: demandId },
        data: { status: 'negotiating' }
      })
    }

    // Notification 2: Prestataire fait proposition → Agriculteur
    await sendNotification({
      receiverId: demand.farmerId,
      receiverName: demand.farmerName,
      content: `💡 Nouvelle proposition reçue ! ${provider.name} a fait une offre pour votre demande de ${demand.requiredService}. Prix proposé : ${price} MAD/jour. Description : ${description.substring(0, 100)}...`,
      senderId: providerId,
      senderName: provider.name,
      relatedDemandId: demandId
    })

    return NextResponse.json({ proposal }, { status: 201 })
  } catch (error) {
    console.error('Create proposal error:', error)
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    )
  }
}
