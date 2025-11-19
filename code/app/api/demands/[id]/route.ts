import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const demand = await prisma.demand.findUnique({
      where: { id: params.id }
    });

    if (!demand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    // Transform to existing type format
    const transformedDemand = {
      _id: demand.id,
      farmerId: demand.farmerId,
      farmerName: demand.farmerName,
      requiredService: demand.requiredService,
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
      status: demand.status
    };

    return NextResponse.json({ demand: transformedDemand });
  } catch (error) {
    console.error('Get demand error:', error);
    return NextResponse.json({ error: 'Failed to get demand' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, ...otherUpdates } = body;

    const updated = await prisma.demand.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.demand.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete demand error:', error);
    return NextResponse.json({ error: 'Failed to delete demand' }, { status: 500 });
  }
}
