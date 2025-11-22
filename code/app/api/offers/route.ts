import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/offers - List all offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const providerId = searchParams.get('providerId')

    const offers = await prisma.offer.findMany({
      where: {
        ...(status && { status }),
        ...(providerId && { providerId }),
      },
      include: {
        availabilitySlots: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match existing type
    const transformedOffers = offers.map((offer: any) => ({
      _id: offer.id,
      providerId: offer.providerId,
      providerName: offer.providerName,
      equipmentType: offer.equipmentType,
      description: offer.description,
      priceRate: offer.priceRate,
      status: offer.status,
      photoUrl: offer.photoUrl,
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
        // Auto-approve offers upon creation under simplified workflow
        status: body.status || 'approved',
        photoUrl: body.photoUrl || null,
        serviceAreaLat: body.serviceAreaLocation.coordinates[1],
        serviceAreaLon: body.serviceAreaLocation.coordinates[0],
        availabilitySlots: {
          create: body.availability.map((slot: any) => ({
            start: new Date(slot.start),
            end: new Date(slot.end)
          }))
        }
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
      status: offer.status,
      photoUrl: offer.photoUrl,
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
