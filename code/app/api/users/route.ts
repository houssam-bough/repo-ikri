import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const approvalStatus = searchParams.get('approvalStatus')

    const users = await prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(approvalStatus && { approvalStatus }),
      },
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
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match existing type
    const transformedUsers = users.map((user: any) => ({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approvalStatus: user.approvalStatus,
      location: {
        type: 'Point' as const,
        coordinates: [user.locationLon, user.locationLat]
      },
      createdAt: user.createdAt
    }))

    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
