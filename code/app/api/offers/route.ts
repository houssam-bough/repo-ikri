import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/offers - List all offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingStatus = searchParams.get('bookingStatus')
    const providerId = searchParams.get('providerId')

    const offers = await prisma.offer.findMany({
      where: {
        ...(bookingStatus && { bookingStatus }),
        ...(providerId && { providerId }),
      },
      include: {
        availabilitySlots: true,
        machineTemplate: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match existing type
    const transformedOffers = offers.map((offer: any) => ({
      _id: offer.id,
      providerId: offer.providerId,
      providerName: offer.providerName,
      equipmentType: offer.equipmentType,
      machineType: offer.machineTemplate?.name || offer.equipmentType,
      description: offer.description,
      priceRate: offer.priceRate,
      bookingStatus: offer.bookingStatus,
      photoUrl: offer.photoUrl,
      city: offer.city,
      address: offer.address,
      customFields: offer.customFields || {},
      createdAt: offer.createdAt,
      availabilitySlots: offer.availabilitySlots.map((slot: any) => ({
        startDate: slot.start.toISOString(),
        endDate: slot.end.toISOString()
      })),
      availability: offer.availabilitySlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end
      })),
      serviceAreaLocation: {
        type: 'Point' as const,
        coordinates: [offer.serviceAreaLon, offer.serviceAreaLat]
      }
    }))

    return NextResponse.json({ offers: transformedOffers })
  } catch (error) {
    console.error('Get offers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  }
}

// POST /api/offers - Create new offer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const offer = await prisma.offer.create({
      data: {
        providerId: body.providerId,
        providerName: body.providerName,
        machineTemplateId: body.machineTemplateId || null,
        equipmentType: body.equipmentType,
        description: body.description,
        customFields: body.customFields || null,
        priceRate: body.priceRate,
        city: body.city,
        address: body.address,
        // Default booking status is 'waiting' (no reservations yet)
        bookingStatus: 'waiting',
        photoUrl: body.photoUrl || null,
        serviceAreaLat: body.serviceAreaLocation.coordinates[1],
        serviceAreaLon: body.serviceAreaLocation.coordinates[0],
        // Availability is now managed by reservations, not predefined slots
        ...(body.availability && body.availability.length > 0 && {
          availabilitySlots: {
            create: body.availability.map((slot: any) => ({
              start: new Date(slot.start),
              end: new Date(slot.end)
            }))
          }
        })
      },
      include: {
        availabilitySlots: true
      }
    })

    // Transform to match existing type
    const transformedOffer = {
      _id: offer.id,
      providerId: offer.providerId,
      providerName: offer.providerName,
      equipmentType: offer.equipmentType,
      description: offer.description,
      priceRate: offer.priceRate,
      bookingStatus: offer.bookingStatus,
      photoUrl: offer.photoUrl,
      city: offer.city,
      address: offer.address,
      availability: offer.availabilitySlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end
      })),
      serviceAreaLocation: {
        type: 'Point' as const,
        coordinates: [offer.serviceAreaLon, offer.serviceAreaLat]
      }
    }

    return NextResponse.json({ offer: transformedOffer }, { status: 201 })
  } catch (error) {
    console.error('Create offer error:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}
