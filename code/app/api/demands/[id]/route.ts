import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            locationLat: true,
            locationLon: true,
          }
        }
      }
    });

    if (!demand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    // Transform to existing type format
    const transformedDemand = {
      _id: demand.id,
      id: demand.id,
      farmerId: demand.farmerId,
      farmerName: demand.farmerName,
      farmer: demand.farmer, // Include farmer details
      title: demand.title,
      city: demand.city,
      address: demand.address,
      requiredService: demand.requiredService,
      serviceType: demand.serviceType,
      cropType: demand.cropType,
      area: demand.area,
      requiredTimeSlot: {
        start: demand.requiredStart,
        end: demand.requiredEnd
      },
      jobLocation: {
        type: 'Point' as const,
        coordinates: [demand.jobLocationLon, demand.jobLocationLat]
      },
      description: demand.description,
      photoUrl: demand.photoUrl,
      status: demand.status,
      createdAt: demand.createdAt,
      updatedAt: demand.updatedAt
    };

    return NextResponse.json({ demand: transformedDemand });
  } catch (error) {
    console.error('Get demand error:', error);
    return NextResponse.json({ error: 'Failed to get demand' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json();
    const { status, ...otherUpdates } = body;

    const updated = await prisma.demand.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...otherUpdates
      }
    });

    // Transform response
    const transformedDemand = {
      _id: updated.id,
      farmerId: updated.farmerId,
      farmerName: updated.farmerName,
      requiredService: updated.requiredService,
      requiredTimeSlot: {
        start: updated.requiredStart,
        end: updated.requiredEnd
      },
      jobLocation: {
        type: 'Point' as const,
        coordinates: [updated.jobLocationLon, updated.jobLocationLat]
      },
      description: updated.description,
      photoUrl: updated.photoUrl,
      status: updated.status
    };

    return NextResponse.json({ demand: transformedDemand });
  } catch (error) {
    console.error('Update demand error:', error);
    return NextResponse.json({ error: 'Failed to update demand' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.demand.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete demand error:', error);
    return NextResponse.json({ error: 'Failed to delete demand' }, { status: 500 });
  }
}
