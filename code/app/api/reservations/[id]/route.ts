import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Update offer bookingStatus to 'matched' when reservation is approved
    if (body.status === 'approved') {
      await prisma.offer.update({
        where: { id: reservation.offerId },
        data: { bookingStatus: 'matched' }
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
