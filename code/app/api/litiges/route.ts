import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

// Increase body size limit for base64 image uploads
export const maxDuration = 30
export const dynamic = 'force-dynamic'

// GET /api/litiges - List litiges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const prestataireId = searchParams.get('prestataireId')
    const reservationId = searchParams.get('reservationId')
    const statut = searchParams.get('statut')

    const litiges = await prisma.litige.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(prestataireId && { prestataireId }),
        ...(reservationId && { reservationId }),
        ...(statut && { statut }),
      },
      include: {
        reservation: {
          select: {
            id: true,
            equipmentType: true,
            priceRate: true,
            totalCost: true,
            reservedStart: true,
            reservedEnd: true,
            status: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        prestataire: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { dateOuverture: 'desc' }
    })

    // Transform to match client-side type
    const transformedLitiges = litiges.map((litige: any) => ({
      _id: litige.id,
      reservationId: litige.reservationId,
      clientId: litige.clientId,
      clientName: litige.client.name,
      clientEmail: litige.client.email,
      clientPhone: litige.client.phone,
      prestataireId: litige.prestataireId,
      prestataireName: litige.prestataire.name,
      prestataireEmail: litige.prestataire.email,
      prestatairePhone: litige.prestataire.phone,
      motif: litige.motif,
      description: litige.description,
      preuves: litige.preuves || [],
      statut: litige.statut,
      decisionIKRI: litige.decisionIKRI,
      dateOuverture: litige.dateOuverture,
      dateCloture: litige.dateCloture,
      reservation: litige.reservation ? {
        _id: litige.reservation.id,
        equipmentType: litige.reservation.equipmentType,
        priceRate: litige.reservation.priceRate,
        totalCost: litige.reservation.totalCost,
        reservedTimeSlot: {
          start: litige.reservation.reservedStart,
          end: litige.reservation.reservedEnd,
        },
        status: litige.reservation.status,
      } : null,
      createdAt: litige.createdAt,
      updatedAt: litige.updatedAt,
    }))

    return NextResponse.json({ litiges: transformedLitiges })
  } catch (error) {
    console.error('Get litiges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch litiges' },
      { status: 500 }
    )
  }
}

// POST /api/litiges - Create a new litige (only client/farmer can open)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.reservationId || !body.clientId || !body.prestataireId || !body.motif || !body.description) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: reservationId, clientId, prestataireId, motif, description' },
        { status: 400 }
      )
    }

    // Verify the reservation exists and belongs to this client
    const reservation = await prisma.reservation.findUnique({
      where: { id: body.reservationId },
      include: {
        farmer: { select: { name: true } },
        provider: { select: { name: true } },
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    if (reservation.farmerId !== body.clientId) {
      return NextResponse.json(
        { error: 'Seul le client de cette réservation peut ouvrir un litige' },
        { status: 403 }
      )
    }

    // Check that reservation is approved (can only dispute completed/approved reservations)
    if (reservation.status !== 'approved') {
      return NextResponse.json(
        { error: 'Un litige ne peut être ouvert que sur une réservation approuvée' },
        { status: 400 }
      )
    }

    // Check if a litige already exists for this reservation
    const existingLitige = await prisma.litige.findFirst({
      where: {
        reservationId: body.reservationId,
        statut: 'en_cours',
      }
    })

    if (existingLitige) {
      return NextResponse.json(
        { error: 'Un litige est déjà en cours pour cette réservation' },
        { status: 409 }
      )
    }

    // Create the litige
    const litige = await prisma.litige.create({
      data: {
        reservationId: body.reservationId,
        clientId: body.clientId,
        prestataireId: body.prestataireId,
        motif: body.motif,
        description: body.description,
        preuves: body.preuves || [],
        statut: 'en_cours',
      }
    })

    // Update reservation status to 'litige'
    await prisma.reservation.update({
      where: { id: body.reservationId },
      data: { status: 'litige' }
    })

    // Notify the prestataire
    try {
      const motifLabels: Record<string, string> = {
        no_show: 'Non-présentation',
        retard: 'Retard',
        materiel_defectueux: 'Matériel défectueux',
        autre: 'Autre',
      }
      await sendNotification({
        receiverId: body.prestataireId,
        receiverName: reservation.provider.name,
        content: `⚠️ Un litige a été ouvert par ${reservation.farmer.name} concernant votre ${reservation.equipmentType}. Motif : ${motifLabels[body.motif] || body.motif}.`,
        senderId: body.clientId,
        senderName: reservation.farmer.name,
        actionButton: {
          label: '⚖️ Voir mes litiges',
          targetView: 'myLitiges'
        }
      })
    } catch (notifError) {
      console.error('Failed to send litige notification:', notifError)
    }

    // Transform response
    const transformedLitige = {
      _id: litige.id,
      reservationId: litige.reservationId,
      clientId: litige.clientId,
      clientName: reservation.farmer.name,
      prestataireId: litige.prestataireId,
      prestataireName: reservation.provider.name,
      motif: litige.motif,
      description: litige.description,
      preuves: litige.preuves || [],
      statut: litige.statut,
      decisionIKRI: litige.decisionIKRI,
      dateOuverture: litige.dateOuverture,
      dateCloture: litige.dateCloture,
      createdAt: litige.createdAt,
      updatedAt: litige.updatedAt,
    }

    return NextResponse.json({ litige: transformedLitige }, { status: 201 })
  } catch (error: any) {
    console.error('Create litige error:', error?.message || error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create litige' },
      { status: 500 }
    )
  }
}
