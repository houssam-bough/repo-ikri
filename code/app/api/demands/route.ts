import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        requiredService: body.requiredService,
        description: body.description || null,
        // Auto-open demands upon creation under simplified workflow
        status: body.status || 'open',
        photoUrl: body.photoUrl || null,
        jobLocationLat: body.jobLocation.coordinates[1],
        jobLocationLon: body.jobLocation.coordinates[0],
        requiredStart: new Date(body.requiredTimeSlot.start),
        requiredEnd: new Date(body.requiredTimeSlot.end)
      }
    })

    // Transform to match existing type
    const transformedDemand = {
      _id: demand.id,
      farmerId: demand.farmerId,
      farmerName: demand.farmerName,
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
