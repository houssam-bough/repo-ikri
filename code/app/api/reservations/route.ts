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
      equipmentType: res.equipmentType,
      priceRate: res.priceRate,
      totalCost: res.totalCost,
      status: res.status,
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
        relatedOfferId: body.offerId
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
