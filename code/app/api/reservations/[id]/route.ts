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
    const { action, userId } = body

    // Get the reservation with related data
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        offer: true,
        farmer: true,
        provider: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Determine requester role
    let requesterRole: 'farmer' | 'provider' | null = null
    if (userId === reservation.farmerId) {
      requesterRole = 'farmer'
    } else if (userId === reservation.providerId) {
      requesterRole = 'provider'
    }

    console.log('Reservation action debug:', {
      action,
      userId,
      farmerId: reservation.farmerId,
      providerId: reservation.providerId,
      requesterRole,
      farmerValidated: reservation.farmerValidated,
      providerValidated: reservation.providerValidated
    })

    const startDate = reservation.reservedStart.toLocaleDateString('fr-FR')
    const endDate = reservation.reservedEnd.toLocaleDateString('fr-FR')

    // === ACTION: Prestataire valide la reservation (Etape 1) ===
    if (action === 'provider_validate') {
      if (requesterRole !== 'provider') {
        return NextResponse.json({ error: 'Seul le prestataire peut valider' }, { status: 403 })
      }

      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: { 
          providerValidated: true,
          providerValidatedAt: new Date()
        }
      })

      // Notification a l'agriculteur: Le prestataire a valide, a vous de confirmer !
      await sendNotification({
        receiverId: reservation.farmerId,
        receiverName: reservation.farmerName,
        content: `${reservation.providerName} a valide votre reservation de ${reservation.equipmentType} du ${startDate} au ${endDate}. Confirmez de votre cote pour finaliser !`,
        senderId: reservation.providerId,
        senderName: reservation.providerName,
        relatedOfferId: reservation.offerId,
        actionButton: {
          label: 'Confirmer la reservation',
          targetView: 'myReservations'
        }
      })

      return NextResponse.json({ reservation: transformReservation(updatedReservation) })
    }

    // === ACTION: Agriculteur valide definitivement (Etape 2 - conclusion) ===
    if (action === 'farmer_final_validate') {
      if (requesterRole !== 'farmer') {
        return NextResponse.json({ error: 'Seul l\'agriculteur peut faire la validation finale' }, { status: 403 })
      }
      
      if (!reservation.providerValidated) {
        return NextResponse.json({ error: 'Le prestataire doit d\'abord valider' }, { status: 400 })
      }

      // Marquer comme approuve definitivement
      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: { 
          status: 'approved',
          farmerValidated: true,
          farmerValidatedAt: new Date(),
          approvedAt: new Date()
        }
      })

      // Update offer bookingStatus to 'matched'
      await prisma.offer.update({
        where: { id: reservation.offerId },
        data: { bookingStatus: 'matched' }
      })

      // Notification au prestataire: Reservation confirmee !
      await sendNotification({
        receiverId: reservation.providerId,
        receiverName: reservation.providerName,
        content: `Reservation confirmee ! ${reservation.farmerName} a valide definitivement la reservation de ${reservation.equipmentType}. Periode : ${startDate} au ${endDate}. Vous pouvez telecharger le contrat.`,
        senderId: reservation.farmerId,
        senderName: reservation.farmerName,
        relatedOfferId: reservation.offerId,
        actionButton: {
          label: 'Telecharger le contrat',
          targetView: 'myOffers'
        }
      })

      return NextResponse.json({ reservation: transformReservation(updatedReservation) })
    }

    // === ANCIEN FLUX: approve/reject direct (pour compatibilite) ===
    if (body.status === 'approved') {
      // Si le prestataire approuve directement, on initie la double validation
      if (requesterRole === 'provider' || !requesterRole) {
        const updatedReservation = await prisma.reservation.update({
          where: { id },
          data: {
            providerValidated: true,
            providerValidatedAt: new Date()
          }
        })

        // Notification a l'agriculteur pour qu'il confirme
        await sendNotification({
          receiverId: reservation.farmerId,
          receiverName: reservation.farmerName,
          content: `${reservation.providerName} a accepte votre demande de reservation de ${reservation.equipmentType} du ${startDate} au ${endDate}. Confirmez pour finaliser !`,
          senderId: reservation.providerId,
          senderName: reservation.providerName,
          relatedOfferId: reservation.offerId,
          actionButton: {
            label: 'Confirmer la reservation',
            targetView: 'myReservations'
          }
        })

        return NextResponse.json({ reservation: transformReservation(updatedReservation) })
      }
    } else if (body.status === 'rejected') {
      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: 'rejected'
        }
      })

      await sendNotification({
        receiverId: reservation.farmerId,
        receiverName: reservation.farmerName,
        content: `Reservation non disponible. ${reservation.providerName} ne peut pas accepter votre reservation pour le moment. Consultez d'autres machines disponibles.`,
        senderId: reservation.providerId,
        senderName: reservation.providerName,
        relatedOfferId: reservation.offerId,
        actionButton: {
          label: 'Voir les offres',
          targetView: 'offersFeed'
        }
      })

      return NextResponse.json({ reservation: transformReservation(updatedReservation) })
    } else if (body.status === 'cancelled') {
      const updatedReservation = await prisma.reservation.update({
        where: { id },
        data: {
          status: 'cancelled'
        }
      })

      // Si l'agriculteur annule
      if (requesterRole === 'farmer') {
        await sendNotification({
          receiverId: reservation.providerId,
          receiverName: reservation.providerName,
          content: `${reservation.farmerName} a annule sa demande de reservation de ${reservation.equipmentType}.`,
          senderId: reservation.farmerId,
          senderName: reservation.farmerName,
          relatedOfferId: reservation.offerId,
          actionButton: {
            label: 'Voir mes offres',
            targetView: 'myOffers'
          }
        })
      }

      return NextResponse.json({ reservation: transformReservation(updatedReservation) })
    }

    return NextResponse.json(
      { error: 'Invalid action or status' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Update reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

// Helper function to transform reservation for response
function transformReservation(reservation: any) {
  return {
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
    farmerValidated: reservation.farmerValidated,
    providerValidated: reservation.providerValidated,
    farmerValidatedAt: reservation.farmerValidatedAt,
    providerValidatedAt: reservation.providerValidatedAt,
    reservedTimeSlot: {
      start: reservation.reservedStart,
      end: reservation.reservedEnd
    },
    createdAt: reservation.createdAt,
    approvedAt: reservation.approvedAt
  }
}
