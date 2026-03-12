import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

// GET /api/litiges/[id] - Get a single litige
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const litige = await prisma.litige.findUnique({
      where: { id },
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
      }
    })

    if (!litige) {
      return NextResponse.json(
        { error: 'Litige not found' },
        { status: 404 }
      )
    }

    const transformedLitige = {
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
    }

    return NextResponse.json({ litige: transformedLitige })
  } catch (error) {
    console.error('Get litige error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch litige' },
      { status: 500 }
    )
  }
}

// PATCH /api/litiges/[id] - Update litige (admin decision or status update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const litige = await prisma.litige.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        prestataire: { select: { id: true, name: true } },
        reservation: { select: { id: true, equipmentType: true, totalCost: true } },
      }
    })

    if (!litige) {
      return NextResponse.json(
        { error: 'Litige not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    // Admin decision: close the litige with a decision
    if (body.decisionIKRI && body.action === 'decide') {
      if (!['client', 'prestataire'].includes(body.decisionIKRI)) {
        return NextResponse.json(
          { error: 'Décision invalide. Doit être "client" ou "prestataire"' },
          { status: 400 }
        )
      }

      updateData.decisionIKRI = body.decisionIKRI
      updateData.statut = body.decisionIKRI === 'client' ? 'clos_client' : 'clos_prestataire'
      updateData.dateCloture = new Date()

      // Update reservation status back based on decision
      // If client wins → reservation stays cancelled/refunded
      // If prestataire wins → reservation goes back to approved
      const newReservationStatus = body.decisionIKRI === 'prestataire' ? 'approved' : 'cancelled'
      await prisma.reservation.update({
        where: { id: litige.reservationId },
        data: { status: newReservationStatus }
      })

      // Notify both parties
      const decisionLabel = body.decisionIKRI === 'client'
        ? `en faveur du client (${litige.client.name})`
        : `en faveur du prestataire (${litige.prestataire.name})`

      try {
        // Notify client
        await sendNotification({
          receiverId: litige.clientId,
          receiverName: litige.client.name,
          content: `⚖️ Le litige concernant "${litige.reservation.equipmentType}" a été résolu ${decisionLabel}.`,
          actionButton: {
            label: '⚖️ Voir mes litiges',
            targetView: 'myLitiges'
          }
        })

        // Notify prestataire
        await sendNotification({
          receiverId: litige.prestataireId,
          receiverName: litige.prestataire.name,
          content: `⚖️ Le litige concernant "${litige.reservation.equipmentType}" a été résolu ${decisionLabel}.`,
          actionButton: {
            label: '⚖️ Voir mes litiges',
            targetView: 'myLitiges'
          }
        })
      } catch (notifError) {
        console.error('Failed to send decision notifications:', notifError)
      }
    }

    // Allow updating description or adding preuves
    if (body.description) updateData.description = body.description
    if (body.preuves) updateData.preuves = body.preuves

    const updatedLitige = await prisma.litige.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { name: true } },
        prestataire: { select: { name: true } },
      }
    })

    const transformedLitige = {
      _id: updatedLitige.id,
      reservationId: updatedLitige.reservationId,
      clientId: updatedLitige.clientId,
      clientName: updatedLitige.client.name,
      prestataireId: updatedLitige.prestataireId,
      prestataireName: updatedLitige.prestataire.name,
      motif: updatedLitige.motif,
      description: updatedLitige.description,
      preuves: updatedLitige.preuves || [],
      statut: updatedLitige.statut,
      decisionIKRI: updatedLitige.decisionIKRI,
      dateOuverture: updatedLitige.dateOuverture,
      dateCloture: updatedLitige.dateCloture,
      createdAt: updatedLitige.createdAt,
      updatedAt: updatedLitige.updatedAt,
    }

    return NextResponse.json({ litige: transformedLitige })
  } catch (error) {
    console.error('Update litige error:', error)
    return NextResponse.json(
      { error: 'Failed to update litige' },
      { status: 500 }
    )
  }
}
