import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        locationLat: true,
        locationLon: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Transform to match existing type
    const transformedUser = {
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approvalStatus: user.approvalStatus,
      location: {
        type: 'Point' as const,
        coordinates: [user.locationLon, user.locationLat]
      }
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
    const { name, phone, location, role, approvalStatus } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (role) updateData.role = role
    if (approvalStatus) updateData.approvalStatus = approvalStatus
    if (location) {
      updateData.locationLat = location.coordinates[1]
      updateData.locationLon = location.coordinates[0]
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        approvalStatus: true,
        locationLat: true,
        locationLon: true
      }
    })

    // Transform to match existing type
    const transformedUser = {
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approvalStatus: user.approvalStatus,
      location: {
        type: 'Point' as const,
        coordinates: [user.locationLon, user.locationLat]
      }
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
