import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBulkNotifications, getUsersNearby } from '@/lib/notifications'

// GET /api/demands - List all demands
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const farmerId = searchParams.get('farmerId')

    const demands = await prisma.demand.findMany({
      where: {
        ...(status && { status }),
        ...(farmerId && { farmerId }),
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match existing type
    const transformedDemands = demands.map((demand: any) => ({
      _id: demand.id,
      farmerId: demand.farmerId,
      farmerName: demand.farmerName,
      title: demand.title || '',
      city: demand.city || '',
      address: demand.address || '',
      requiredService: demand.requiredService,
      serviceType: demand.serviceType,
      cropType: demand.cropType,
      area: demand.area,
      description: demand.description,
      status: demand.status,
      photoUrl: demand.photoUrl,
      jobLocation: {
        type: 'Point' as const,
        coordinates: [demand.jobLocationLon, demand.jobLocationLat]
      },
      requiredTimeSlot: {
        start: demand.requiredStart,
        end: demand.requiredEnd
      }
    }))

    return NextResponse.json({ demands: transformedDemands })
  } catch (error) {
    console.error('Get demands error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demands' },
      { status: 500 }
    )
  }
}

// POST /api/demands - Create new demand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const demand = await prisma.demand.create({
      data: {
        farmerId: body.farmerId,
        farmerName: body.farmerName,
        title: body.title,
        city: body.city,
        address: body.address,
        requiredService: body.requiredService,
        serviceType: body.serviceType || null,
        cropType: body.cropType || null,
        area: body.area || null,
        description: body.description || null,
        // Auto-open demands upon creation under simplified workflow
        status: body.status || 'waiting',
        photoUrl: body.photoUrl || null,
        jobLocationLat: body.jobLocation.coordinates[1],
        jobLocationLon: body.jobLocation.coordinates[0],
        requiredStart: new Date(body.requiredTimeSlot.start),
        requiredEnd: new Date(body.requiredTimeSlot.end)
      }
    })

    // Notification 1: Agriculteur publie demande → Prestataires à proximité
    try {
      const nearbyProviders = await getUsersNearby(
        body.jobLocation.coordinates[1],
        body.jobLocation.coordinates[0],
        50,
        'Provider'
      )

      if (nearbyProviders.length > 0) {
        await sendBulkNotifications(
          nearbyProviders,
          `🌾 Nouvelle demande disponible ! Un agriculteur recherche ${body.requiredService} à ${body.city}. Consultez-la et faites votre proposition.`,
          {
            senderName: 'YKRI Plateforme',
            relatedDemandId: demand.id
          }
        )
        console.log(`Sent notifications to ${nearbyProviders.length} providers about new demand`)
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError)
      // Don't fail the demand creation if notifications fail
    }

    // Transform to match existing type
    const transformedDemand = {
      _id: demand.id,
      farmerId: demand.farmerId,
      farmerName: demand.farmerName,
      title: demand.title,
      city: demand.city,
      address: demand.address,
      requiredService: demand.requiredService,
      description: demand.description,
      status: demand.status,
      photoUrl: demand.photoUrl,
      jobLocation: {
        type: 'Point' as const,
        coordinates: [demand.jobLocationLon, demand.jobLocationLat]
      },
      requiredTimeSlot: {
        start: demand.requiredStart,
        end: demand.requiredEnd
      }
    }

    return NextResponse.json({ demand: transformedDemand }, { status: 201 })
  } catch (error) {
    console.error('Create demand error:', error)
    return NextResponse.json(
      { error: 'Failed to create demand' },
      { status: 500 }
    )
  }
}
