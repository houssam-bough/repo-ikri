import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        availabilitySlots: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

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
      customFields: offer.customFields || {},
      availability: offer.availabilitySlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end
      })),
      serviceAreaLocation: {
        type: 'Point' as const,
        coordinates: [offer.serviceAreaLon, offer.serviceAreaLat]
      },
      provider: {
        email: offer.provider.email,
        phone: offer.provider.phone
      }
    }

    return NextResponse.json({ offer: transformedOffer })
  } catch (error) {
    console.error('Get offer error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Delete existing availability slots if new ones provided
    if (body.availability) {
      await prisma.availabilitySlot.deleteMany({
        where: { offerId: id }
      })
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...(body.equipmentType && { equipmentType: body.equipmentType }),
        ...(body.description && { description: body.description }),
        ...(body.priceRate && { priceRate: body.priceRate }),
        ...(body.status && { status: body.status }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
        ...(body.availability && {
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
      availability: offer.availabilitySlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end
      })),
      serviceAreaLocation: {
        type: 'Point' as const,
        coordinates: [offer.serviceAreaLon, offer.serviceAreaLat]
      }
    }

    return NextResponse.json({ offer: transformedOffer })
  } catch (error) {
    console.error('Update offer error:', error)
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.offer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete offer error:', error)
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Extract city and address from serviceAreaLocation if provided
    let updateData: any = {}
    
    if (body.equipmentType) updateData.equipmentType = body.equipmentType
    if (body.description) updateData.description = body.description
    if (body.priceRate !== undefined) updateData.priceRate = body.priceRate
    if (body.city) updateData.city = body.city
    if (body.address) updateData.address = body.address
    if (body.photoUrl) updateData.photoUrl = body.photoUrl
    if (body.customFields) updateData.customFields = body.customFields

    // Update location if provided
    if (body.serviceAreaLocation) {
      updateData.serviceAreaLon = body.serviceAreaLocation.coordinates[0]
      updateData.serviceAreaLat = body.serviceAreaLocation.coordinates[1]
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
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
      customFields: offer.customFields || {},
      availability: offer.availabilitySlots.map((slot: any) => ({
        start: slot.start,
        end: slot.end
      })),
      availabilitySlots: offer.availabilitySlots.map((slot: any) => ({
        startDate: slot.start.toISOString(),
        endDate: slot.end.toISOString()
      })),
      serviceAreaLocation: {
        type: 'Point' as const,
        coordinates: [offer.serviceAreaLon, offer.serviceAreaLat]
      }
    }

    return NextResponse.json({ offer: transformedOffer })
  } catch (error) {
    console.error('Update offer error:', error)
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
}

