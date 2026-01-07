import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'

// GET /api/reservations - List reservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const providerId = searchParams.get('providerId')
    const offerId = searchParams.get('offerId')
    const status = searchParams.get('status')

    const reservations = await prisma.reservation.findMany({
      where: {
        ...(farmerId && { farmerId }),
        ...(providerId && { providerId }),
        ...(offerId && { offerId }),
        ...(status && { status }),
      },
      include: {
        provider: {
          select: {
            phone: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match existing type
    const transformedReservations = reservations.map((res: any) => ({
      _id: res.id,
      farmerId: res.farmerId,
      farmerName: res.farmerName,
      farmerPhone: res.farmerPhone,
      offerId: res.offerId,
      providerId: res.providerId,
      providerName: res.providerName,
      providerPhone: res.provider?.phone,
      providerEmail: res.provider?.email,
      equipmentType: res.equipmentType,
      priceRate: res.priceRate,
      totalCost: res.totalCost,
      status: res.status,
      farmerValidated: res.farmerValidated,
      providerValidated: res.providerValidated,
      farmerValidatedAt: res.farmerValidatedAt,
      providerValidatedAt: res.providerValidatedAt,
      reservedTimeSlot: {
        start: res.reservedStart,
        end: res.reservedEnd
      },
      createdAt: res.createdAt,
      approvedAt: res.approvedAt
    }))

    return NextResponse.json({ reservations: transformedReservations })
  } catch (error) {
    console.error('Get reservations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

// POST /api/reservations - Create reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // CRITICAL: Prevent self-reservations (hybrid accounts)
    // Fetch offer to check providerId
    const offer = await prisma.offer.findUnique({
      where: { id: body.offerId },
      include: {
        availabilitySlots: true
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offre introuvable' },
        { status: 404 }
      )
    }

    if (offer.providerId === body.farmerId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas réserver votre propre machine' },
        { status: 400 }
      )
    }

    // VALIDATION CRITIQUE : Vérifier que le créneau demandé est inclus dans les disponibilités
    const requestedStart = new Date(body.reservedTimeSlot.start)
    const requestedEnd = new Date(body.reservedTimeSlot.end)

    const isWithinAvailableSlot = offer.availabilitySlots.some(slot => {
      const slotStart = new Date(slot.start)
      const slotEnd = new Date(slot.end)
      // Le créneau demandé doit être entièrement inclus dans le slot
      return requestedStart >= slotStart && requestedEnd <= slotEnd
    })

    if (!isWithinAvailableSlot) {
      return NextResponse.json(
        { error: 'Les dates sélectionnées ne correspondent pas aux créneaux de disponibilité de la machine' },
        { status: 400 }
      )
    }

    const reservation = await prisma.reservation.create({
      data: {
        farmerId: body.farmerId,
        farmerName: body.farmerName,
        farmerPhone: body.farmerPhone || null,
        offerId: body.offerId,
        providerId: body.providerId,
        providerName: body.providerName,
        equipmentType: body.equipmentType,
        priceRate: body.priceRate,
        totalCost: body.totalCost || null,
        status: body.status || 'pending',
        reservedStart: new Date(body.reservedTimeSlot.start),
        reservedEnd: new Date(body.reservedTimeSlot.end)
      }
    })

    // Update offer bookingStatus to 'negotiating' when first reservation is created
    await prisma.offer.update({
      where: { id: body.offerId },
      data: { bookingStatus: 'negotiating' }
    })

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

    // Notification 6: Agriculteur crée réservation → Prestataire
    try {
      const startDate = new Date(body.reservedTimeSlot.start).toLocaleDateString('fr-FR')
      const endDate = new Date(body.reservedTimeSlot.end).toLocaleDateString('fr-FR')
      await sendNotification({
        receiverId: body.providerId,
        receiverName: body.providerName,
        content: `📅 Nouvelle demande de réservation ! ${body.farmerName} souhaite réserver votre ${body.equipmentType} du ${startDate} au ${endDate}. Total : ${body.totalCost || body.priceRate} MAD.`,
        senderId: body.farmerId,
        senderName: body.farmerName,
        relatedOfferId: body.offerId,
        actionButton: {
          label: '📦 Voir mes offres',
          targetView: 'myOffers'
        }
      })
    } catch (notifError) {
      console.error('Failed to send reservation notification:', notifError)
    }

    return NextResponse.json({ reservation: transformedReservation }, { status: 201 })
  } catch (error) {
    console.error('Create reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}
