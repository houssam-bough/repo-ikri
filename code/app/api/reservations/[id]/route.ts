import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.status === 'approved' && { approvedAt: new Date() })
      }
    })

    // Notification 7 & 8: Prestataire accepte/refuse réservation → Agriculteur
    if (body.status === 'approved') {
      await prisma.offer.update({
        where: { id: reservation.offerId },
        data: { bookingStatus: 'matched' }
      })

      const startDate = reservation.reservedStart.toLocaleDateString('fr-FR')
      const endDate = reservation.reservedEnd.toLocaleDateString('fr-FR')
      await sendNotification({
        receiverId: reservation.farmerId,
        receiverName: reservation.farmerName,
        content: `✅ Réservation confirmée ! Votre réservation de ${reservation.equipmentType} a été acceptée par ${reservation.providerName}. Période : ${startDate} au ${endDate}.`,
        senderId: reservation.providerId,
        senderName: reservation.providerName,
        relatedOfferId: reservation.offerId
      })
    } else if (body.status === 'refused') {
      await sendNotification({
        receiverId: reservation.farmerId,
        receiverName: reservation.farmerName,
        content: `❌ Réservation non disponible. ${reservation.providerName} ne peut pas accepter votre réservation pour le moment. Consultez d'autres machines disponibles.`,
        senderId: reservation.providerId,
        senderName: reservation.providerName,
        relatedOfferId: reservation.offerId
      })
    }

    // Transform to match existing type
    const transformedReservation = {
      _id: reservation.id,
      farmerId: reservation.farmerId,
      farmerName: reservation.farmerName,
      farmerPhone: reservation.farmerPhone,
      offerId: reservation.offerId,
      providerId: reservation.providerId,
      providerName: reservation.providerName,
      equipmentType: reservation.equipmentType,
      priceRate: reservation.priceRate,
      totalCost: reservation.totalCost,
      status: reservation.status,
      reservedTimeSlot: {
        start: reservation.reservedStart,
        end: reservation.reservedEnd
      },
      createdAt: reservation.createdAt,
      approvedAt: reservation.approvedAt
    }

    return NextResponse.json({ reservation: transformedReservation })
  } catch (error) {
    console.error('Update reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}
